import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Customer, Invoice, BusinessInfo } from '../types/invoice';

export const firebaseConfig = {
  apiKey: "AIzaSyCWP0m0fFQesmF1nTAXhz0ALkPhX9eNyRk",
  authDomain: "invoice-flow-4b4c9.firebaseapp.com",
  projectId: "invoice-flow-4b4c9",
  storageBucket: "invoice-flow-4b4c9.firebasestorage.app",
  messagingSenderId: "746068664458",
  appId: "1:746068664458:web:0d8a81e9412c4693778d73"
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
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
 * Sign in with Google Popup (falls back to redirect if popup is blocked)
 */
export const loginWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.warn('Popup sign in error, attempting redirect fallback:', error);
    // If popup was blocked or closed, try redirect
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user') {
      try {
        await signInWithRedirect(auth, googleProvider);
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
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error) {
    console.error('Error getting redirect result:', error);
    return null;
  }
};

/**
 * Sign out current user
 */
export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
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
