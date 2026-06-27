/** Spanish display labels for enum-ish domain values. */
import type { MuscleGroup, Equipment, SetType } from '@/types/models';

export const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  shoulders: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  quads: 'Cuádriceps',
  hamstrings: 'Femoral',
  glutes: 'Glúteos',
  calves: 'Gemelos',
  abs: 'Abdomen',
  forearms: 'Antebrazo',
  fullBody: 'Cuerpo completo',
};

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: 'Barra',
  dumbbell: 'Mancuerna',
  machine: 'Máquina',
  cable: 'Polea',
  bodyweight: 'Peso corporal',
  kettlebell: 'Kettlebell',
  band: 'Banda',
};

export const SET_TYPE_LABEL: Record<SetType, string> = {
  normal: 'Normal',
  warmup: 'Calent.',
  dropset: 'Drop',
  failure: 'Fallo',
};

/** Single-letter badge for a set type (UI density). */
export const SET_TYPE_BADGE: Record<SetType, string> = {
  normal: '',
  warmup: 'W',
  dropset: 'D',
  failure: 'F',
};

export const ALL_MUSCLES: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'forearms', 'fullBody',
];

export const ALL_EQUIPMENT: Equipment[] = [
  'barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'band',
];
