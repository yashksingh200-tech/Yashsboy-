import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AuthUser } from '../types';
import {
  auth,
  googleProvider,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  FirebaseUser,
} from '../lib/firebase';
import { encryptSync, decryptSync } from '../utils/encryption';
import { logSecurityEvent } from '../utils/securityGuard';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  securityNotice: string | null;
  clearError: () => void;
  clearSecurityNotice: () => void;
  loginWithGoogle: () => Promise<boolean>;
  logout: (reason?: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  getAuthToken: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const saveUserSession = (authUser: AuthUser) => {
    setUser(authUser);
    try {
      const encryptedSession = encryptSync(authUser, 'session_sec_key');
      localStorage.setItem('daily_companion_session_user', encryptedSession);
    } catch (e) {
      console.warn('Failed to encrypt session storage:', e);
    }
  };

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const authUser: AuthUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            photoURL: firebaseUser.photoURL || undefined,
            provider: 'google',
            createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
            token: idToken,
          };
          saveUserSession(authUser);
        } catch (err) {
          console.error('Error fetching Firebase ID token:', err);
        }
      } else {
        setUser(null);
        localStorage.removeItem('daily_companion_session_user');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Inactivity auto-logout handler (30 minutes of inactivity)
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        logout('Inactivity timeout (30 minutes). You were automatically logged out to safeguard your data.');
      }, INACTIVITY_LIMIT_MS);
    };

    const activityEvents = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach((ev) => window.addEventListener(ev, resetInactivityTimer));

    resetInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetInactivityTimer));
    };
  }, [user]);

  const clearError = () => setError(null);
  const clearSecurityNotice = () => setSecurityNotice(null);

  const getAuthToken = (): string => {
    return user?.token || 'guest_token';
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      const authUser: AuthUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        photoURL: firebaseUser.photoURL || undefined,
        provider: 'google',
        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
        token: idToken,
      };

      saveUserSession(authUser);
      logSecurityEvent('LOGIN_SUCCESS', `Google OAuth login for ${authUser.email}`, authUser.uid);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Google sign in error:', err);
      let message = 'Failed to sign in with Google. Please try again.';
      if (err.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in popup was closed before completing.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        message = 'Sign-in popup request was cancelled.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async (reason?: string) => {
    if (user?.uid) {
      logSecurityEvent('SESSION_EXPIRED', reason || 'User logged out', user.uid);
    }
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error('Logout error:', e);
    }
    setUser(null);
    localStorage.removeItem('daily_companion_session_user');
    if (reason) {
      setSecurityNotice(reason);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    const uid = user.uid;

    // Delete firebase user if currently authenticated
    if (auth.currentUser) {
      try {
        await auth.currentUser.delete();
      } catch (err) {
        console.warn('Could not delete Firebase Auth user automatically:', err);
      }
    }

    // Permanently purge all user data from localStorage
    localStorage.removeItem(`daily_companion_checkins_${uid}`);
    localStorage.removeItem(`daily_companion_reflections_${uid}`);
    localStorage.removeItem(`daily_companion_messages_${uid}`);
    localStorage.removeItem(`daily_companion_user_${uid}`);
    localStorage.removeItem(`daily_companion_config_${uid}`);
    localStorage.removeItem(`sec_audit_logs_${uid}`);

    localStorage.removeItem('daily_companion_session_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        securityNotice,
        clearError,
        clearSecurityNotice,
        loginWithGoogle,
        logout,
        deleteAccount,
        getAuthToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
