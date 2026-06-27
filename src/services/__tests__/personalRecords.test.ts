import { computePRs, exerciseHistory, volumeByMuscle } from '@/services/personalRecords';
import type { Workout, SetLog } from '@/types/models';

function set(partial: Partial<SetLog>): SetLog {
  return {
    id: Math.random().toString(36),
    setNumber: 1,
    type: 'normal',
    weightKg: 100,
    targetReps: 5,
    achievedReps: 5,
    rir: 2,
    estimated1RM: 116,
    completed: true,
    ...partial,
  };
}

function workout(id: string, startedAt: number, sets: SetLog[]): Workout {
  return {
    id,
    ownerUid: 'u',
    name: 'W',
    startedAt,
    exercises: [
      {
        exerciseId: 'bench',
        exerciseName: 'Bench',
        primaryMuscle: 'chest',
        restSeconds: 120,
        sets,
      },
    ],
    totals: { volumeKg: 0, setCount: 0, durationSeconds: 0, bestEstimated1RM: 0 },
  };
}

describe('computePRs', () => {
  it('tracks best weight, 1RM and set volume per exercise', () => {
    const ws = [
      workout('1', 1000, [set({ weightKg: 100, estimated1RM: 116, achievedReps: 5 })]),
      workout('2', 2000, [set({ weightKg: 110, estimated1RM: 120, achievedReps: 4 })]),
    ];
    const pr = computePRs(ws).get('bench');
    expect(pr?.bestWeightKg).toBe(110);
    expect(pr?.best1RM).toBe(120);
  });

  it('ignores warmup and uncompleted sets', () => {
    const ws = [
      workout('1', 1000, [
        set({ weightKg: 200, type: 'warmup', estimated1RM: 240 }),
        set({ weightKg: 50, completed: false, estimated1RM: 60 }),
        set({ weightKg: 80, estimated1RM: 92 }),
      ]),
    ];
    const pr = computePRs(ws).get('bench');
    expect(pr?.bestWeightKg).toBe(80);
  });
});

describe('exerciseHistory', () => {
  it('returns one point per session, oldest first', () => {
    const ws = [
      workout('2', 2000, [set({ weightKg: 110 })]),
      workout('1', 1000, [set({ weightKg: 100 })]),
    ];
    const pts = exerciseHistory(ws, 'bench');
    expect(pts.map((p) => p.workoutId)).toEqual(['1', '2']);
  });
});

describe('volumeByMuscle', () => {
  it('aggregates working-set volume by primary muscle', () => {
    const ws = [workout('1', 1000, [set({ weightKg: 100, achievedReps: 5 })])];
    expect(volumeByMuscle(ws).chest).toBe(500);
  });
});
