import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  auth,
  loginWithGoogle as firebaseLoginWithGoogle,
  logoutUser as firebaseLogoutUser,
  loginWithEmail as firebaseLoginWithEmail,
  registerWithEmail as firebaseRegisterWithEmail,
  reauthenticateUserWithPassword as firebaseReauthenticateWithPassword,
  reauthenticateUserWithGoogle as firebaseReauthenticateWithGoogle,
  verifyUserCredentials as firebaseVerifyUserCredentials,
} from '../firebase';

export interface StoredUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  providerData?: any[];
}

export type AuthUser = User | StoredUser;

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  authLoading: boolean;
  isGoogleUser: boolean;
  loginWithGoogle: () => Promise<User | null>;
  loginWithEmail: (email: string, pass: string) => Promise<User | null>;
  registerWithEmail: (email: string, pass: string) => Promise<User | null>;
  reauthenticateWithPassword: (pass: string) => Promise<boolean>;
  reauthenticateWithGoogle: () => Promise<boolean>;
  verifyCredentials: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isInAppBrowser: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  authLoading: true,
  isGoogleUser: false,
  loginWithGoogle: async () => null,
  loginWithEmail: async () => null,
  registerWithEmail: async () => null,
  reauthenticateWithPassword: async () => false,
  reauthenticateWithGoogle: async () => false,
  verifyCredentials: async () => false,
  logout: async () => {},
  isInAppBrowser: false,
});

/**
 * Detects if the web app is opened inside an in-app browser (like WhatsApp / Instagram webview)
 */
export function detectInAppBrowser(): boolean {
  if (typeof window === 'undefined' || !window.navigator) return false;
  const ua = window.navigator.userAgent || window.navigator.vendor || '';
  return (
    /FBAN|FBAV|Instagram|WhatsApp|Line\/|musical_ly|BytedanceWebview|Snapchat|Twitter|LinkedInApp|MicroMessenger/i.test(ua) ||
    (/\b(wv|WebView)\b/i.test(ua) && /Android/i.test(ua)) ||
    (/iPhone|iPod|iPad/i.test(ua) && !/Safari/i.test(ua) && !/CriOS/i.test(ua) && !/FxiOS/i.test(ua))
  );
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State read from LocalStorage FIRST (Instant Load)
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof localStorage === 'undefined') return null;
    try {
      const saved = localStorage.getItem('invoiceflow_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof localStorage === 'undefined') return true;
    try {
      return !localStorage.getItem('invoiceflow_user_session');
    } catch {
      return true;
    }
  });

  const [isInAppBrowser, setIsInAppBrowser] = useState<boolean>(false);

  useEffect(() => {
    setIsInAppBrowser(detectInAppBrowser());

    // 4-second safety net to force loading completion and prevent infinite spinner
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 4000);

    // 2. Firebase Auth sync in background
    const unsubscribe = auth.onAuthStateChanged(
      (currentUser) => {
        clearTimeout(safetyTimeout);
        if (currentUser) {
          const sessionData: StoredUser = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
          };
          setUser(currentUser);
          try {
            localStorage.setItem('invoiceflow_user_session', JSON.stringify(sessionData));
            localStorage.setItem('app_user_uid', currentUser.uid);
            localStorage.setItem('has_active_session', 'true');
          } catch {}
        } else {
          // CRITICAL: Do NOT clear local session on transient background nulls
          let saved: string | null = null;
          try {
            saved = localStorage.getItem('invoiceflow_user_session');
          } catch {}

          if (!saved) {
            setUser(null);
          } else {
            console.log('Preserving offline-first session snapshot from localStorage');
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Auth Listener Error:', error);
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, []);

  const isGoogleUser = Boolean(
    user && 'providerData' in user && user.providerData?.some((p: any) => p?.providerId === 'google.com')
  );

  const loginWithGoogle = async (): Promise<User | null> => {
    const u = await firebaseLoginWithGoogle();
    if (u) {
      const sessionData: StoredUser = {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        photoURL: u.photoURL,
      };
      setUser(u);
      try {
        localStorage.setItem('invoiceflow_user_session', JSON.stringify(sessionData));
        localStorage.setItem('app_user_uid', u.uid);
        localStorage.setItem('has_active_session', 'true');
      } catch {}
    }
    return u;
  };

  const loginWithEmail = async (email: string, pass: string): Promise<User | null> => {
    const u = await firebaseLoginWithEmail(email, pass);
    if (u) {
      const sessionData: StoredUser = {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        photoURL: u.photoURL,
      };
      setUser(u);
      try {
        localStorage.setItem('invoiceflow_user_session', JSON.stringify(sessionData));
        localStorage.setItem('app_user_uid', u.uid);
        localStorage.setItem('has_active_session', 'true');
      } catch {}
    }
    return u;
  };

  const registerWithEmail = async (email: string, pass: string): Promise<User | null> => {
    const u = await firebaseRegisterWithEmail(email, pass);
    if (u) {
      const sessionData: StoredUser = {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        photoURL: u.photoURL,
      };
      setUser(u);
      try {
        localStorage.setItem('invoiceflow_user_session', JSON.stringify(sessionData));
        localStorage.setItem('app_user_uid', u.uid);
        localStorage.setItem('has_active_session', 'true');
      } catch {}
    }
    return u;
  };

  const reauthenticateWithPassword = async (pass: string): Promise<boolean> => {
    return await firebaseReauthenticateWithPassword(pass);
  };

  const reauthenticateWithGoogle = async (): Promise<boolean> => {
    return await firebaseReauthenticateWithGoogle();
  };

  const verifyCredentials = async (email: string, pass: string): Promise<boolean> => {
    return await firebaseVerifyUserCredentials(email, pass);
  };

  // 3. User ONLY logged out when clicking explicit Logout button
  const logout = async (): Promise<void> => {
    try {
      localStorage.removeItem('invoiceflow_user_session');
      localStorage.removeItem('app_user_uid');
      localStorage.removeItem('has_active_session');
    } catch {}
    setUser(null);
    try {
      await auth.signOut();
    } catch (err) {
      console.error('SignOut Error:', err);
    }
    await firebaseLogoutUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authLoading: loading,
        isGoogleUser,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        reauthenticateWithPassword,
        reauthenticateWithGoogle,
        verifyCredentials,
        logout,
        isInAppBrowser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
