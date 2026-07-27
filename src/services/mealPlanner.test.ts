import { describe, expect, it } from 'vitest';
import { generateMealPlan } from './mealPlanner';
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
});
