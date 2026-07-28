import { describe, expect, it } from 'vitest';
import { getTabBarMetrics } from './tabBarMetrics';

describe('adaptive tab bar safe area', () => {
  it('sits on the bottom edge and puts the physical iPhone inset inside', () => { expect(getTabBarMetrics(34)).toEqual({ bottom: 0, paddingBottom: 34, height: 98 }); });
  it('keeps a small inner fallback above system UI', () => { expect(getTabBarMetrics(0)).toEqual({ bottom: 0, paddingBottom: 6, height: 70 }); });
});
