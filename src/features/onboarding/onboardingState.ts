import type { ProfileDraft, Restriction } from '@/types/domain';

export const ONBOARDING_VERSION = 2;

export const onboardingSteps = [
  'welcome',
  'goal',
  'profile',
  'preferences',
  'result',
  'first-entry',
] as const;

export type OnboardingStep = (typeof onboardingSteps)[number];
export type OnboardingSource = 'organic' | 'resume' | 'existing-profile';

export interface FirstMinuteState {
  onboardingVersion: number;
  currentStep: OnboardingStep;
  startedAt: string | null;
  completedAt: string | null;
  selectedGoal: ProfileDraft['goal'] | null;
  enteredProfileDraft: ProfileDraft;
  selectedRestrictions: Restriction[];
  firstEntryCompleted: boolean;
  wasSkipped: boolean;
  source: OnboardingSource;
  durationMs: number | null;
  skippedSteps: OnboardingStep[];
  validationErrorsCount: number;
  resumeCount: number;
}

export const profileLimits = {
  age: { min: 16, max: 100 },
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 35, max: 250 },
} as const;

export type ProfileValidationErrors = Partial<Record<'age' | 'heightCm' | 'weightKg', string>>;

export function createFirstMinuteState(
  draft: ProfileDraft,
  source: OnboardingSource = 'organic',
): FirstMinuteState {
  return {
    onboardingVersion: ONBOARDING_VERSION,
    currentStep: 'welcome',
    startedAt: null,
    completedAt: null,
    selectedGoal: null,
    enteredProfileDraft: { ...draft, restrictions: [...draft.restrictions] },
    selectedRestrictions: [],
    firstEntryCompleted: false,
    wasSkipped: false,
    source,
    durationMs: null,
    skippedSteps: [],
    validationErrorsCount: 0,
    resumeCount: 0,
  };
}

export function isOnboardingStep(value: unknown): value is OnboardingStep {
  return typeof value === 'string' && onboardingSteps.includes(value as OnboardingStep);
}

export function mapLegacyOnboardingStep(value: string | null): OnboardingStep {
  if (isOnboardingStep(value)) return value;
  if (value === 'personal-data' || value === 'body-parameters' || value === 'activity') return 'profile';
  if (value === 'calculation') return 'result';
  if (value === 'finish') return 'first-entry';
  if (value === 'name' || value === 'introduction') return 'welcome';
  return 'welcome';
}

export function parseFirstMinuteState(
  value: string | null,
  draft: ProfileDraft,
  legacyStep: string | null,
): FirstMinuteState {
  const fallback = createFirstMinuteState(draft, legacyStep && legacyStep !== 'welcome' ? 'resume' : 'organic');
  fallback.currentStep = mapLegacyOnboardingStep(legacyStep);
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value) as Partial<FirstMinuteState>;
    if (parsed.onboardingVersion !== ONBOARDING_VERSION) return fallback;
    return {
      ...fallback,
      ...parsed,
      currentStep: isOnboardingStep(parsed.currentStep) ? parsed.currentStep : fallback.currentStep,
      enteredProfileDraft: {
        ...draft,
        ...parsed.enteredProfileDraft,
        restrictions: Array.isArray(parsed.enteredProfileDraft?.restrictions)
          ? parsed.enteredProfileDraft.restrictions
          : draft.restrictions,
      },
      selectedRestrictions: Array.isArray(parsed.selectedRestrictions) ? parsed.selectedRestrictions : [],
      skippedSteps: Array.isArray(parsed.skippedSteps)
        ? parsed.skippedSteps.filter(isOnboardingStep)
        : [],
    };
  } catch {
    return fallback;
  }
}

export function beginFirstMinute(
  current: FirstMinuteState,
  now = new Date().toISOString(),
): FirstMinuteState {
  return {
    ...current,
    currentStep: 'goal',
    startedAt: current.startedAt ?? now,
    completedAt: null,
    durationMs: null,
  };
}

export function advanceFirstMinute(
  current: FirstMinuteState,
  step: OnboardingStep,
  draft: ProfileDraft,
): FirstMinuteState {
  return {
    ...current,
    currentStep: step,
    selectedGoal: draft.goal,
    enteredProfileDraft: { ...draft, restrictions: [...draft.restrictions] },
    selectedRestrictions: [...draft.restrictions],
  };
}

export function addValidationErrors(current: FirstMinuteState, count: number): FirstMinuteState {
  return { ...current, validationErrorsCount: current.validationErrorsCount + Math.max(0, count) };
}

export function markFirstEntry(current: FirstMinuteState): FirstMinuteState {
  return { ...current, firstEntryCompleted: true, wasSkipped: false };
}

export function completeFirstMinute(
  current: FirstMinuteState,
  options: { firstEntryCompleted?: boolean; wasSkipped?: boolean } = {},
  now = new Date().toISOString(),
): FirstMinuteState {
  const started = current.startedAt ? new Date(current.startedAt).getTime() : new Date(now).getTime();
  const finished = new Date(now).getTime();
  const wasSkipped = options.wasSkipped ?? current.wasSkipped;
  return {
    ...current,
    completedAt: now,
    firstEntryCompleted: options.firstEntryCompleted ?? current.firstEntryCompleted,
    wasSkipped,
    durationMs: Math.max(0, finished - started),
    skippedSteps: wasSkipped && !current.skippedSteps.includes('first-entry')
      ? [...current.skippedSteps, 'first-entry']
      : current.skippedSteps,
  };
}

export function incrementResumeCount(current: FirstMinuteState): FirstMinuteState {
  return { ...current, source: 'resume', resumeCount: current.resumeCount + 1 };
}

export function validateProfileDraft(draft: ProfileDraft): ProfileValidationErrors {
  const errors: ProfileValidationErrors = {};
  if (!Number.isFinite(draft.age) || draft.age < profileLimits.age.min || draft.age > profileLimits.age.max) {
    errors.age = 'Проверь возраст';
  }
  if (!Number.isFinite(draft.heightCm) || draft.heightCm < profileLimits.heightCm.min || draft.heightCm > profileLimits.heightCm.max) {
    errors.heightCm = 'Проверь рост';
  }
  if (!Number.isFinite(draft.weightKg) || draft.weightKg < profileLimits.weightKg.min || draft.weightKg > profileLimits.weightKg.max) {
    errors.weightKg = 'Проверь вес';
  }
  return errors;
}

export function hasFiniteNutritionResult(value: {
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}) {
  return [value.calories, value.proteinG, value.fatG, value.carbsG]
    .every((item) => Number.isFinite(item) && item > 0);
}
