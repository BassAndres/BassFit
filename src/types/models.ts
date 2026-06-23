/**
 * BassFit domain models.
 *
 * These interfaces are the single source of truth shared between the Firestore
 * persistence layer, the Zustand store, and the UI. Keep them framework-free so
 * they can be reused anywhere (SOLID: depend on abstractions, not Firebase).
 */

/** Primary muscle groups, used for filtering and analytics. */
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs'
  | 'forearms'
  | 'fullBody';

/** Equipment categories. */
export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'band';

/**
 * A movement in the global catalog. Stored once in `exercises/{exerciseId}`
 * and referenced (never duplicated) from routines and workout logs.
 */
export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  /** Optional how-to / cue text. */
  instructions?: string;
  /** True for user-created movements (vs. the curated catalog). */
  isCustom?: boolean;
}

/** The kind of a logged set, affecting how it counts toward volume. */
export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure';

/**
 * A single logged set. RIR (Reps In Reserve) and RPE (Rate of Perceived
 * Exertion) drive the progressive-overload engine. We persist both the target
 * and the achieved values so we can compute progress retrospectively.
 */
export interface SetLog {
  id: string;
  /** 1-based index of this set within the exercise. */
  setNumber: number;
  type: SetType;
  /** Load in kilograms (the app is metric-first; convert at the view layer). */
  weightKg: number;
  /** Reps the athlete was aiming for. */
  targetReps: number;
  /** Reps actually completed. */
  achievedReps: number;
  /** Reps left in the tank (0 = to failure). Lower = harder. */
  rir: number;
  /** Rate of perceived exertion, 1-10. Roughly `10 - rir`. */
  rpe?: number;
  /** Estimated one-rep max for this set (Epley). Denormalized for speed. */
  estimated1RM: number;
  /** Whether the athlete checked the set off as done. */
  completed: boolean;
  /** Epoch millis when completed. */
  completedAt?: number;
}

/** All sets performed for one exercise inside a workout session. */
export interface WorkoutExercise {
  /** References `Exercise.id`. */
  exerciseId: string;
  /** Denormalized for offline display without a catalog join. */
  exerciseName: string;
  primaryMuscle: MuscleGroup;
  /** Rest timer target in seconds. */
  restSeconds: number;
  sets: SetLog[];
  /** Free-text note for this exercise within the session. */
  note?: string;
}

/** A planned set inside a routine template (no achieved values yet). */
export interface RoutineSet {
  setNumber: number;
  type: SetType;
  targetReps: number;
  /** Optional prescribed RIR for autoregulation. */
  targetRir?: number;
  /** Optional starting weight suggestion (kg). */
  suggestedWeightKg?: number;
}

/** One exercise slot in a routine template. */
export interface RoutineExercise {
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: MuscleGroup;
  restSeconds: number;
  sets: RoutineSet[];
}

/**
 * A reusable training template owned by a user.
 * Path: `users/{uid}/routines/{routineId}`.
 */
export interface Routine {
  id: string;
  ownerUid: string;
  name: string;
  /** Optional grouping label, e.g. "Push / Pull / Legs". */
  folder?: string;
  exercises: RoutineExercise[];
  createdAt: number;
  updatedAt: number;
}

/**
 * A completed (or in-progress) training session.
 * Path: `users/{uid}/workouts/{workoutId}`.
 */
export interface Workout {
  id: string;
  ownerUid: string;
  /** Routine this session was started from, if any. */
  routineId?: string;
  name: string;
  /** Epoch millis. */
  startedAt: number;
  /** Epoch millis; undefined while the session is active. */
  finishedAt?: number;
  exercises: WorkoutExercise[];
  /** Denormalized session totals for the history feed. */
  totals: WorkoutTotals;
  note?: string;
}

/** Aggregate metrics computed when a workout is saved. */
export interface WorkoutTotals {
  /** Sum of weight × reps across all completed working sets. */
  volumeKg: number;
  /** Count of completed working sets. */
  setCount: number;
  /** Duration in seconds. */
  durationSeconds: number;
  /** Highest estimated 1RM achieved in the session. */
  bestEstimated1RM: number;
}
