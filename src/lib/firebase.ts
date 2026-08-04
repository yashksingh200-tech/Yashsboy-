import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  inMemoryPersistence,
  User as FirebaseUser,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Safeguard auth persistence against IndexedDB closing/hidden window lifecycle states
if (typeof window !== 'undefined') {
  setPersistence(auth, indexedDBLocalPersistence).catch((err) => {
    console.warn('[Firebase Auth] IndexedDB persistence fallback triggered:', err);
    return setPersistence(auth, browserLocalPersistence).catch(() => {
      return setPersistence(auth, inMemoryPersistence).catch(() => {});
    });
  });
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export { firebaseSignOut, signInWithPopup, signInWithRedirect, onAuthStateChanged };
export type { FirebaseUser };

