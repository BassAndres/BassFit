/**
 * FASE 3 — The Engine: Progressive Overload coach.
 *
 * Given the set the athlete just finished (target vs. achieved reps, the load
 * used, and the RIR reached), this hook produces a single, concrete coaching
 * recommendation for the *next* set, following a double-progression /
 * autoregulation model used in evidence-based hypertrophy programming:
 *
 *   - Reps hit AND lots left in reserve (RIR high) → add load.
 *   - Reps hit with little in reserve            → hold and add reps next time.
 *   - Reps hit exactly at failure (RIR 0)        → hold load (let it settle).
 *   - Reps missed but close                      → hold and try to complete.
 *   - Reps badly missed / failure too early      → reduce load (deload).
 *
 * Pure decision logic lives in `evaluateOverload` so it can be unit-tested
 * without React; the hook is a thin memoized wrapper for the UI.
 */
import { useMemo } from 'react';
import type { SetLog } from '@/types/models';
import { snapIncrement } from '@/utils/strength';

/** What the coach is telling the athlete to do next. */
export type OverloadAction = 'increase' | 'hold' | 'addReps' | 'deload';

export interface OverloadSuggestion {
  action: OverloadAction;
  /** Short, human-facing title (Spanish, app's primary language). */
  title: string;
  /** One-line rationale. */
  detail: string;
  /** Suggested load for the next set, in kg. */
  nextWeightKg: number;
  /** Signed delta vs. the set just performed, in kg. */
  deltaKg: number;
  /** Suggested target reps for the next set. */
  nextTargetReps: number;
  /** Semantic tone the UI maps to a color (success/warning/danger/neutral). */
  tone: 'success' | 'warning' | 'danger' | 'neutral';
}

/** Minimal shape the engine needs — a subset of {@link SetLog}. */
export interface OverloadInput {
  weightKg: number;
  targetReps: number;
  achievedReps: number;
  rir: number;
}

/**
 * Core decision function. Deterministic and side-effect free.
 */
export function evaluateOverload(set: OverloadInput): OverloadSuggestion {
  const { weightKg, targetReps, achievedReps, rir } = set;
  const hitTarget = achievedReps >= targetReps;
  const repsShort = targetReps - achievedReps;

  // 1) Crushed it — hit reps with meaningful reserve. Add load.
  if (hitTarget && rir > 2) {
    // The more reps left in reserve, the bigger the jump we can justify.
    const rawDelta = rir >= 4 ? weightKg * 0.05 : weightKg * 0.025;
    const deltaKg = snapIncrement(weightKg, rawDelta);
    return {
      action: 'increase',
      title: 'Sube el peso 💪',
      detail: `Lograste ${achievedReps} reps con ${rir} en reserva. Aumenta +${deltaKg}kg en la siguiente serie.`,
      nextWeightKg: round2(weightKg + deltaKg),
      deltaKg,
      nextTargetReps: targetReps,
      tone: 'success',
    };
  }

  // 2) Hit reps but close to failure (RIR 1-2). Hold and let strength build.
  if (hitTarget && rir >= 1) {
    return {
      action: 'hold',
      title: 'Mantén el peso',
      detail: `Buen estímulo (RIR ${rir}). Repite ${weightKg}kg y busca el mismo rango limpio.`,
      nextWeightKg: weightKg,
      deltaKg: 0,
      nextTargetReps: targetReps,
      tone: 'warning',
    };
  }

  // 3) Hit reps exactly at failure (RIR 0). Don't add load yet — consolidate.
  if (hitTarget && rir <= 0) {
    return {
      action: 'hold',
      title: 'Consolida la carga',
      detail: `Llegaste al fallo (RIR 0). Mantén ${weightKg}kg hasta que te sobre 1-2 reps antes de subir.`,
      nextWeightKg: weightKg,
      deltaKg: 0,
      nextTargetReps: targetReps,
      tone: 'warning',
    };
  }

  // 4) Missed by a rep with gas in the tank — try to complete the range.
  if (!hitTarget && repsShort <= 1 && rir >= 1) {
    return {
      action: 'addReps',
      title: 'Completa el rango',
      detail: `Te faltó ${repsShort} rep. Mantén ${weightKg}kg y apunta a ${targetReps} reps completas.`,
      nextWeightKg: weightKg,
      deltaKg: 0,
      nextTargetReps: targetReps,
      tone: 'neutral',
    };
  }

  // 5) Failed the range and/or hit failure prematurely. Reduce load.
  const rawDrop = weightKg * (repsShort >= 3 ? 0.1 : 0.05);
  const dropKg = snapIncrement(weightKg, rawDrop);
  return {
    action: 'deload',
    title: 'Baja el peso',
    detail: `Fallaste el rango (${achievedReps}/${targetReps}, RIR ${rir}). Reduce -${dropKg}kg para mantener la técnica.`,
    nextWeightKg: round2(Math.max(0, weightKg - dropKg)),
    deltaKg: -dropKg,
    nextTargetReps: targetReps,
    tone: 'danger',
  };
}

/**
 * React hook wrapper. Pass the just-completed set (or `null` to clear the
 * banner). Returns the latest suggestion, memoized on the relevant fields.
 */
export function useProgressiveOverload(
  lastSet: OverloadInput | SetLog | null
): OverloadSuggestion | null {
  return useMemo(() => {
    if (!lastSet) return null;
    return evaluateOverload({
      weightKg: lastSet.weightKg,
      targetReps: lastSet.targetReps,
      achievedReps: lastSet.achievedReps,
      rir: lastSet.rir,
    });
  }, [
    lastSet?.weightKg,
    lastSet?.targetReps,
    lastSet?.achievedReps,
    lastSet?.rir,
  ]);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
