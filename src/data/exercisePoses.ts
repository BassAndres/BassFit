/**
 * Pose selection per exercise for the 3D anatomy model. Maps an exercise to a
 * named pose preset (the body is placed roughly in the exercise position).
 * Falls back to a sensible pose by primary muscle when not listed.
 */
import type { MuscleGroup } from '@/types/models';

export type PoseKey =
  | 'standing'
  | 'squat'
  | 'hinge'
  | 'benchPress'
  | 'overheadPress'
  | 'row'
  | 'curl'
  | 'pushdown'
  | 'lateralRaise'
  | 'lunge'
  | 'calfRaise'
  | 'abs';

const BY_MUSCLE: Record<MuscleGroup, PoseKey> = {
  chest: 'benchPress',
  back: 'row',
  shoulders: 'overheadPress',
  biceps: 'curl',
  triceps: 'pushdown',
  quads: 'squat',
  hamstrings: 'hinge',
  glutes: 'hinge',
  calves: 'calfRaise',
  abs: 'abs',
  forearms: 'curl',
  fullBody: 'squat',
};

const BY_EXERCISE: Record<string, PoseKey> = {
  'squat-barbell': 'squat',
  'front-squat': 'squat',
  'hack-squat': 'squat',
  'leg-press': 'squat',
  'goblet-squat': 'squat',
  'deadlift-barbell': 'hinge',
  'sumo-deadlift': 'hinge',
  'romanian-deadlift': 'hinge',
  'db-rdl': 'hinge',
  'good-morning': 'hinge',
  'hip-thrust': 'hinge',
  'walking-lunge': 'lunge',
  'bulgarian-split-squat': 'lunge',
  'step-up': 'lunge',
  'lateral-raise-db': 'lateralRaise',
  'cable-lateral-raise': 'lateralRaise',
  'rear-delt-fly': 'lateralRaise',
  'ohp-barbell': 'overheadPress',
  'seated-db-press': 'overheadPress',
  'arnold-press': 'overheadPress',
  'machine-shoulder-press': 'overheadPress',
  'lat-pulldown': 'overheadPress',
  'close-grip-pulldown': 'overheadPress',
  'pullup': 'overheadPress',
  'chin-up': 'overheadPress',
  'barbell-row': 'row',
  'pendlay-row': 'row',
  'one-arm-db-row': 'row',
  't-bar-row': 'row',
  'seated-cable-row': 'row',
  'machine-row': 'row',
  'bench-press-barbell': 'benchPress',
  'incline-bench-barbell': 'benchPress',
  'decline-bench-barbell': 'benchPress',
  'flat-db-press': 'benchPress',
  'incline-db-press': 'benchPress',
  'push-up': 'benchPress',
  'triceps-pushdown': 'pushdown',
  'rope-pushdown': 'pushdown',
  'standing-calf-raise': 'calfRaise',
  'seated-calf-raise': 'calfRaise',
  'leg-press-calf': 'calfRaise',
  'plank': 'abs',
  'crunch': 'abs',
  'cable-crunch': 'abs',
  'hanging-leg-raise': 'abs',
  'ab-wheel': 'abs',
  'russian-twist': 'abs',
};

export function poseForExercise(exerciseId: string, primaryMuscle: MuscleGroup): PoseKey {
  return BY_EXERCISE[exerciseId] ?? BY_MUSCLE[primaryMuscle] ?? 'standing';
}
