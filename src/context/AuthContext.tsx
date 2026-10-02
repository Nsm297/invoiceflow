import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
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

export interface AuthContextType {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isInAppBrowser, setIsInAppBrowser] = useState<boolean>(false);

  useEffect(() => {
    setIsInAppBrowser(detectInAppBrowser());

    // 4-second safety net to force loading completion and prevent infinite spinner
    const safetyTimeout = setTimeout(() => {
      setLoading((prevLoading) => {
        if (prevLoading) {
          console.warn('Auth check timed out, unblocking UI...');
          return false;
        }
        return false;
      });
    }, 4000);

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        clearTimeout(safetyTimeout);
        if (currentUser) {
          setUser(currentUser);
          try {
            localStorage.setItem('has_active_session', 'true');
          } catch {}
        } else {
          setUser(null);
          try {
            localStorage.removeItem('has_active_session');
          } catch {}
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
    user?.providerData?.some((p) => p.providerId === 'google.com')
  );

  const loginWithGoogle = async (): Promise<User | null> => {
    const u = await firebaseLoginWithGoogle();
    if (u) {
      try {
        localStorage.setItem('has_active_session', 'true');
      } catch {}
    }
    return u;
  };

  const loginWithEmail = async (email: string, pass: string): Promise<User | null> => {
    const u = await firebaseLoginWithEmail(email, pass);
    if (u) {
      try {
        localStorage.setItem('has_active_session', 'true');
      } catch {}
    }
    return u;
  };

  const registerWithEmail = async (email: string, pass: string): Promise<User | null> => {
    const u = await firebaseRegisterWithEmail(email, pass);
    if (u) {
      try {
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

  const logout = async (): Promise<void> => {
    try {
      localStorage.removeItem('has_active_session');
    } catch {}
    setUser(null);
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
