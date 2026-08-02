import { describe, expect, it } from 'vitest';
import { buildOnboardingResearchSummary, type LocalOnboardingEvent } from './onboardingAnalytics';

describe('local onboarding research report', () => {
  it('contains technical counters without personal profile fields', () => {
    const events: LocalOnboardingEvent[] = [
      { name: 'onboarding_started', occurredAt: '2026-08-02T10:00:00.000Z' },
      { name: 'onboarding_completed', occurredAt: '2026-08-02T10:01:00.000Z', durationMs: 60_000 },
    ];
    const report = buildOnboardingResearchSummary(events);
    expect(report.counts.onboarding_started).toBe(1);
    expect(report.latestDurationMs).toBe(60_000);
    expect(JSON.stringify(report)).not.toMatch(/name|weight|age|allerg/i);
  });
});
