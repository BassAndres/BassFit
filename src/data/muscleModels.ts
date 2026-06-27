/**
 * Registry of the bundled .glb muscle models (one per muscle group, generated
 * for BassFit). `require` returns the Metro asset module id consumed by
 * expo-asset at runtime. Keep keys in sync with MuscleGroup.
 */
import type { MuscleGroup } from '@/types/models';

export const MUSCLE_MODELS: Record<MuscleGroup, number> = {
  chest: require('../../assets/models/chest.glb'),
  back: require('../../assets/models/back.glb'),
  shoulders: require('../../assets/models/shoulders.glb'),
  biceps: require('../../assets/models/biceps.glb'),
  triceps: require('../../assets/models/triceps.glb'),
  quads: require('../../assets/models/quads.glb'),
  hamstrings: require('../../assets/models/hamstrings.glb'),
  glutes: require('../../assets/models/glutes.glb'),
  calves: require('../../assets/models/calves.glb'),
  abs: require('../../assets/models/abs.glb'),
  forearms: require('../../assets/models/forearms.glb'),
  fullBody: require('../../assets/models/fullBody.glb'),
};
