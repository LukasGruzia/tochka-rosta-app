import { describe, expect, it } from 'vitest';
import { canUseFlowPause, getWeeklyFlowProgress } from './flowGoals';

describe('flexible Flow goals', () => {
  it('calculates 3, 5 and 7-day weekly goals', () => {
    const completed = ['2026-07-20', '2026-07-21', '2026-07-23', '2026-07-26'];
    expect(getWeeklyFlowProgress(completed, '2026-07-20', 3).achieved).toBe(true);
    expect(getWeeklyFlowProgress(completed, '2026-07-20', 5)).toMatchObject({ completed: 4, remaining: 1, achieved: false });
    expect(getWeeklyFlowProgress(completed, '2026-07-20', 7).progress).toBeCloseTo(4 / 7);
  });

  it('allows one unused pause only for today or the past', () => {
    expect(canUseFlowPause('2026-07-27', [], 1, '2026-07-28')).toBe(true);
    expect(canUseFlowPause('2026-07-29', [], 1, '2026-07-28')).toBe(false);
    expect(canUseFlowPause('2026-07-27', ['2026-07-27'], 1, '2026-07-28')).toBe(false);
    expect(canUseFlowPause('2026-07-27', [], 0, '2026-07-28')).toBe(false);
  });
});
