import { describe, expect, it } from 'vitest';
import { getTabBarMetrics } from './tabBarMetrics';

describe('adaptive tab bar safe area', () => {
  it('uses the physical iPhone inset and derives height', () => { expect(getTabBarMetrics(34)).toEqual({ bottom: 34, paddingBottom: 34, height: 98 }); });
  it('keeps a small fallback inset on devices without one', () => { expect(getTabBarMetrics(0)).toEqual({ bottom: 6, paddingBottom: 6, height: 70 }); });
});
