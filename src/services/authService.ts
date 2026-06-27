/**
 * Thin wrapper over Firebase Auth so screens depend on this small interface
 * rather than the SDK directly (SOLID: dependency inversion).
 */
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

export type AuthUser = Pick<User, 'uid' | 'email' | 'displayName' | 'isAnonymous'>;

export function observeAuth(cb: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(auth, (u) =>
    cb(
      u
        ? {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            isAnonymous: u.isAnonymous,
          }
        : null
    )
  );
}

export async function signInGuest(): Promise<void> {
  await signInAnonymously(auth);
}

export async function signInEmail(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signUpEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName) await updateProfile(cred.user, { displayName });
}

export async function signOut(): Promise<void> {
  await fbSignOut(auth);
}
