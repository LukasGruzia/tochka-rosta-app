import { describe, expect, it } from 'vitest';
import { getDiaryCopyPreview, getMealTemplateCalories } from './mealOperations';
import type { DiaryEntry, Product } from '@/types/domain';

const entry = (id: number, mealType: DiaryEntry['mealType'], calories: number): DiaryEntry => ({ id, productId: id, productName: 'Еда', imageKey: '', imageUri: null, sourceType: 'usda', mealType, servings: 1, servingSizeG: 100, quantityG: 100, calories, proteinG: 1, fatG: 1, carbsG: 1, createdAt: '' });
const product = { id: 1, caloriesPer100g: 200 } as Product;
describe('meal templates and diary copy preview', () => {
  it('previews a selected meal separately from the full day', () => { const entries = [entry(1, 'breakfast', 300), entry(2, 'lunch', 500)]; expect(getDiaryCopyPreview(entries, 'breakfast')).toMatchObject({ count: 1, calories: 300 }); expect(getDiaryCopyPreview(entries, null)).toMatchObject({ count: 2, calories: 800 }); });
  it('calculates a template from saved gram weights', () => { expect(getMealTemplateCalories([{ product, mealType: 'breakfast', servings: 1, quantityG: 150 }])).toBe(300); });
});
