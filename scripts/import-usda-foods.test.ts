import { describe, expect, it } from 'vitest';
import { finalizeCatalogNames, normalizeUsdaFood } from './import-usda-foods';

describe('USDA import normalization', () => {
  it('maps controlled nutrient ids and Russian aliases', () => {
    const value = normalizeUsdaFood({ fdcId: 1, description: 'Buckwheat groats, roasted, cooked', foodNutrients: [
      { nutrient: { id: 1008 }, amount: 92 }, { nutrient: { id: 1003 }, amount: 3.4 },
      { nutrient: { id: 1004 }, amount: 0.6 }, { nutrient: { id: 1005 }, amount: 19.9 },
    ] }, 'test');
    expect(value?.name).toContain('Гречка варёная'); expect(value?.aliases).toContain('гречневая каша'); expect(value?.caloriesPer100g).toBe(92);
  });
  it('rejects records with incomplete core nutrition', () => { expect(normalizeUsdaFood({ fdcId: 2, description: 'Apple, raw', foodNutrients: [] }, 'test')).toBeNull(); });
  it('uses semantic descriptors instead of technical sequence numbers', () => {
    const base = { category: 'Сыры', caloriesPer100g: 100, proteinPer100g: 10, fatPer100g: 5, carbsPer100g: 3, fiberPer100g: null, sugarPer100g: null, sodiumPer100g: null, servingSizeG: 100, aliases: [], sourceVersion: 'Foundation Foods' };
    const result = finalizeCatalogNames([
      { ...base, fdcId: 1, name: 'Сыр', originalName: 'Cheese, Gruyere' },
      { ...base, fdcId: 2, name: 'Сыр', originalName: 'Cheese, Brie' },
    ]);
    expect(result.map((food) => food.name)).toEqual(['Сыр — Gruyere', 'Сыр — Brie']);
    expect(result.every((food) => !food.name.includes('вариант'))).toBe(true);
  });
  it('turns imported size variants into serving options under one canonical key',()=>{
    const base={category:'Фрукты',caloriesPer100g:89,proteinPer100g:1.1,fatPer100g:.3,carbsPer100g:23,fiberPer100g:2.6,sugarPer100g:12,sodiumPer100g:1,aliases:[],sourceVersion:'Foundation Foods'};
    const result=finalizeCatalogNames([{...base,fdcId:10,name:'Банан',originalName:'Banana, small, raw',servingSizeG:90},{...base,fdcId:11,name:'Банан',originalName:'Banana, medium, raw',servingSizeG:120}]);
    expect(new Set(result.map(food=>food.canonicalKey)).size).toBe(1);
    expect(result.filter(food=>food.isActive)).toHaveLength(1);
    expect(result.find(food=>food.isActive)?.servingOptions?.map(option=>option.gramsEquivalent)).toEqual(expect.arrayContaining([90,120]));
  });
});
