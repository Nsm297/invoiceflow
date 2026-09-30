import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  loginWithGoogle as firebaseLoginWithGoogle,
  logoutUser as firebaseLogoutUser,
  loginWithEmail as firebaseLoginWithEmail,
  registerWithEmail as firebaseRegisterWithEmail,
} from '../firebase';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<User | null>;
  loginWithEmail: (email: string, pass: string) => Promise<User | null>;
  registerWithEmail: (email: string, pass: string) => Promise<User | null>;
  logout: () => Promise<void>;
  isInAppBrowser: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => null,
  loginWithEmail: async () => null,
  registerWithEmail: async () => null,
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isInAppBrowser, setIsInAppBrowser] = useState<boolean>(false);

  useEffect(() => {
    setIsInAppBrowser(detectInAppBrowser());

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Only set loading to false AFTER Firebase checks local session
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<User | null> => {
    return await firebaseLoginWithGoogle();
  };

  const loginWithEmail = async (email: string, pass: string): Promise<User | null> => {
    return await firebaseLoginWithEmail(email, pass);
  };

  const registerWithEmail = async (email: string, pass: string): Promise<User | null> => {
    return await firebaseRegisterWithEmail(email, pass);
  };

  const logout = async (): Promise<void> => {
    await firebaseLogoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
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
