import type { BudgetSettings, MealPlan, MealPlanItem, MealType, NutritionResult, Product, ProfileDraft } from '@/types/domain';

const mealShares: Record<MealType, number> = { breakfast: 0.25, lunch: 0.35, snack: 0.15, dinner: 0.25 };
const meals: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
export interface DailyPlanOptions { mealsPerDay?:3|4|5;mode?:'tochka'|'mixed'|'home'|'budget'|'highProtein'|'quick';budget?:BudgetSettings|null; }
const sequences:Record<3|4|5,MealType[]>={3:['breakfast','lunch','dinner'],4:meals,5:['breakfast','snack','lunch','snack','dinner']};

function conflictsWithProfile(product: Product, profile: ProfileDraft) {
  if (profile.dietPreference === 'vegetarian' && product.dietTags.includes('meat')) return true;
  if (profile.dietPreference === 'plant' && product.dietTags.some((tag) => ['meat', 'fish', 'dairy', 'egg'].includes(tag))) return true;
  return profile.restrictions.some((restriction) => product.allergens.includes(restriction));
}

export function scoreProductForMeal(product: Product, meal: MealType, target: NutritionResult, profile: ProfileDraft, usedIds: Set<number>,options:DailyPlanOptions={}) {
  if (!product.isAvailable || conflictsWithProfile(product, profile)) return Number.NEGATIVE_INFINITY;
  const mealCalories = target.calories * mealShares[meal];
  let score = 100 - Math.abs(product.calories - mealCalories) / Math.max(1, mealCalories) * 65;
  if (product.mealTags.includes(meal)) score += 35;
  if (product.goalTags.includes(profile.goal)) score += 18;
  if (product.proteinG != null && product.proteinG >= target.proteinG * mealShares[meal] * 0.75) score += 14;
  if (profile.dietPreference !== 'all' && product.dietTags.includes(profile.dietPreference)) score += 10;
  if (usedIds.has(product.id)) score -= 100;
  if(options.mode==='tochka'&&product.sourceType!=='tochka_rosta')return Number.NEGATIVE_INFINITY;
  if(options.mode==='home'&&product.sourceType==='tochka_rosta')return Number.NEGATIVE_INFINITY;
  if(options.mode==='highProtein')score+=(product.proteinG??0)>=18?24:-18;
  if(options.mode==='quick')score+=product.sourceType==='tochka_rosta'||product.category==='Готовые блюда'?22:-8;
  const perMeal=options.budget?.includeInRecommendations?(options.budget.perMealBudget??(options.budget.dailyBudget?options.budget.dailyBudget/(options.mealsPerDay??4):null)):null;
  if(perMeal!=null)score+=product.price<=perMeal?16:-Math.min(30,(product.price-perMeal)/Math.max(1,perMeal)*30);
  if(options.mode==='budget')score-=product.price/Math.max(20,(options.budget?.dailyBudget??800))*35;
  return score;
}

export function generateMealPlan(date: string, products: Product[], target: NutritionResult, profile: ProfileDraft, replacements: Partial<Record<MealType, number>> = {},options:DailyPlanOptions={}): MealPlan {
  const usedIds = new Set<number>();
  const items: MealPlanItem[] = sequences[options.mealsPerDay??4].map((meal) => {
    const forced = replacements[meal] ? products.find((product) => product.id === replacements[meal]) : null;
    const ranked = [...products].sort((a, b) => scoreProductForMeal(b, meal, target, profile, usedIds,options) - scoreProductForMeal(a, meal, target, profile, usedIds,options));
    const product = forced ?? ranked.find((item) => Number.isFinite(scoreProductForMeal(item, meal, target, profile, usedIds,options)));
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
