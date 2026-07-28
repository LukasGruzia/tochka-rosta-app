import { describe, expect, it } from 'vitest';
import { getWaterProgress, sumWater } from './waterMath';

describe('water math', () => {
  it('sums entries and caps visible progress', () => {
    expect(sumWater([{ amountMl: 250 }, { amountMl: 500 }])).toBe(750);
    expect(getWaterProgress(2500, 2000)).toBe(1);
  });

  it('handles invalid and negative totals safely', () => {
    expect(getWaterProgress(-100, 2000)).toBe(0);
    expect(getWaterProgress(500, 0)).toBe(0);
  });
});
