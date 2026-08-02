import { describe, expect, it } from 'vitest';
import type { ProfileDraft } from '@/types/domain';
import {
  ONBOARDING_VERSION,
  advanceFirstMinute,
  beginFirstMinute,
  completeFirstMinute,
  createFirstMinuteState,
  hasFiniteNutritionResult,
  incrementResumeCount,
  mapLegacyOnboardingStep,
  markFirstEntry,
  parseFirstMinuteState,
  validateProfileDraft,
} from './onboardingState';

const draft: ProfileDraft = {
  name: '',
  age: 30,
  calculationSex: 'female',
  heightCm: 168,
  weightKg: 62,
  activityLevel: 'medium',
  goal: 'balance',
  dietPreference: 'all',
  restrictions: [],
};

describe('versioned first minute state', () => {
  it('starts at welcome and advances without losing the draft', () => {
    const started = beginFirstMinute(createFirstMinuteState(draft), '2026-08-02T10:00:00.000Z');
    const nextDraft = { ...draft, goal: 'loss' as const };
    const advanced = advanceFirstMinute(started, 'profile', nextDraft);
    expect(advanced.currentStep).toBe('profile');
    expect(advanced.selectedGoal).toBe('loss');
    expect(advanced.enteredProfileDraft.heightCm).toBe(168);
  });

  it('persists the version and resumes the same step', () => {
    const state = advanceFirstMinute(beginFirstMinute(createFirstMinuteState(draft)), 'preferences', draft);
    const restored = parseFirstMinuteState(JSON.stringify(state), draft, null);
    expect(restored.onboardingVersion).toBe(ONBOARDING_VERSION);
    expect(restored.currentStep).toBe('preferences');
    expect(incrementResumeCount(restored).resumeCount).toBe(1);
  });

  it('maps legacy routes to the compact flow', () => {
    expect(mapLegacyOnboardingStep('body-parameters')).toBe('profile');
    expect(mapLegacyOnboardingStep('calculation')).toBe('result');
    expect(mapLegacyOnboardingStep('finish')).toBe('first-entry');
  });

  it('marks first entry once and records completion duration', () => {
    const started = beginFirstMinute(createFirstMinuteState(draft), '2026-08-02T10:00:00.000Z');
    const withEntry = markFirstEntry(started);
    const completed = completeFirstMinute(withEntry, { firstEntryCompleted: true }, '2026-08-02T10:01:00.000Z');
    expect(completed.firstEntryCompleted).toBe(true);
    expect(completed.durationMs).toBe(60_000);
    expect(completed.wasSkipped).toBe(false);
  });

  it('records a skipped first entry without blocking completion', () => {
    const started = beginFirstMinute(createFirstMinuteState(draft), '2026-08-02T10:00:00.000Z');
    const completed = completeFirstMinute(started, { wasSkipped: true }, '2026-08-02T10:00:45.000Z');
    expect(completed.wasSkipped).toBe(true);
    expect(completed.skippedSteps).toContain('first-entry');
  });
});

describe('first minute validation', () => {
  it('rejects invalid age, height and weight without mutating valid values', () => {
    const errors = validateProfileDraft({ ...draft, age: Number.NaN, heightCm: 20, weightKg: 900 });
    expect(errors).toEqual({ age: 'Проверь возраст', heightCm: 'Проверь рост', weightKg: 'Проверь вес' });
    expect(validateProfileDraft(draft)).toEqual({});
  });

  it('never accepts NaN nutrition', () => {
    expect(hasFiniteNutritionResult({ calories: Number.NaN, proteinG: 100, fatG: 70, carbsG: 200 })).toBe(false);
    expect(hasFiniteNutritionResult({ calories: 2000, proteinG: 100, fatG: 70, carbsG: 200 })).toBe(true);
  });
});
