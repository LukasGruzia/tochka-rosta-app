import { describe, expect, it } from 'vitest';
import { getTabIndexFromPosition, getTabIndicatorMetrics, resolveTabGesture, shouldActivateTabDrag } from './tabNavigation';

describe('liquid tab navigation', () => {
  it('maps taps and drags to the nearest visible tab', () => {
    expect(getTabIndexFromPosition(12, 390, 5)).toBe(0);
    expect(getTabIndexFromPosition(210, 390, 5)).toBe(2);
    expect(resolveTabGesture(1, 382, 390, 5)).toBe(4);
  });

  it('keeps the active tab when a gesture is cancelled', () => {
    expect(resolveTabGesture(2, 380, 390, 5, true)).toBe(2);
  });

  it('activates horizontal intent but ignores vertical scrolling', () => {
    expect(shouldActivateTabDrag(16, 3)).toBe(true);
    expect(shouldActivateTabDrag(9, 12)).toBe(false);
    expect(shouldActivateTabDrag(6, 0)).toBe(false);
  });

  it('keeps the indicator inside compact and wide tab bars', () => {
    expect(getTabIndicatorMetrics(0, 320, 5).x).toBeGreaterThanOrEqual(0);
    const last = getTabIndicatorMetrics(4, 430, 5, 40);
    expect(last.x + last.width).toBeLessThanOrEqual(448);
  });
});
