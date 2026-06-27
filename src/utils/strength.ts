/**
 * Strength math used across the engine and UI.
 * Pure functions — no React, no Firebase — so they are trivially testable.
 */

/**
 * Estimated one-rep max via the Epley formula:
 *   1RM = w * (1 + reps / 30)
 *
 * Reps are clamped to a sane ceiling because the formula loses accuracy past
 * ~12 reps. A single rep returns the load itself.
 */
export function estimate1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  const cappedReps = Math.min(reps, 12);
  return round(weightKg * (1 + cappedReps / 30));
}

/**
 * "Effective reps" = reps performed within ~5 reps of failure, the window
 * generally considered the hypertrophic stimulus. With RIR `r`, the last
 * `5 - r` reps you completed are stimulating (clamped to the reps you did).
 */
export function effectiveReps(reps: number, rir: number): number {
  return clamp(5 - rir, 0, reps);
}

/** Round to the nearest 0.25 kg (typical micro-plate granularity). */
export function round(value: number): number {
  return Math.round(value * 4) / 4;
}

/**
 * Snap a raw weight increment to the smallest plate jump available for the
 * given load. Heavier compound lifts tolerate bigger jumps than isolation.
 */
export function snapIncrement(weightKg: number, rawDelta: number): number {
  const step = weightKg >= 60 ? 2.5 : weightKg >= 20 ? 1.25 : 0.5;
  return Math.max(step, Math.round(rawDelta / step) * step);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
