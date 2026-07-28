import { describe, expect, it } from 'vitest';
import { defaultFeatureFlags, resolveFeatureFlags, safeModeFeatureFlags } from './features';

describe('UI feature flags', () => {
  it('keeps experimental drag and sheet gestures off by default', () => {
    expect(defaultFeatureFlags.enableLiquidTabDrag).toBe(false);
    expect(defaultFeatureFlags.enableSheetGestures).toBe(false);
  });

  it('safe mode disables complex animation without affecting business features', () => {
    expect(resolveFeatureFlags(defaultFeatureFlags, true)).toEqual(safeModeFeatureFlags);
    expect(resolveFeatureFlags(defaultFeatureFlags, false)).toEqual(defaultFeatureFlags);
  });
});
