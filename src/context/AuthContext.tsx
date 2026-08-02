import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AuthUser } from '../types';
import { encryptSync, decryptSync } from '../utils/encryption';
import {
  validatePasswordStrength,
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  clearLoginRateLimit,
  createSecureAuthToken,
  verifyAuthToken,
  sanitizeInput,
  logSecurityEvent,
} from '../utils/securityGuard';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  securityNotice: string | null;
  clearError: () => void;
  clearSecurityNotice: () => void;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  signupWithEmail: (name: string, email: string, pass: string) => Promise<boolean>;
  loginWithGoogle: (googleInfo?: { name: string; email: string; photoURL?: string }) => Promise<boolean>;
  logout: (reason?: string) => void;
  deleteAccount: () => Promise<void>;
  getAuthToken: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generates a cryptographically signed user auth session token with expiration
export function generateUserToken(uid: string): string {
  return createSecureAuthToken(uid);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize registered users and session from localStorage
  useEffect(() => {
    // Check persistent active session
    const activeSession = localStorage.getItem('daily_companion_session_user');
    if (activeSession) {
      try {
        const parsedUser: AuthUser = decryptSync<AuthUser>(activeSession, 'session_sec_key', JSON.parse(activeSession));
        if (parsedUser && parsedUser.uid) {
          // Verify token expiration
          const tokenVerification = verifyAuthToken(parsedUser.token || '', parsedUser.uid);
          if (tokenVerification.isValid) {
            setUser(parsedUser);
          } else {
            // Token expired or invalid signature -> clear session
            localStorage.removeItem('daily_companion_session_user');
            setSecurityNotice('Your session expired for security reasons. Please log in again.');
            logSecurityEvent('SESSION_EXPIRED', 'Session token expired or invalidated', parsedUser.uid);
          }
        }
      } catch (err) {
        localStorage.removeItem('daily_companion_session_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Inactivity auto-logout handler (15 minutes of inactivity)
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutes

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        logout('Inactivity timeout (15 minutes). You were automatically logged out to safeguard your data.');
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

  const getRegisteredUsers = (): Array<AuthUser & { passwordHash: string }> => {
    try {
      const stored = localStorage.getItem('daily_companion_registered_users');
      if (!stored) return [];
      return decryptSync<Array<AuthUser & { passwordHash: string }>>(stored, 'global_auth_sec', []);
    } catch {
      return [];
    }
  };

  const saveRegisteredUsers = (users: Array<AuthUser & { passwordHash: string }>) => {
    const encrypted = encryptSync(users, 'global_auth_sec');
    localStorage.setItem('daily_companion_registered_users', encrypted);
  };

  const saveUserSession = (authUser: AuthUser) => {
    if (!authUser.token) {
      authUser.token = createSecureAuthToken(authUser.uid);
    }
    setUser(authUser);
    const encryptedSession = encryptSync(authUser, 'session_sec_key');
    localStorage.setItem('daily_companion_session_user', encryptedSession);
  };

  const getAuthToken = (): string => {
    if (user?.token) {
      const verification = verifyAuthToken(user.token, user.uid);
      if (verification.isValid) return user.token;
    }
    if (user?.uid) return createSecureAuthToken(user.uid);
    return 'guest_token';
  };

  const loginWithEmail = async (email: string, pass: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    return new Promise((resolve) => {
      setTimeout(() => {
        const cleanEmail = sanitizeInput(email.trim().toLowerCase());

        if (!cleanEmail || !pass) {
          setError('Please provide both email address and password.');
          setIsLoading(false);
          resolve(false);
          return;
        }

        // Check Rate Limiter / Brute Force Protection
        const rateCheck = checkLoginRateLimit(cleanEmail);
        if (rateCheck.isLocked) {
          const msg = `Account temporarily locked due to 5 failed login attempts. Please try again in ${rateCheck.remainingMinutes || 15} minutes.`;
          setError(msg);
          logSecurityEvent('ACCOUNT_LOCKOUT', msg);
          setIsLoading(false);
          resolve(false);
          return;
        }

        const users = getRegisteredUsers();
        const foundUser = users.find((u) => u.email.toLowerCase() === cleanEmail);

        if (!foundUser) {
          const rateResult = recordFailedLoginAttempt(cleanEmail);
          const msg = rateResult.isLocked
            ? `Account locked due to multiple failed attempts. Try again in ${rateResult.remainingMinutes} minutes.`
            : `No account found with this email. (${rateResult.attemptsLeft} attempts remaining before temporary lockout).`;
          setError(msg);
          logSecurityEvent('LOGIN_FAILED', `Failed login attempt for nonexistent user ${cleanEmail}`);
          setIsLoading(false);
          resolve(false);
          return;
        }

        if (foundUser.passwordHash !== pass) {
          const rateResult = recordFailedLoginAttempt(cleanEmail);
          const msg = rateResult.isLocked
            ? `Account locked due to 5 consecutive failed attempts. Try again in ${rateResult.remainingMinutes} minutes.`
            : `Incorrect password. (${rateResult.attemptsLeft} attempts remaining before temporary lockout).`;
          setError(msg);
          logSecurityEvent('LOGIN_FAILED', `Incorrect password attempt for ${cleanEmail}`, foundUser.uid);
          setIsLoading(false);
          resolve(false);
          return;
        }

        // Successful login -> reset rate limit counter
        clearLoginRateLimit(cleanEmail);

        const authUser: AuthUser = {
          uid: foundUser.uid,
          email: foundUser.email,
          name: foundUser.name,
          photoURL: foundUser.photoURL,
          provider: 'email',
          createdAt: foundUser.createdAt,
          token: createSecureAuthToken(foundUser.uid),
        };

        saveUserSession(authUser);
        logSecurityEvent('LOGIN_SUCCESS', `Successful login for ${cleanEmail}`, authUser.uid);
        setIsLoading(false);
        resolve(true);
      }, 700);
    });
  };

  const signupWithEmail = async (name: string, email: string, pass: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    return new Promise((resolve) => {
      setTimeout(() => {
        const cleanName = sanitizeInput(name.trim());
        const cleanEmail = sanitizeInput(email.trim().toLowerCase());

        if (!cleanName) {
          setError('Please enter your name.');
          setIsLoading(false);
          resolve(false);
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          setError('Please enter a valid email address (e.g. user@example.com).');
          setIsLoading(false);
          resolve(false);
          return;
        }

        // Enforce Strong Password Requirements
        const passCheck = validatePasswordStrength(pass);
        if (!passCheck.isValid) {
          setError(`Weak Password: ${passCheck.errors.join(' • ')}`);
          setIsLoading(false);
          resolve(false);
          return;
        }

        const users = getRegisteredUsers();
        const exists = users.some((u) => u.email.toLowerCase() === cleanEmail);

        if (exists) {
          setError('An account with this email address already exists. Please log in.');
          setIsLoading(false);
          resolve(false);
          return;
        }

        const newUid = 'usr-' + Date.now();
        const newUser: AuthUser & { passwordHash: string } = {
          uid: newUid,
          email: cleanEmail,
          name: cleanName,
          provider: 'email',
          createdAt: new Date().toISOString(),
          passwordHash: pass,
          token: createSecureAuthToken(newUid),
        };

        const updatedUsers = [...users, newUser];
        saveRegisteredUsers(updatedUsers);

        const authUser: AuthUser = {
          uid: newUser.uid,
          email: newUser.email,
          name: newUser.name,
          provider: 'email',
          createdAt: newUser.createdAt,
          token: newUser.token,
        };

        saveUserSession(authUser);
        logSecurityEvent('LOGIN_SUCCESS', `New account created for ${cleanEmail}`, newUid);
        setIsLoading(false);
        resolve(true);
      }, 800);
    });
  };

  const loginWithGoogle = async (googleInfo?: { name: string; email: string; photoURL?: string }): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    return new Promise((resolve) => {
      setTimeout(() => {
        const gName = sanitizeInput(googleInfo?.name || 'Alex Johnson');
        const gEmail = sanitizeInput(googleInfo?.email || 'alex.google@gmail.com');
        const gPhoto = googleInfo?.photoURL || 'https://lh3.googleusercontent.com/a/default-user=s96-c';
        const gUid = 'google-' + Math.random().toString(36).substring(2, 9);

        const authUser: AuthUser = {
          uid: gUid,
          email: gEmail,
          name: gName,
          photoURL: gPhoto,
          provider: 'google',
          createdAt: new Date().toISOString(),
          token: createSecureAuthToken(gUid),
        };

        saveUserSession(authUser);
        logSecurityEvent('LOGIN_SUCCESS', `Google OAuth login for ${gEmail}`, gUid);
        setIsLoading(false);
        resolve(true);
      }, 900);
    });
  };

  const logout = (reason?: string) => {
    if (user?.uid) {
      logSecurityEvent('SESSION_EXPIRED', reason || 'User logged out', user.uid);
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

    // Permanently purge all user data from localStorage
    localStorage.removeItem(`daily_companion_checkins_${uid}`);
    localStorage.removeItem(`daily_companion_reflections_${uid}`);
    localStorage.removeItem(`daily_companion_messages_${uid}`);
    localStorage.removeItem(`daily_companion_user_${uid}`);
    localStorage.removeItem(`daily_companion_config_${uid}`);
    localStorage.removeItem(`sec_audit_logs_${uid}`);

    // Remove user from registered user database
    const users = getRegisteredUsers().filter((u) => u.uid !== uid);
    saveRegisteredUsers(users);

    // Clear session user
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
        loginWithEmail,
        signupWithEmail,
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
