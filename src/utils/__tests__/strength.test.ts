import { estimate1RM, effectiveReps, round, snapIncrement, clamp } from '@/utils/strength';

describe('estimate1RM (Epley)', () => {
  it('returns the load for a single rep', () => {
    expect(estimate1RM(100, 1)).toBe(100);
  });
  it('increases with reps', () => {
    expect(estimate1RM(100, 5)).toBeGreaterThan(estimate1RM(100, 1));
  });
  it('caps reps at 12 for accuracy', () => {
    expect(estimate1RM(100, 20)).toBe(estimate1RM(100, 12));
  });
  it('returns 0 for non-positive inputs', () => {
    expect(estimate1RM(0, 5)).toBe(0);
    expect(estimate1RM(100, 0)).toBe(0);
  });
});

describe('effectiveReps', () => {
  it('is 5 minus RIR within the working set', () => {
    expect(effectiveReps(10, 0)).toBe(5);
    expect(effectiveReps(10, 2)).toBe(3);
    expect(effectiveReps(10, 5)).toBe(0);
  });
  it('never exceeds reps performed', () => {
    expect(effectiveReps(3, 0)).toBe(3);
  });
});

describe('round / snapIncrement / clamp', () => {
  it('rounds to nearest 0.25kg', () => {
    expect(round(2.6)).toBe(2.5);
    expect(round(2.7)).toBe(2.75);
  });
  it('snaps increments to plate granularity', () => {
    expect(snapIncrement(100, 3)).toBe(2.5); // heavy → 2.5kg steps
    expect(snapIncrement(10, 0.4)).toBe(0.5); // light → 0.5kg steps
  });
  it('clamps', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
  });
});
