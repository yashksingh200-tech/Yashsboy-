import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { AuthUser } from '../types';
import {
  auth,
  googleProvider,
  signInWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  FirebaseUser,
} from '../lib/firebase';
import { decryptSync, encryptSync } from '../utils/encryption';
import { logSecurityEvent } from '../utils/securityGuard';
import { API_BASE_URL } from '../config';
import firebaseConfig from '../../firebase-applet-config.json';

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

const getStoredSessionUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem('daily_companion_session_user');
    if (cached) {
      const decrypted = decryptSync<AuthUser | null>(cached, 'session_sec_key', null);
      if (decrypted && decrypted.uid) {
        return decrypted;
      }
    }
  } catch (e) {
    console.warn('[AuthContext] Failed to load stored user session from localStorage:', e);
  }
  return null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialSessionUser = getStoredSessionUser();
  const [user, setUser] = useState<AuthUser | null>(initialSessionUser);
  const [isLoading, setIsLoading] = useState<boolean>(!initialSessionUser);
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

  // Check for redirect result on mount (for system browser Custom Tabs / redirect OAuth completion)
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
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
          logSecurityEvent('LOGIN_SUCCESS', `Google OAuth redirect login for ${authUser.email}`, authUser.uid);
        }
      })
      .catch((err) => {
        console.warn('Get redirect result check:', err);
      });
  }, []);

  // Listen to Firebase Auth state changes with explicit browserLocalPersistence
  useEffect(() => {
    // Ensure persistence is set to browserLocalPersistence
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('[AuthContext] Persistence set error in listener:', err);
    });

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
        // Firebase explicitly confirmed no active authenticated user
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
      await setPersistence(auth, browserLocalPersistence);
    } catch (pErr) {
      console.warn('[AuthContext] setPersistence error prior to login:', pErr);
    }

    // 1. NATIVE ANDROID / CAPACITOR FLOW
    if (Capacitor.isNativePlatform()) {
      try {
        console.log('[AuthContext] Native platform detected. Executing native Google Sign-In...');
        // Ensure web client ID is available for serverClientId requirement
        const webClientId = firebaseConfig.oAuthClientId || '410831811130-rmrnp3m1on79nsfmk5jemgber18m2gcj.apps.googleusercontent.com';
        
        let result;
        try {
          result = await FirebaseAuthentication.signInWithGoogle({
            scopes: ['email', 'profile'],
            skipNativeAuth: false,
          });
        } catch (cmErr: any) {
          const errStr = String(cmErr?.message || cmErr);
          if (
            errStr.includes('No credentials available') ||
            cmErr?.code === '16' ||
            errStr.toLowerCase().includes('nocredential')
          ) {
            console.warn('[AuthContext] Credential Manager returned no saved credentials. Retrying with useCredentialManager: false...');
            result = await FirebaseAuthentication.signInWithGoogle({
              scopes: ['email', 'profile'],
              useCredentialManager: false,
              skipNativeAuth: false,
            });
          } else {
            throw cmErr;
          }
        }
        const idToken = result.credential?.idToken;

        if (idToken) {
          const credential = GoogleAuthProvider.credential(idToken);
          const userCredential = await signInWithCredential(auth, credential);
          const firebaseUser = userCredential.user;
          const freshIdToken = await firebaseUser.getIdToken();

          const authUser: AuthUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            photoURL: firebaseUser.photoURL || undefined,
            provider: 'google',
            createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
            token: freshIdToken,
          };

          saveUserSession(authUser);
          logSecurityEvent('LOGIN_SUCCESS', `Native Android Google login for ${authUser.email}`, authUser.uid);
          setIsLoading(false);
          return true;
        } else {
          throw new Error('Native Google Sign-In completed but no ID token was returned.');
        }
      } catch (nativeErr: any) {
        console.error('[AuthContext] Native Google Sign-In error:', nativeErr);
        let message = 'Native Google Sign-In failed. Please try again.';
        if (nativeErr.code === '12501' || String(nativeErr.message).toLowerCase().includes('cancel')) {
          message = 'Sign-in request was cancelled.';
        } else if (nativeErr.message) {
          message = nativeErr.message;
        }
        setError(message);
        setIsLoading(false);
        return false;
      }
    }

    // 2. WEB BROWSER FALLBACK FLOW (Non-Native)
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

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
      logSecurityEvent('LOGIN_SUCCESS', `Google OAuth web login for ${authUser.email}`, authUser.uid);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Google sign in web error:', err);
      // Fallback to redirect if popup is blocked/disallowed in iframe or browser
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/disallowed-useragent' ||
        String(err.message).toLowerCase().includes('disallowed') ||
        String(err.message).toLowerCase().includes('popup')
      ) {
        try {
          console.log('[AuthContext] Popup blocked or disallowed. Triggering redirect fallback for browser.');
          if (isLocalhost) {
            window.location.href = API_BASE_URL;
          } else {
            await signInWithRedirect(auth, googleProvider);
          }
          return true;
        } catch (redirectErr: any) {
          console.error('Redirect fallback error:', redirectErr);
        }
      }

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
    if (Capacitor.isNativePlatform()) {
      try {
        await FirebaseAuthentication.signOut();
      } catch (e) {
        console.warn('Native FirebaseAuthentication.signOut error:', e);
      }
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
