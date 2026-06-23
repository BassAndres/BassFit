import { evaluateOverload } from '@/hooks/useProgressiveOverload';

describe('evaluateOverload — the progressive-overload engine', () => {
  it('suggests increasing load when reps are hit with high RIR', () => {
    const s = evaluateOverload({ weightKg: 100, targetReps: 8, achievedReps: 8, rir: 3 });
    expect(s.action).toBe('increase');
    expect(s.nextWeightKg).toBeGreaterThan(100);
    expect(s.tone).toBe('success');
  });

  it('uses a bigger jump when RIR is very high', () => {
    const big = evaluateOverload({ weightKg: 100, targetReps: 8, achievedReps: 8, rir: 4 });
    const small = evaluateOverload({ weightKg: 100, targetReps: 8, achievedReps: 8, rir: 3 });
    expect(big.deltaKg).toBeGreaterThanOrEqual(small.deltaKg);
  });

  it('holds when reps are hit but close to failure (RIR 1-2)', () => {
    const s = evaluateOverload({ weightKg: 80, targetReps: 10, achievedReps: 10, rir: 1 });
    expect(s.action).toBe('hold');
    expect(s.nextWeightKg).toBe(80);
  });

  it('consolidates at RIR 0 instead of adding load', () => {
    const s = evaluateOverload({ weightKg: 80, targetReps: 10, achievedReps: 10, rir: 0 });
    expect(s.action).toBe('hold');
  });

  it('asks to complete the range when missing by one with gas left', () => {
    const s = evaluateOverload({ weightKg: 60, targetReps: 12, achievedReps: 11, rir: 1 });
    expect(s.action).toBe('addReps');
    expect(s.nextWeightKg).toBe(60);
  });

  it('deloads when the range is badly missed', () => {
    const s = evaluateOverload({ weightKg: 100, targetReps: 10, achievedReps: 6, rir: 0 });
    expect(s.action).toBe('deload');
    expect(s.nextWeightKg).toBeLessThan(100);
    expect(s.tone).toBe('danger');
  });
});
