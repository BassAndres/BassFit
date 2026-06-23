/**
 * FASE 4 — Global state: the active workout session.
 *
 * A single Zustand store holds the in-progress session: the exercises added,
 * every set logged, and the timestamps. The active session is **persisted** to
 * AsyncStorage so a workout survives the app being closed (resume support).
 *
 * Design notes (SOLID):
 *  - The store owns *mutation* logic only. Pure computations (1RM, volume)
 *    live in `utils/strength` so the store stays thin and testable.
 *  - Ids are generated locally so sets can be logged fully offline; Firestore
 *    document ids are assigned at save time.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Exercise,
  Routine,
  SetLog,
  SetType,
  Workout,
  WorkoutExercise,
  WorkoutTotals,
} from '@/types/models';
import { estimate1RM, round } from '@/utils/strength';
import { useSettingsStore } from './settingsStore';

/** Monotonic-ish local id generator (avoids `Math.random` collisions in lists). */
let idCounter = 0;
function localId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

const SET_TYPE_CYCLE: SetType[] = ['normal', 'warmup', 'dropset', 'failure'];

export interface ActiveWorkout {
  id: string;
  name: string;
  routineId?: string;
  startedAt: number;
  note?: string;
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
  startFromRoutine: (routine: Routine) => void;
  renameWorkout: (name: string) => void;
  setWorkoutNote: (note: string) => void;

  addExercise: (exercise: Exercise, restSeconds?: number) => void;
  removeExercise: (exerciseId: string) => void;
  moveExercise: (exerciseId: string, direction: 'up' | 'down') => void;
  setExerciseNote: (exerciseId: string, note: string) => void;

  addSet: (exerciseId: string, draft: DraftSet) => void;
  addWarmupSets: (exerciseId: string, topWeightKg: number) => void;
  updateSet: (exerciseId: string, setId: string, patch: Partial<SetLog>) => void;
  cycleSetType: (exerciseId: string, setId: string) => void;
  completeSet: (exerciseId: string, setId: string) => SetLog | null;
  removeSet: (exerciseId: string, setId: string) => void;

  clearCoach: () => void;
  finishWorkout: (ownerUid: string) => Workout | null;
  cancelWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
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

      startFromRoutine: (routine) => {
        const exercises: WorkoutExercise[] = routine.exercises.map((re) => ({
          exerciseId: re.exerciseId,
          exerciseName: re.exerciseName,
          primaryMuscle: re.primaryMuscle,
          restSeconds: re.restSeconds,
          sets: re.sets.map((rs) => {
            const weightKg = rs.suggestedWeightKg ?? 0;
            return {
              id: localId('set'),
              setNumber: rs.setNumber,
              type: rs.type,
              weightKg,
              targetReps: rs.targetReps,
              achievedReps: rs.targetReps,
              rir: rs.targetRir ?? 2,
              rpe: 10 - (rs.targetRir ?? 2),
              estimated1RM: estimate1RM(weightKg, rs.targetReps),
              completed: false,
            };
          }),
        }));
        set({
          current: {
            id: localId('wk'),
            name: routine.name,
            routineId: routine.id,
            startedAt: Date.now(),
            exercises,
          },
          lastCompletedSet: null,
        });
      },

      renameWorkout: (name) => {
        const current = get().current;
        if (!current) return;
        set({ current: { ...current, name } });
      },

      setWorkoutNote: (note) => {
        const current = get().current;
        if (!current) return;
        set({ current: { ...current, note } });
      },

      addExercise: (exercise, restSeconds) => {
        const current = get().current;
        if (!current) return;
        if (current.exercises.some((e) => e.exerciseId === exercise.id)) return;
        const rest = restSeconds ?? useSettingsStore.getState().defaultRestSeconds;
        const next: WorkoutExercise = {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          primaryMuscle: exercise.primaryMuscle,
          restSeconds: rest,
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

      moveExercise: (exerciseId, direction) => {
        const current = get().current;
        if (!current) return;
        const idx = current.exercises.findIndex((e) => e.exerciseId === exerciseId);
        if (idx < 0) return;
        const swap = direction === 'up' ? idx - 1 : idx + 1;
        if (swap < 0 || swap >= current.exercises.length) return;
        const exercises = [...current.exercises];
        const a = exercises[idx];
        const b = exercises[swap];
        if (!a || !b) return;
        exercises[idx] = b;
        exercises[swap] = a;
        set({ current: { ...current, exercises } });
      },

      setExerciseNote: (exerciseId, note) => {
        const current = get().current;
        if (!current) return;
        set({
          current: {
            ...current,
            exercises: current.exercises.map((e) =>
              e.exerciseId === exerciseId ? { ...e, note } : e
            ),
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
              const newSet: SetLog = {
                id: localId('set'),
                setNumber: e.sets.length + 1,
                type: draft.type ?? 'normal',
                weightKg: draft.weightKg,
                targetReps: draft.targetReps,
                achievedReps: draft.achievedReps,
                rir: draft.rir,
                rpe: 10 - draft.rir,
                estimated1RM: estimate1RM(draft.weightKg, draft.achievedReps),
                completed: false,
              };
              return renumber({ ...e, sets: [...e.sets, newSet] });
            }),
          },
        });
      },

      addWarmupSets: (exerciseId, topWeightKg) => {
        const current = get().current;
        if (!current || topWeightKg <= 0) return;
        const ramp = [
          { pct: 0.5, reps: 8 },
          { pct: 0.7, reps: 5 },
          { pct: 0.85, reps: 3 },
        ];
        set({
          current: {
            ...current,
            exercises: current.exercises.map((e) => {
              if (e.exerciseId !== exerciseId) return e;
              const warmups: SetLog[] = ramp.map((r) => {
                const weightKg = round(topWeightKg * r.pct);
                return {
                  id: localId('set'),
                  setNumber: 0, // renumbered below
                  type: 'warmup' as SetType,
                  weightKg,
                  targetReps: r.reps,
                  achievedReps: r.reps,
                  rir: 5,
                  rpe: 5,
                  estimated1RM: estimate1RM(weightKg, r.reps),
                  completed: false,
                };
              });
              // Warm-ups go first, before existing (working) sets.
              return renumber({ ...e, sets: [...warmups, ...e.sets] });
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

      cycleSetType: (exerciseId, setId) => {
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
                    sets: e.sets.map((s) => {
                      if (s.id !== setId) return s;
                      const i = SET_TYPE_CYCLE.indexOf(s.type);
                      const nextType = SET_TYPE_CYCLE[(i + 1) % SET_TYPE_CYCLE.length] ?? 'normal';
                      return { ...s, type: nextType };
                    }),
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
                : renumber({ ...e, sets: e.sets.filter((s) => s.id !== setId) })
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
          note: current.note,
        };
        set({ current: null, lastCompletedSet: null });
        return workout;
      },

      cancelWorkout: () => set({ current: null, lastCompletedSet: null }),
    }),
    {
      name: 'bassfit-active-workout',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the in-progress session, not the transient coach state.
      partialize: (state) => ({ current: state.current }),
    }
  )
);

/** Re-number a set list to 1..N after insertion/removal. */
function renumber(e: WorkoutExercise): WorkoutExercise {
  return { ...e, sets: e.sets.map((s, i) => ({ ...s, setNumber: i + 1 })) };
}

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
