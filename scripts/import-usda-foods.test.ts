import { describe, expect, it } from 'vitest';
import { normalizeUsdaFood } from './import-usda-foods';

describe('USDA import normalization', () => {
  it('maps controlled nutrient ids and Russian aliases', () => {
    const value = normalizeUsdaFood({ fdcId: 1, description: 'Buckwheat groats, roasted, cooked', foodNutrients: [
      { nutrient: { id: 1008 }, amount: 92 }, { nutrient: { id: 1003 }, amount: 3.4 },
      { nutrient: { id: 1004 }, amount: 0.6 }, { nutrient: { id: 1005 }, amount: 19.9 },
    ] }, 'test');
    expect(value?.name).toContain('Гречка варёная'); expect(value?.aliases).toContain('гречневая каша'); expect(value?.caloriesPer100g).toBe(92);
  });
  it('rejects records with incomplete core nutrition', () => { expect(normalizeUsdaFood({ fdcId: 2, description: 'Apple, raw', foodNutrients: [] }, 'test')).toBeNull(); });
});
