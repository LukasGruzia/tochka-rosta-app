import type { BudgetSettings, DiarySummary, FlowState, MealType, NutritionResult, Product, ProfileDraft } from '@/types/domain';

export type RhythmEmotion =
  | 'idle' | 'thinking' | 'happy' | 'motivated' | 'caring' | 'surprised'
  | 'supportive' | 'celebrating' | 'sleeping' | 'neutralAttention' | 'food';

export type RhythmAction =
  | 'none' | 'wave' | 'point' | 'presentAdvice' | 'holdFood'
  | 'run' | 'stretch' | 'blink' | 'celebrate' | 'rest' | 'smallJump' | 'lookAtCard';

export type RhythmSize = 'small' | 'compact' | 'medium' | 'large' | 'hero';
export type RhythmMode = 'active' | 'balanced' | 'quiet';
export type RhythmEventType =
  | 'APP_OPENED' | 'SCREEN_OPENED' | 'MEAL_ADDED' | 'MEAL_REMOVED' | 'MEAL_UPDATED'
  | 'WATER_ADDED' | 'WEIGHT_ADDED' | 'MEAL_PLAN_CREATED' | 'REMAINDER_MATCH_OPENED'
  | 'RECOMMENDATION_ACCEPTED' | 'RECOMMENDATION_REJECTED' | 'RECOMMENDATION_REPLACED'
  | 'DAY_READY_TO_CLOSE' | 'DAY_COMPLETED' | 'FLOW_MILESTONE' | 'WEEK_COMPLETED'
  | 'BUDGET_APPROACHING' | 'BUDGET_EXCEEDED' | 'EMPTY_MEAL_DETECTED' | 'INSIGHT_CREATED';

export interface RhythmVisualState {
  emotion: RhythmEmotion;
  action: RhythmAction;
  intensity?: number;
  message?: string;
}

export interface RhythmSettings {
  mode: RhythmMode;
  enabled: boolean;
  showOnOtherScreens: boolean;
  animationsEnabled: boolean;
  hapticsEnabled: boolean;
  reactionsEnabled: boolean;
  recommendationsEnabled: boolean;
  budgetEnabled: boolean;
  historyEnabled: boolean;
  interfaceSoundsEnabled: boolean;
  onboardingCompleted: boolean;
}

export interface RhythmEvent {
  id?: number;
  type: RhythmEventType;
  route?: string;
  payload?: Record<string, unknown>;
  createdAt?: string;
}

export type RhythmMessageCategory = 'mealAdded' | 'balance' | 'flow' | 'planner' | 'emptyMeal' | 'support' | 'error' | 'quiet';

export interface RhythmMessageTemplate {
  id: string;
  category: RhythmMessageCategory;
  text: string;
  title?: string;
  emotion: RhythmEmotion;
  action: RhythmAction;
  minMode?: RhythmMode;
}

export interface RhythmContext {
  now: string;
  route: string;
  profile: ProfileDraft | null;
  target: NutritionResult | null;
  diary: DiarySummary | null;
  flow: FlowState | null;
  budget: BudgetSettings | null;
  performanceMode: string;
  reducedMotion: boolean;
  remaining: { calories: number; proteinG: number; fatG: number; carbsG: number } | null;
  mealCounts: Partial<Record<MealType, number>>;
  recentTemplateIds: string[];
  recentRejections: number;
  lastInitiativeAt: string | null;
  contextHash: string;
}

export interface RhythmDecision {
  id?: number;
  eventType: RhythmEventType;
  templateId: string;
  message: string;
  visual: RhythmVisualState;
  priority: number;
  kind: 'toast' | 'card' | 'center';
  route: string;
  createdAt?: string;
}

export interface RhythmScoreBreakdown {
  calorieFit: number;
  proteinFit: number;
  macroFit: number;
  mealFit: number;
  goalFit: number;
  budgetFit: number;
  preferenceFit: number;
  diversityFit: number;
  availabilityFit: number;
  penalty: number;
  total: number;
}

export interface RhythmCandidateItem {
  product: Product;
  servings: number;
  quantityG: number;
}

export interface RhythmRecommendation {
  id: string;
  items: RhythmCandidateItem[];
  score: number;
  breakdown: RhythmScoreBreakdown;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  price: number;
  reasons: string[];
  contextHash: string;
}

export type RhythmFeedbackType = 'accepted' | 'favorite' | 'opened' | 'replaced' | 'dismissed' | 'removedSoon' | 'repeated';

