import foods from './usda-common-foods.json';
import { describe, expect, it } from 'vitest';
import { normalizeSearchText } from '../../services/productSearch';

describe('bundled food data quality', () => {
  it('contains no empty names, categories or non-positive portions', () => {
    expect(foods.filter((food) => !food.name.trim() || !food.category.trim() || food.servingSizeG <= 0)).toEqual([]);
  });

  it('contains no negative core nutrition values', () => {
    expect(foods.filter((food) => [food.caloriesPer100g, food.proteinPer100g, food.fatPer100g, food.carbsPer100g].some((value) => value < 0))).toEqual([]);
  });

  it('contains no duplicate normalized Russian names', () => {
    const seen = new Set<string>();
    const duplicates = foods.map((food) => normalizeSearchText(food.name)).filter((name) => seen.has(name) || !seen.add(name));
    expect(duplicates).toEqual([]);
  });
});
