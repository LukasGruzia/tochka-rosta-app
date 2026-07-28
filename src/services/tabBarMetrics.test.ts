import { describe, expect, it } from 'vitest';
import { getTabBarMetrics } from './tabBarMetrics';

describe('adaptive tab bar safe area', () => {
  it('separates the visual area from the physical iPhone inset', () => { expect(getTabBarMetrics(34)).toEqual({ bottom: 0, safeAreaHeight: 34, visualHeight: 68, height: 102 }); });
  it('applies the safe-area fallback exactly once', () => { expect(getTabBarMetrics(0)).toEqual({ bottom: 0, safeAreaHeight: 6, visualHeight: 68, height: 74 }); });
});
