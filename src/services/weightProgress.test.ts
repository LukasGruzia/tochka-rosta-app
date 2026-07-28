import { describe, expect, it } from 'vitest';
import { calculateWeightProgress } from './weightProgress';

const entry = (id: number, weightKg: number) => ({ id, date: `2026-07-${20 + id}`, weightKg, note: '', createdAt: '', updatedAt: '' });

describe('calculateWeightProgress', () => {
  it('calculates current, change and range', () => {
    expect(calculateWeightProgress([entry(1, 82), entry(2, 80), entry(3, 79)])).toMatchObject({
      initialWeight: 82, currentWeight: 79, changeKg: -3, minWeight: 79, maxWeight: 82,
    });
  });

  it('handles an empty history', () => {
    expect(calculateWeightProgress([])).toMatchObject({ initialWeight: null, currentWeight: null, changeKg: 0 });
  });
});
