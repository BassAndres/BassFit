/**
 * FASE 4 — Global state: the active workout session.
 *
 * A single Zustand store holds the in-progress session: the exercises added,
 * every set logged, and the timestamps. UI components subscribe to slices of
 * this state; the persistence layer reads `current` when the user finishes a
 * session and writes it to Firestore.
 *
 * Design notes (SOLID):
 *  - The store owns *mutation* logic only. Pure computations (1RM, volume)
 *    live in `utils/strength` so the store stays thin and testable.
 *  - Ids are generated locally so sets can be logged fully offline; Firestore
 *    document ids are assigned at save time.
 */
import { create } from 'zustand';
import type {
  Exercise,
  SetLog,
  SetType,
  Workout,
  WorkoutExercise,
  WorkoutTotals,
} from '@/types/models';
import { estimate1RM } from '@/utils/strength';

/** Monotonic-ish local id generator (avoids `Math.random` collisions in lists). */
let idCounter = 0;
function localId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

export interface ActiveWorkout {
  id: string;
  name: string;
  routineId?: string;
  startedAt: number;
  exercises: WorkoutExercise[];
}

/** Fields callers may pass when logging a set; the rest are derived. */
export interface DraftSet {
  weightKg: number;
  targetReps: number;
  achievedReps: number;
  rir: number;
  type?: SetType;
}

interface WorkoutState {
  current: ActiveWorkout | null;
  /** The most recently completed set, used to drive the coach banner. */
  lastCompletedSet: SetLog | null;

  startWorkout: (name?: string, routineId?: string) => void;
  addExercise: (exercise: Exercise, restSeconds?: number) => void;
  removeExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string, draft: DraftSet) => void;
  updateSet: (exerciseId: string, setId: string, patch: Partial<SetLog>) => void;
  /** Toggle a set's completed flag; stamps `completedAt` and the coach input. */
  completeSet: (exerciseId: string, setId: string) => SetLog | null;
  removeSet: (exerciseId: string, setId: string) => void;
  clearCoach: () => void;
  /** Finalize the session into a persistable Workout, then reset state. */
  finishWorkout: (ownerUid: string) => Workout | null;
  cancelWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  current: null,
  lastCompletedSet: null,

  startWorkout: (name = 'Entrenamiento', routineId) => {
    set({
      current: {
        id: localId('wk'),
        name,
        routineId,
        startedAt: Date.now(),
        exercises: [],
      },
      lastCompletedSet: null,
    });
  },

  addExercise: (exercise, restSeconds = 120) => {
    const current = get().current;
    if (!current) return;
    if (current.exercises.some((e) => e.exerciseId === exercise.id)) return;
    const next: WorkoutExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      primaryMuscle: exercise.primaryMuscle,
      restSeconds,
      sets: [],
    };
    set({ current: { ...current, exercises: [...current.exercises, next] } });
  },

  removeExercise: (exerciseId) => {
    const current = get().current;
    if (!current) return;
    set({
      current: {
        ...current,
        exercises: current.exercises.filter((e) => e.exerciseId !== exerciseId),
      },
    });
  },

  addSet: (exerciseId, draft) => {
    const current = get().current;
    if (!current) return;
    set({
      current: {
        ...current,
        exercises: current.exercises.map((e) => {
          if (e.exerciseId !== exerciseId) return e;
          const setNumber = e.sets.length + 1;
          const newSet: SetLog = {
            id: localId('set'),
            setNumber,
            type: draft.type ?? 'normal',
            weightKg: draft.weightKg,
            targetReps: draft.targetReps,
            achievedReps: draft.achievedReps,
            rir: draft.rir,
            rpe: 10 - draft.rir,
            estimated1RM: estimate1RM(draft.weightKg, draft.achievedReps),
            completed: false,
          };
          return { ...e, sets: [...e.sets, newSet] };
        }),
      },
    });
  },

  updateSet: (exerciseId, setId, patch) => {
    const current = get().current;
    if (!current) return;
    set({
      current: {
        ...current,
        exercises: current.exercises.map((e) =>
          e.exerciseId !== exerciseId
            ? e
            : {
                ...e,
                sets: e.sets.map((s) =>
                  s.id !== setId ? s : recompute({ ...s, ...patch })
                ),
              }
        ),
      },
    });
  },

  completeSet: (exerciseId, setId) => {
    const current = get().current;
    if (!current) return null;
    let completed: SetLog | null = null;
    const exercises = current.exercises.map((e) => {
      if (e.exerciseId !== exerciseId) return e;
      return {
        ...e,
        sets: e.sets.map((s) => {
          if (s.id !== setId) return s;
          const isNowDone = !s.completed;
          const updated = recompute({
            ...s,
            completed: isNowDone,
            completedAt: isNowDone ? Date.now() : undefined,
          });
          if (isNowDone) completed = updated;
          return updated;
        }),
      };
    });
    set({ current: { ...current, exercises }, lastCompletedSet: completed });
    return completed;
  },

  removeSet: (exerciseId, setId) => {
    const current = get().current;
    if (!current) return;
    set({
      current: {
        ...current,
        exercises: current.exercises.map((e) =>
          e.exerciseId !== exerciseId
            ? e
            : {
                ...e,
                // Re-number remaining sets so the UI stays 1..N.
                sets: e.sets
                  .filter((s) => s.id !== setId)
                  .map((s, i) => ({ ...s, setNumber: i + 1 })),
              }
        ),
      },
    });
  },

  clearCoach: () => set({ lastCompletedSet: null }),

  finishWorkout: (ownerUid) => {
    const current = get().current;
    if (!current) return null;
    const finishedAt = Date.now();
    const totals = computeTotals(current, finishedAt);
    const workout: Workout = {
      id: current.id,
      ownerUid,
      routineId: current.routineId,
      name: current.name,
      startedAt: current.startedAt,
      finishedAt,
      exercises: current.exercises,
      totals,
    };
    set({ current: null, lastCompletedSet: null });
    return workout;
  },

  cancelWorkout: () => set({ current: null, lastCompletedSet: null }),
}));

/** Recompute denormalized fields whenever a set changes. */
function recompute(s: SetLog): SetLog {
  return {
    ...s,
    rpe: 10 - s.rir,
    estimated1RM: estimate1RM(s.weightKg, s.achievedReps),
  };
}

function computeTotals(w: ActiveWorkout, finishedAt: number): WorkoutTotals {
  let volumeKg = 0;
  let setCount = 0;
  let bestEstimated1RM = 0;
  for (const ex of w.exercises) {
    for (const s of ex.sets) {
      if (!s.completed || s.type === 'warmup') continue;
      volumeKg += s.weightKg * s.achievedReps;
      setCount += 1;
      if (s.estimated1RM > bestEstimated1RM) bestEstimated1RM = s.estimated1RM;
    }
  }
  return {
    volumeKg: Math.round(volumeKg),
    setCount,
    durationSeconds: Math.round((finishedAt - w.startedAt) / 1000),
    bestEstimated1RM,
  };
}
