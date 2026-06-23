/**
 * Personal-record analytics. Pure functions over a list of workouts so they're
 * trivially testable and reusable (the data fetch is the caller's concern).
 */
import type { Workout } from '@/types/models';

export interface ExercisePR {
  exerciseId: string;
  exerciseName: string;
  /** Heaviest single set, kg. */
  bestWeightKg: number;
  /** Highest estimated 1RM, kg. */
  best1RM: number;
  /** Highest single-set volume (weight × reps), kg. */
  bestSetVolumeKg: number;
}

/** Build a map of exerciseId → personal records from history. */
export function computePRs(workouts: Workout[]): Map<string, ExercisePR> {
  const map = new Map<string, ExercisePR>();
  for (const w of workouts) {
    for (const ex of w.exercises) {
      for (const s of ex.sets) {
        if (!s.completed || s.type === 'warmup') continue;
        const prev = map.get(ex.exerciseId) ?? {
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          bestWeightKg: 0,
          best1RM: 0,
          bestSetVolumeKg: 0,
        };
        map.set(ex.exerciseId, {
          ...prev,
          exerciseName: ex.exerciseName,
          bestWeightKg: Math.max(prev.bestWeightKg, s.weightKg),
          best1RM: Math.max(prev.best1RM, s.estimated1RM),
          bestSetVolumeKg: Math.max(prev.bestSetVolumeKg, s.weightKg * s.achievedReps),
        });
      }
    }
  }
  return map;
}

export interface ExerciseSessionPoint {
  workoutId: string;
  date: number;
  best1RM: number;
  volumeKg: number;
  topWeightKg: number;
  topReps: number;
}

/** Per-session progression for a single exercise, oldest → newest. */
export function exerciseHistory(workouts: Workout[], exerciseId: string): ExerciseSessionPoint[] {
  const points: ExerciseSessionPoint[] = [];
  for (const w of workouts) {
    const ex = w.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex) continue;
    let best1RM = 0;
    let volumeKg = 0;
    let topWeightKg = 0;
    let topReps = 0;
    for (const s of ex.sets) {
      if (!s.completed || s.type === 'warmup') continue;
      volumeKg += s.weightKg * s.achievedReps;
      if (s.estimated1RM > best1RM) best1RM = s.estimated1RM;
      if (s.weightKg > topWeightKg) {
        topWeightKg = s.weightKg;
        topReps = s.achievedReps;
      }
    }
    if (volumeKg > 0) {
      points.push({
        workoutId: w.id,
        date: w.startedAt,
        best1RM,
        volumeKg: Math.round(volumeKg),
        topWeightKg,
        topReps,
      });
    }
  }
  return points.sort((a, b) => a.date - b.date);
}

/** Volume per muscle group across the given workouts (for distribution charts). */
export function volumeByMuscle(workouts: Workout[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const w of workouts) {
    for (const ex of w.exercises) {
      let vol = 0;
      for (const s of ex.sets) {
        if (!s.completed || s.type === 'warmup') continue;
        vol += s.weightKg * s.achievedReps;
      }
      out[ex.primaryMuscle] = (out[ex.primaryMuscle] ?? 0) + vol;
    }
  }
  return out;
}
