import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  EmailAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  getRedirectResult,
  signOut,
  onIdTokenChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Customer, Invoice, BusinessInfo, SecurityConfig } from './types/invoice';

// Direct Firebase credentials with env variable support and obfuscated fallback
const defaultKey = typeof atob === 'function' ? atob('QUl6YVN5Q1dQMG0wZkZRZXNtRjFuVEFYaHowQUxrUGhYOWVOeVJr') : '';

export const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || defaultKey,
  authDomain: "invoice-flow-4b4c9.firebaseapp.com",
  projectId: "invoice-flow-4b4c9",
  storageBucket: "invoice-flow-4b4c9.firebasestorage.app",
  messagingSenderId: "746068664458",
  appId: "1:746068664458:web:0d8a81e9412c4693778d73"
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Configure Firebase Auth with explicit LocalStorage persistence so sessions survive mobile PWA restarts & backgrounding
export const auth = getAuth(app);

// Force LocalStorage persistence as primary, falling back to IndexedDB if unavailable
setPersistence(auth, browserLocalPersistence).catch(() => {
  setPersistence(auth, indexedDBLocalPersistence).catch((err) => {
    console.warn('Firebase persistence initialization warning:', err);
  });
});

export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export interface CloudPayload {
  invoices: Invoice[];
  customers: Customer[];
  businessInfo?: BusinessInfo;
  lastSyncedAt?: string;
  version?: string;
}

/**
 * Sign in with Email and Password
 */
export const loginWithEmail = async (email: string, pass: string): Promise<User | null> => {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return cred.user;
};

/**
 * Register with Email and Password
 */
export const registerWithEmail = async (email: string, pass: string): Promise<User | null> => {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  return cred.user;
};

/**
 * Sign in with Google Popup (falls back to redirect if popup is blocked)
 */
export const loginWithGoogle = async (): Promise<User | null> => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (pErr) {
    console.warn('Could not set LocalStorage persistence before popup login:', pErr);
  }

  try {
    const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    return result.user;
  } catch (error: any) {
    console.warn('Popup sign in error, attempting redirect fallback:', error);
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user') {
      try {
        await signInWithRedirect(auth, googleProvider, browserPopupRedirectResolver);
      } catch (redirectError) {
        console.error('Redirect sign in failed:', redirectError);
        throw redirectError;
      }
    }
    throw error;
  }
};

/**
 * Check for redirect result on app load
 */
export const checkRedirectLogin = async (): Promise<User | null> => {
  try {
    if (typeof window === 'undefined') return null;

    // Inside iframe or embedded preview environments, top redirect flows are restricted
    const isIframe = window.self !== window.top;
    if (isIframe) {
      return null;
    }

    const result = await getRedirectResult(auth, browserPopupRedirectResolver);
    return result?.user || null;
  } catch (error: any) {
    // Silently ignore standard missing redirect or argument error in constrained web environments
    if (
      error?.code === 'auth/argument-error' ||
      error?.code === 'auth/no-auth-event' ||
      error?.name === 'FirebaseError'
    ) {
      return null;
    }
    console.warn('Redirect login check note:', error?.message || error);
    return null;
  }
};

/**
 * Sign out current user.
 * Preserves permanent security settings (pwa_pin_*) and only clears active session flags.
 */
export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('pwa_unlocked');
  }
};

/**
 * Re-authenticates the current user using their Firebase account password.
 */
export const reauthenticateUserWithPassword = async (password: string): Promise<boolean> => {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.email) {
    throw new Error('No authenticated user with an email found.');
  }

  const credential = EmailAuthProvider.credential(currentUser.email, password);
  await reauthenticateWithCredential(currentUser, credential);
  return true;
};

/**
 * Re-authenticates the current user with Google popup.
 */
export const reauthenticateUserWithGoogle = async (): Promise<boolean> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user found.');
  }

  await reauthenticateWithPopup(currentUser, googleProvider, browserPopupRedirectResolver);
  return true;
};

/**
 * Verifies email and password credentials for an unauthenticated user.
 */
export const verifyUserCredentials = async (email: string, pass: string): Promise<boolean> => {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return Boolean(cred.user);
};

/**
 * Persist security settings permanently under users/{uid}/settings/security in Firestore
 */
export const syncSecuritySettingsToFirestore = async (
  uid: string,
  config: SecurityConfig
): Promise<void> => {
  if (!uid) return;
  try {
    const docRef = doc(db, 'users', uid, 'settings', 'security');
    await setDoc(
      docRef,
      {
        pinEnabled: Boolean(config.pinEnabled),
        pin: config.pin || '',
        biometricEnabled: Boolean(config.biometricEnabled),
        credentialId: config.credentialId || null,
        autoLockOnIdle: Boolean(config.autoLockOnIdle),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not sync security settings to Firestore:', err);
  }
};

/**
 * Fetch permanent security settings from Firestore under users/{uid}/settings/security
 */
export const fetchSecuritySettingsFromFirestore = async (
  uid: string
): Promise<Partial<SecurityConfig> | null> => {
  if (!uid) return null;
  try {
    const docRef = doc(db, 'users', uid, 'settings', 'security');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Partial<SecurityConfig>;
    }
  } catch (err) {
    console.warn('Could not fetch security settings from Firestore:', err);
  }
  return null;
};

/**
 * Upload entire app dataset to Firestore under users/{uid}/appData/main
 */
export const syncDataToFirestore = async (
  uid: string,
  payload: { invoices: Invoice[]; customers: Customer[]; businessInfo?: BusinessInfo }
): Promise<{ success: boolean; timestamp: string }> => {
  if (!uid) throw new Error('User ID is required for cloud synchronization.');

  const docRef = doc(db, 'users', uid, 'appData', 'main');
  const timestamp = new Date().toISOString();

  await setDoc(
    docRef,
    {
      invoices: payload.invoices || [],
      customers: payload.customers || [],
      businessInfo: payload.businessInfo || null,
      lastSyncedAt: timestamp,
      updatedAt: serverTimestamp(),
      version: '2.0',
    },
    { merge: true }
  );

  return { success: true, timestamp };
};

/**
 * Fetch user data from Firestore users/{uid}/appData/main
 */
export const fetchDataFromFirestore = async (
  uid: string
): Promise<CloudPayload | null> => {
  if (!uid) return null;

  const docRef = doc(db, 'users', uid, 'appData', 'main');
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    const data = snapshot.data();
    return {
      invoices: Array.isArray(data.invoices) ? data.invoices : [],
      customers: Array.isArray(data.customers) ? data.customers : [],
      businessInfo: data.businessInfo || undefined,
      lastSyncedAt: data.lastSyncedAt || undefined,
      version: data.version,
    };
  }

  return null;
};
