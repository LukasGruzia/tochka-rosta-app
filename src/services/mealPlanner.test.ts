import { describe, expect, it } from 'vitest';
import { generateMealPlan, scoreProductForMeal } from './mealPlanner';
import type { NutritionResult, Product, ProfileDraft } from '@/types/domain';

const profile: ProfileDraft = { name: 'Лука', age: 30, calculationSex: 'male', heightCm: 175, weightKg: 70, activityLevel: 'medium', goal: 'balance', dietPreference: 'all', restrictions: [] };
const target: NutritionResult = { bmr: 1700, tdee: 2200, calories: 2000, proteinG: 120, fatG: 67, carbsG: 225, goal: 'balance', activityFactor: 1.55 };
const makeProduct = (id: number, meal: Product['mealTags']): Product => ({
  id, slug: String(id), name: `Блюдо ${id}`, originalName: null, description: '', ingredients: null,
  servingSizeG: 250, packageSizeG: null, calories: 450, proteinG: 30, fatG: 15, carbsG: 45,
  caloriesPer100g: 180, proteinPer100g: 12, fatPer100g: 6, carbsPer100g: 18, fiberPer100g: null,
  sugarPer100g: null, sodiumPer100g: null, price: 300, imageKey: '', imageUri: null, category: 'Основное',
  mealTags: meal, goalTags: ['balance'], dietTags: [], allergens: [], aliases: [], barcode: null, qrCode: null,
  isAvailable: true, dataStatus: 'demo', sourceType: 'tochka_rosta', sourceId: String(id), sourceName: 'Точка Роста',
  sourceVersion: null, locale: 'ru', isUserCreated: false, isFavorite: false, createdAt: null, updatedAt: null,
});

describe('meal planner', () => {
  it('builds four varied meal positions', () => {
    const plan = generateMealPlan('2026-07-28', [makeProduct(1, ['breakfast']), makeProduct(2, ['lunch']), makeProduct(3, ['snack']), makeProduct(4, ['dinner'])], target, profile);
    expect(plan.items.map((item) => item.mealType)).toEqual(['breakfast', 'lunch', 'snack', 'dinner']);
    expect(new Set(plan.items.map((item) => item.product.id)).size).toBe(4);
  });
  it('scores a matching meal tag above an unrelated product', () => { expect(scoreProductForMeal(makeProduct(1, ['breakfast']), 'breakfast', target, profile, new Set())).toBeGreaterThan(scoreProductForMeal(makeProduct(2, ['dinner']), 'breakfast', target, profile, new Set())); });
  it('supports three and five meal positions without changing the default', () => {
    const products = Array.from({ length: 8 }, (_, index) => makeProduct(index + 1, ['breakfast', 'lunch', 'snack', 'dinner']));
    expect(generateMealPlan('2026-07-28', products, target, profile, {}, { mealsPerDay: 3 }).items).toHaveLength(3);
    expect(generateMealPlan('2026-07-28', products, target, profile, {}, { mealsPerDay: 5 }).items).toHaveLength(5);
    expect(generateMealPlan('2026-07-28', products, target, profile).items).toHaveLength(4);
  });
  it('uses budget weighting only when it is enabled', () => {
    const expensive = { ...makeProduct(1, ['lunch']), price: 900 };
    const affordable = { ...makeProduct(2, ['lunch']), price: 120 };
    const budget = { perMealBudget: 200, dailyBudget: 800, weeklyBudget: 5000, currency: 'RUB', includeInRecommendations: true, showOnHome: true } as const;
    expect(scoreProductForMeal(affordable, 'lunch', target, profile, new Set(), { mode: 'budget', budget })).toBeGreaterThan(scoreProductForMeal(expensive, 'lunch', target, profile, new Set(), { mode: 'budget', budget }));
  });
});
