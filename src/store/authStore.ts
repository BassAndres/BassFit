/**
 * Auth state as a Zustand store. `init()` wires the Firebase listener once and
 * returns the unsubscribe function (called from App on unmount).
 */
import { create } from 'zustand';
import { observeAuth, type AuthUser } from '@/services/authService';

interface AuthState {
  user: AuthUser | null;
  /** True until the first auth state callback fires. */
  initializing: boolean;
  init: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initializing: true,
  init: () =>
    observeAuth((user) => set({ user, initializing: false })),
}));
