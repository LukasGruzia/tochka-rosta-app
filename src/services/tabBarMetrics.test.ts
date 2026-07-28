import { describe, expect, it } from 'vitest';
import { getTabBarMetrics } from './tabBarMetrics';

describe('adaptive tab bar safe area', () => {
  it('floats above the iPhone home indicator without an internal spacer', () => { expect(getTabBarMetrics(34)).toEqual({ bottomOffset: 30, visualHeight: 68, occupiedHeight: 98, contentInset: 118 }); });
  it('applies the minimum floating offset exactly once', () => { expect(getTabBarMetrics(0)).toEqual({ bottomOffset: 8, visualHeight: 68, occupiedHeight: 76, contentInset: 96 }); });
});
