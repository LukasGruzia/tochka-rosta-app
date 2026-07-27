import { describe, expect, it } from 'vitest';
import { normalizeOpenFoodFactsResponse } from './openFoodFacts';

describe('Open Food Facts normalization', () => {
  it('handles complete response', () => {
    const result = normalizeOpenFoodFactsResponse('3017620422003', { product: { product_name: 'Продукт', brands: 'Бренд', nutriments: { 'energy-kcal_100g': 250, proteins_100g: 8, fat_100g: 10, carbohydrates_100g: 30 } } });
    expect(result).toMatchObject({ caloriesPer100g: 250, proteinPer100g: 8, fatPer100g: 10, carbsPer100g: 30 });
  });

  it('keeps missing nutrient values unknown', () => {
    const result = normalizeOpenFoodFactsResponse('3017620422003', { product: { product_name: 'Неполный продукт', nutriments: {} } });
    expect(result?.proteinPer100g).toBeNull();
    expect(result?.caloriesPer100g).toBeNull();
  });
});
