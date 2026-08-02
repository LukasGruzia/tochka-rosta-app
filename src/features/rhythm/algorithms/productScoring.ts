import type { BudgetSettings, MealType, NutritionResult, Product, ProfileDraft } from '@/types/domain';
import { rhythmConfig } from '../config/rhythmConfig';
import type { RhythmScoreBreakdown } from '../types/rhythm';

export interface ProductScoringContext {
  profile: ProfileDraft;
  target: NutritionResult;
  mealType: MealType;
  remaining: { calories: number; proteinG: number; fatG: number; carbsG: number };
  budget?: BudgetSettings | null;
  usedProductIds?: number[];
  preferenceWeights?: Record<number, number>;
}

const restrictionTerms: Record<ProfileDraft['restrictions'][number], string[]> = {
  lactoseFree: ['lactose', 'milk', 'dairy', 'лактоз', 'молок'],
  glutenFree: ['gluten', 'wheat', 'глютен', 'пшениц'],
  sugarFree: ['sugar', 'сахар'],
  nutFree: ['nut', 'peanut', 'орех', 'арахис'],
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const fit = (value: number, target: number, floor: number) => clamp01(1 - Math.abs(value - Math.max(0, target)) / Math.max(floor, Math.abs(target)));

export function isRhythmProductAllowed(product: Product, profile: ProfileDraft) {
  if (!product.isAvailable || product.calories <= 0 || product.servingSizeG <= 0) return false;
  if (![product.calories, product.price].every(Number.isFinite)) return false;
  const haystack = [product.name, product.category, product.ingredients ?? '', ...product.allergens, ...product.dietTags].join(' ').toLocaleLowerCase('ru-RU');
  if (profile.restrictions.some((restriction) => restrictionTerms[restriction].some((term) => haystack.includes(term)))) return false;
  if (profile.dietPreference === 'vegetarian' && /meat|fish|мяс|рыб|poultry|chicken/.test(haystack)) return false;
  if (profile.dietPreference === 'plant' && /meat|fish|мяс|рыб|poultry|chicken|egg|яйц|milk|молок|cheese|сыр/.test(haystack)) return false;
  if (profile.dietPreference === 'fish' && /meat|мяс|poultry|chicken/.test(haystack) && !/fish|рыб/.test(haystack)) return false;
  return true;
}

export function scoreRhythmProduct(product: Product, context: ProductScoringContext): RhythmScoreBreakdown {
  if (!isRhythmProductAllowed(product, context.profile)) return { calorieFit: 0, proteinFit: 0, macroFit: 0, mealFit: 0, goalFit: 0, budgetFit: 0, preferenceFit: 0, diversityFit: 0, availabilityFit: 0, penalty: 1, total: Number.NEGATIVE_INFINITY };
  const calories = product.calories;
  const protein = product.proteinG ?? 0;
  const fat = product.fatG ?? 0;
  const carbs = product.carbsG ?? 0;
  const calorieFit = fit(calories, Math.min(context.remaining.calories, context.target.calories * 0.35), 180);
  const proteinFit = fit(protein, Math.min(context.remaining.proteinG, context.target.proteinG * 0.35), 14);
  const macroFit = (fit(fat, Math.min(context.remaining.fatG, context.target.fatG * 0.35), 10) + fit(carbs, Math.min(context.remaining.carbsG, context.target.carbsG * 0.35), 24)) / 2;
  const mealFit = product.mealTags.includes(context.mealType) ? 1 : 0.35;
  const goalFit = product.goalTags.includes(context.profile.goal) ? 1 : 0.5;
  const mealBudget = context.budget?.includeInRecommendations ? context.budget.perMealBudget : null;
  const budgetFit = mealBudget == null ? 0.65 : clamp01(1 - Math.max(0, product.price - mealBudget) / Math.max(1, mealBudget));
  const learned = context.preferenceWeights?.[product.id] ?? 0;
  const preferenceFit = clamp01(0.5 + learned / 8);
  const diversityFit = context.usedProductIds?.includes(product.id) ? 0 : 1;
  const availabilityFit = product.dataStatus === 'verified' || product.dataStatus === 'imported' ? 1 : 0.65;
  const penalty = (product.dataStatus === 'demo' ? 0.08 : 0) + (context.usedProductIds?.includes(product.id) ? 0.12 : 0);
  const weights = rhythmConfig.weights;
  const total = (calorieFit * weights.calorieFit + proteinFit * weights.proteinFit + macroFit * weights.macroFit + mealFit * weights.mealFit + goalFit * weights.goalFit + budgetFit * weights.budgetFit + preferenceFit * weights.preferenceFit + diversityFit * weights.diversityFit + availabilityFit * weights.availabilityFit - penalty) * 100;
  return { calorieFit, proteinFit, macroFit, mealFit, goalFit, budgetFit, preferenceFit, diversityFit, availabilityFit, penalty, total };
}

export function mergeScoreBreakdowns(items: RhythmScoreBreakdown[]): RhythmScoreBreakdown {
  const keys: (keyof Omit<RhythmScoreBreakdown, 'total'>)[] = ['calorieFit','proteinFit','macroFit','mealFit','goalFit','budgetFit','preferenceFit','diversityFit','availabilityFit','penalty'];
  const result = Object.fromEntries(keys.map((key) => [key, items.reduce((sum, item) => sum + item[key], 0) / Math.max(1, items.length)])) as unknown as RhythmScoreBreakdown;
  const w = rhythmConfig.weights;
  result.total = (result.calorieFit*w.calorieFit+result.proteinFit*w.proteinFit+result.macroFit*w.macroFit+result.mealFit*w.mealFit+result.goalFit*w.goalFit+result.budgetFit*w.budgetFit+result.preferenceFit*w.preferenceFit+result.diversityFit*w.diversityFit+result.availabilityFit*w.availabilityFit-result.penalty)*100;
  return result;
}

