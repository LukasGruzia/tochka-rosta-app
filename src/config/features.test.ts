import { describe, expect, it } from 'vitest';
import { defaultFeatureFlags, resolveFeatureFlags, safeModeFeatureFlags } from './features';

describe('UI feature flags', () => {
  it('enables the premium tab gesture while keeping sheet gestures conservative', () => {
    expect(defaultFeatureFlags.enableLiquidTabDrag).toBe(true);
    expect(defaultFeatureFlags.enableSheetGestures).toBe(false);
  });

  it('safe mode disables complex animation without affecting business features', () => {
    expect(resolveFeatureFlags(defaultFeatureFlags, true)).toEqual(safeModeFeatureFlags);
    expect(resolveFeatureFlags(defaultFeatureFlags, false)).toEqual(defaultFeatureFlags);
  });
});
