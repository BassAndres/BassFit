/**
 * User preferences, persisted to AsyncStorage via zustand's persist middleware.
 * Cross-cutting: the theme resolver and weight formatters read from here.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WeightUnit } from '@/utils/units';

export type ThemePreference = 'system' | 'light' | 'dark';

interface SettingsState {
  unit: WeightUnit;
  theme: ThemePreference;
  /** Default rest used for new exercises / empty-session sets. */
  defaultRestSeconds: number;
  /** Auto-start the rest countdown when a set is completed. */
  autoStartRest: boolean;
  haptics: boolean;
  /** Bar weight (kg) used by the plate calculator. */
  barWeightKg: number;
  /** Whether the user has seen onboarding. */
  onboarded: boolean;

  setUnit: (unit: WeightUnit) => void;
  setTheme: (theme: ThemePreference) => void;
  setDefaultRest: (seconds: number) => void;
  setAutoStartRest: (value: boolean) => void;
  setHaptics: (value: boolean) => void;
  setBarWeight: (kg: number) => void;
  setOnboarded: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      unit: 'kg',
      theme: 'system',
      defaultRestSeconds: 120,
      autoStartRest: true,
      haptics: true,
      barWeightKg: 20,
      onboarded: false,

      setUnit: (unit) => set({ unit }),
      setTheme: (theme) => set({ theme }),
      setDefaultRest: (defaultRestSeconds) => set({ defaultRestSeconds }),
      setAutoStartRest: (autoStartRest) => set({ autoStartRest }),
      setHaptics: (haptics) => set({ haptics }),
      setBarWeight: (barWeightKg) => set({ barWeightKg }),
      setOnboarded: (onboarded) => set({ onboarded }),
    }),
    {
      name: 'bassfit-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
