import { describe, expect, it } from 'vitest';
import { calculateStreaks, getFlowMilestone } from './flowCalculator';

describe('flow streaks', () => {
  it('calculates current and longest streak', () => {
    const result = calculateStreaks(['2026-07-20', '2026-07-21', '2026-07-24', '2026-07-25', '2026-07-26'], '2026-07-27');
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('breaks current streak after a missed calendar day', () => {
    expect(calculateStreaks(['2026-07-20', '2026-07-21'], '2026-07-24').currentStreak).toBe(0);
  });

  it('deduplicates dates so timezone reopen cannot inflate a streak', () => {
    expect(calculateStreaks(['2026-07-26', '2026-07-26', '2026-07-27'], '2026-07-27').currentStreak).toBe(2);
  });

  it('returns milestone labels', () => {
    expect(getFlowMilestone(7).achieved?.title).toBe('Неделя в потоке');
    expect(getFlowMilestone(7).next?.days).toBe(14);
  });
});
