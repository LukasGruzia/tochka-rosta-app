import { describe, expect, it } from 'vitest';
import { calculateForWeight, calculateRecipe, hasCalorieMismatch, normalizeTo100g } from './foodMath';
import type { Product, ProductDraft } from '@/types/domain';

const draft: ProductDraft = {
  name: 'Тест', category: 'Другое', basisType: 'serving', basisAmount: 1, basisUnit: 'serving',
  servingSizeG: 50, calories: 100, proteinG: 5, fatG: 2, carbsG: 15, allergens: [],
};

const product: Product = {
  id: 1, slug: 'test', name: 'Тест', originalName: null, description: '', ingredients: null,
  servingSizeG: 100, packageSizeG: null, calories: 200, proteinG: 10, fatG: 4, carbsG: 30,
  caloriesPer100g: 200, proteinPer100g: 10, fatPer100g: 4, carbsPer100g: 30,
  fiberPer100g: null, sugarPer100g: null, sodiumPer100g: null, price: 0, imageKey: '', imageUri: null,
  category: 'Другое', mealTags: [], goalTags: [], dietTags: [], allergens: [], aliases: [], barcode: null,
  qrCode: null, isAvailable: true, dataStatus: 'custom', sourceType: 'user_product', sourceId: null,
  sourceName: 'Пользователь', sourceVersion: null, locale: 'ru', isUserCreated: true, isFavorite: false,
  createdAt: null, updatedAt: null,
};

describe('food math', () => {
  it('normalizes serving values to 100 grams', () => {
    expect(normalizeTo100g(draft)).toMatchObject({ calories: 200, proteinG: 10, fatG: 4, carbsG: 30 });
  });

  it('normalizes package values to 100 grams', () => {
    expect(normalizeTo100g({ ...draft, basisType: 'package', packageSizeG: 250, calories: 500 })).toMatchObject({ calories: 200 });
  });

  it('keeps unknown macros unknown', () => {
    expect(normalizeTo100g({ ...draft, proteinG: null }).proteinG).toBeNull();
  });

  it('recalculates nutrition for arbitrary weight', () => {
    expect(calculateForWeight(product, 150)).toMatchObject({ calories: 300, proteinG: 15, fatG: 6, carbsG: 45 });
  });

  it('warns about a meaningful calorie mismatch', () => {
    expect(hasCalorieMismatch({ calories: 500, proteinG: 10, fatG: 5, carbsG: 10 })).toBe(true);
    expect(hasCalorieMismatch({ calories: 125, proteinG: 10, fatG: 5, carbsG: 10 })).toBe(false);
  });

  it('calculates recipe totals, per 100g and per serving', () => {
    const result = calculateRecipe([{ product, amountG: 200 }], 160, 2);
    expect(result.totals.calories).toBe(400);
    expect(result.per100g.calories).toBe(250);
    expect(result.perServing.calories).toBe(200);
  });
});
