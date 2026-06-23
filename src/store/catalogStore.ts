/**
 * Exercise catalog: the shared seed list merged with the user's custom
 * movements. Loaded once per session and kept in memory so the picker and the
 * Exercises tab share the same source.
 */
import { create } from 'zustand';
import type { Exercise } from '@/types/models';
import { EXERCISE_CATALOG } from '@/data/exerciseCatalog';
import {
  listCustomExercises,
  addCustomExercise,
  deleteCustomExercise,
} from '@/services/exerciseRepository';

interface CatalogState {
  custom: Exercise[];
  loaded: boolean;
  load: (uid: string) => Promise<void>;
  addCustom: (uid: string, exercise: Exercise) => Promise<void>;
  removeCustom: (uid: string, id: string) => Promise<void>;
  /** Seed + custom, de-duplicated by id, sorted by name. */
  all: () => Exercise[];
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  custom: [],
  loaded: false,

  load: async (uid) => {
    try {
      const custom = await listCustomExercises(uid);
      set({ custom, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  addCustom: async (uid, exercise) => {
    set({ custom: [...get().custom, exercise] });
    try {
      await addCustomExercise(uid, exercise);
    } catch {
      /* kept in memory even if the write fails */
    }
  },

  removeCustom: async (uid, id) => {
    set({ custom: get().custom.filter((e) => e.id !== id) });
    try {
      await deleteCustomExercise(uid, id);
    } catch {
      /* no-op */
    }
  },

  all: () => {
    const byId = new Map<string, Exercise>();
    for (const e of EXERCISE_CATALOG) byId.set(e.id, e);
    for (const e of get().custom) byId.set(e.id, e);
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  },
}));
