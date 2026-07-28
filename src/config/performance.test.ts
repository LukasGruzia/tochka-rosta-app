import { describe, expect, it } from 'vitest';

import { resolvePerformanceCapabilities } from './performance';

describe('adaptive performance modes', () => {
  it('resolves automatic mode to balanced and preserves key iOS glass', () => {
    expect(resolvePerformanceCapabilities('automatic', {
      platform: 'ios',
      reducedMotion: false,
      appActive: true,
    })).toMatchObject({ resolvedMode: 'balanced', nativeBlur: true, idleAnimations: true, dragNavigation: false });
  });

  it('stops idle work in background', () => {
    expect(resolvePerformanceCapabilities('full', {
      platform: 'ios',
      reducedMotion: false,
      appActive: false,
    })).toMatchObject({ idleAnimations: false, transitionAnimations: false, dragNavigation: false });
  });

  it('honors system reduced motion even when full quality was requested', () => {
    expect(resolvePerformanceCapabilities('full', {
      platform: 'ios',
      reducedMotion: true,
      appActive: true,
    })).toMatchObject({ resolvedMode: 'reduced', nativeBlur: false, idleAnimations: false });
  });
});
