import { describe, expect, it } from 'vitest';
import { progressivePromptCooldownMs, shouldShowProgressivePrompt } from './progressiveOnboarding';

describe('progressive onboarding cooldown', () => {
  it('waits for meaningful use and respects dismissal cooldown', () => {
    const now = Date.parse('2026-08-02T12:00:00.000Z');
    expect(shouldShowProgressivePrompt(1, null, now)).toBe(false);
    expect(shouldShowProgressivePrompt(2, null, now)).toBe(true);
    expect(shouldShowProgressivePrompt(2, new Date(now - 1000).toISOString(), now)).toBe(false);
    expect(shouldShowProgressivePrompt(2, new Date(now - progressivePromptCooldownMs - 1).toISOString(), now)).toBe(true);
  });
});
