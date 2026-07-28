import { describe, expect, it } from 'vitest';
import { defaultFeatureFlags, resolveFeatureFlags, resolveFeatureFlagsForPerformance, safeModeFeatureFlags } from './features';
import { resolvePerformanceCapabilities } from './performance';

describe('UI feature flags', () => {
  it('keeps drag available only when the selected performance mode allows it', () => {
    expect(defaultFeatureFlags.enableLiquidTabDrag).toBe(true);
    expect(defaultFeatureFlags.enableSheetGestures).toBe(false);
    const full = resolveFeatureFlagsForPerformance(defaultFeatureFlags, resolvePerformanceCapabilities('full', { platform: 'ios', reducedMotion: false, appActive: true }));
    const balanced = resolveFeatureFlagsForPerformance(defaultFeatureFlags, resolvePerformanceCapabilities('balanced', { platform: 'ios', reducedMotion: false, appActive: true }));
    expect(full.enableLiquidTabDrag).toBe(true);
    expect(balanced.enableLiquidTabDrag).toBe(false);
  });

  it('turns continuous effects, blur, haptics and gestures off in reduced mode', () => {
    const capabilities = resolvePerformanceCapabilities('reduced', {
      platform: 'ios',
      reducedMotion: false,
      appActive: true,
    });
    const flags = resolveFeatureFlagsForPerformance(defaultFeatureFlags, capabilities);
    expect(flags.enableAdvancedGlassBlur).toBe(false);
    expect(flags.enableFlowFlameIdleAnimation).toBe(false);
    expect(flags.enableHaptics).toBe(false);
    expect(flags.enableLiquidTabDrag).toBe(false);
  });

  it('safe mode disables complex animation without affecting business features', () => {
    expect(resolveFeatureFlags(defaultFeatureFlags, true)).toEqual(safeModeFeatureFlags);
    expect(resolveFeatureFlags(defaultFeatureFlags, false)).toEqual(defaultFeatureFlags);
  });
});
