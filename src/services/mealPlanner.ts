import type { MealPlan, MealPlanItem, MealType, NutritionResult, Product, ProfileDraft } from '@/types/domain';

const mealShares: Record<MealType, number> = { breakfast: 0.25, lunch: 0.35, snack: 0.15, dinner: 0.25 };
const meals: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

function conflictsWithProfile(product: Product, profile: ProfileDraft) {
  if (profile.dietPreference === 'vegetarian' && product.dietTags.includes('meat')) return true;
  return profile.restrictions.some((restriction) => product.allergens.includes(restriction));
}

export function scoreProductForMeal(product: Product, meal: MealType, target: NutritionResult, profile: ProfileDraft, usedIds: Set<number>) {
  if (!product.isAvailable || conflictsWithProfile(product, profile)) return Number.NEGATIVE_INFINITY;
  const mealCalories = target.calories * mealShares[meal];
  let score = 100 - Math.abs(product.calories - mealCalories) / Math.max(1, mealCalories) * 65;
  if (product.mealTags.includes(meal)) score += 35;
  if (product.goalTags.includes(profile.goal)) score += 18;
  if (product.proteinG != null && product.proteinG >= target.proteinG * mealShares[meal] * 0.75) score += 14;
  if (profile.dietPreference !== 'all' && product.dietTags.includes(profile.dietPreference)) score += 10;
  if (usedIds.has(product.id)) score -= 100;
  return score;
}

export function generateMealPlan(date: string, products: Product[], target: NutritionResult, profile: ProfileDraft, replacements: Partial<Record<MealType, number>> = {}): MealPlan {
  const usedIds = new Set<number>();
  const items: MealPlanItem[] = meals.map((meal) => {
    const forced = replacements[meal] ? products.find((product) => product.id === replacements[meal]) : null;
    const ranked = [...products].sort((a, b) => scoreProductForMeal(b, meal, target, profile, usedIds) - scoreProductForMeal(a, meal, target, profile, usedIds));
    const product = forced ?? ranked.find((item) => Number.isFinite(scoreProductForMeal(item, meal, target, profile, usedIds)));
    if (!product) throw new Error('Недостаточно подходящих блюд для рациона');
    usedIds.add(product.id);
    return { date, product, mealType: meal, servings: 1, isAddedToDiary: false };
  });
  return {
    date,
    items,
    calories: items.reduce((sum, item) => sum + item.product.calories * item.servings, 0),
    proteinG: items.reduce((sum, item) => sum + (item.product.proteinG ?? 0) * item.servings, 0),
    fatG: items.reduce((sum, item) => sum + (item.product.fatG ?? 0) * item.servings, 0),
    carbsG: items.reduce((sum, item) => sum + (item.product.carbsG ?? 0) * item.servings, 0),
    price: items.reduce((sum, item) => sum + item.product.price * item.servings, 0),
  };
}
