import type { OnboardingStep } from './onboardingState';

export const onboardingRouteByStep: Record<OnboardingStep, string> = {
  welcome: '/(onboarding)/welcome',
  goal: '/(onboarding)/goal',
  profile: '/(onboarding)/personal-data',
  preferences: '/(onboarding)/preferences',
  result: '/(onboarding)/calculation',
  'first-entry': '/(onboarding)/first-entry',
};
