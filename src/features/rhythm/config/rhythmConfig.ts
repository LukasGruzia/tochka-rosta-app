import type { RhythmFeedbackType, RhythmMode } from '../types/rhythm';

export const rhythmConfig = {
  queueLimit: 3,
  initiativeCooldownMs: 2.5 * 60 * 60 * 1000,
  sameTemplateCooldownMs: 24 * 60 * 60 * 1000,
  rejectionSuppressionCount: 2,
  historyCaps: { messages: 200, events: 500, recommendations: 100, feedback: 500 },
  planner: { beamWidth: 20, perStepCandidates: 16, resultCount: 4, maxSingles: 20, maxPairs: 100, maxTriples: 40 },
  weights: {
    calorieFit: 0.28, proteinFit: 0.23, macroFit: 0.12, mealFit: 0.10,
    goalFit: 0.08, budgetFit: 0.07, preferenceFit: 0.05, diversityFit: 0.04, availabilityFit: 0.03,
  },
  feedbackWeights: { accepted: 2, favorite: 2, opened: 0.25, replaced: -0.5, dismissed: -1, removedSoon: -1.5, repeated: 1 } satisfies Record<RhythmFeedbackType, number>,
  preferenceDecayDays: 30,
  toastDurationMs: 5200,
} as const;

export const rhythmModeRank: Record<RhythmMode, number> = { off: 0, quiet: 1, balanced: 2, active: 3 };

export const defaultRhythmSettings = {
  mode: 'balanced', enabled: true, showOnOtherScreens: true,
  animationsEnabled: true, hapticsEnabled: true, onboardingCompleted: false,
} as const;

