/**
 * Seed exercise catalog.
 *
 * In production this lives in the `exercises/{id}` Firestore collection and is
 * cached locally. Shipped here as a typed constant so the app is usable on
 * first launch (and so the "Add exercise" sheet has content offline).
 */
import type { Exercise } from '@/types/models';

export const EXERCISE_CATALOG: Exercise[] = [
  {
    id: 'bench-press-barbell',
    name: 'Press de Banca con Barra',
    primaryMuscle: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'barbell',
    instructions: 'Retrae las escápulas, baja a la línea del pezón y empuja.',
  },
  {
    id: 'incline-db-press',
    name: 'Press Inclinado con Mancuernas',
    primaryMuscle: 'chest',
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: 'dumbbell',
  },
  {
    id: 'squat-barbell',
    name: 'Sentadilla con Barra',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: 'barbell',
    instructions: 'Profundiza hasta romper paralelo manteniendo la espalda neutra.',
  },
  {
    id: 'deadlift-barbell',
    name: 'Peso Muerto Convencional',
    primaryMuscle: 'back',
    secondaryMuscles: ['hamstrings', 'glutes', 'forearms'],
    equipment: 'barbell',
  },
  {
    id: 'pullup',
    name: 'Dominadas',
    primaryMuscle: 'back',
    secondaryMuscles: ['biceps', 'forearms'],
    equipment: 'bodyweight',
  },
  {
    id: 'lat-pulldown',
    name: 'Jalón al Pecho',
    primaryMuscle: 'back',
    secondaryMuscles: ['biceps'],
    equipment: 'cable',
  },
  {
    id: 'ohp-barbell',
    name: 'Press Militar con Barra',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['triceps'],
    equipment: 'barbell',
  },
  {
    id: 'lateral-raise-db',
    name: 'Elevaciones Laterales',
    primaryMuscle: 'shoulders',
    secondaryMuscles: [],
    equipment: 'dumbbell',
  },
  {
    id: 'barbell-row',
    name: 'Remo con Barra',
    primaryMuscle: 'back',
    secondaryMuscles: ['biceps', 'forearms'],
    equipment: 'barbell',
  },
  {
    id: 'romanian-deadlift',
    name: 'Peso Muerto Rumano',
    primaryMuscle: 'hamstrings',
    secondaryMuscles: ['glutes', 'back'],
    equipment: 'barbell',
  },
  {
    id: 'leg-press',
    name: 'Prensa de Piernas',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes'],
    equipment: 'machine',
  },
  {
    id: 'biceps-curl-db',
    name: 'Curl de Bíceps con Mancuernas',
    primaryMuscle: 'biceps',
    secondaryMuscles: ['forearms'],
    equipment: 'dumbbell',
  },
  {
    id: 'triceps-pushdown',
    name: 'Extensión de Tríceps en Polea',
    primaryMuscle: 'triceps',
    secondaryMuscles: [],
    equipment: 'cable',
  },
  {
    id: 'leg-curl',
    name: 'Curl Femoral',
    primaryMuscle: 'hamstrings',
    secondaryMuscles: ['calves'],
    equipment: 'machine',
  },
  {
    id: 'calf-raise',
    name: 'Elevación de Talones',
    primaryMuscle: 'calves',
    secondaryMuscles: [],
    equipment: 'machine',
  },
  {
    id: 'cable-fly',
    name: 'Aperturas en Polea',
    primaryMuscle: 'chest',
    secondaryMuscles: ['shoulders'],
    equipment: 'cable',
  },
];
