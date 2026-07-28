import { describe, expect, it } from 'vitest';
import { groupProductsBySource, searchProducts } from './productSearch';
import type { Product } from '@/types/domain';

const base = { originalName: null, description: '', ingredients: null, servingSizeG: 100, packageSizeG: null,
  calories: 100, proteinG: 1, fatG: 1, carbsG: 1, caloriesPer100g: 100, proteinPer100g: 1,
  fatPer100g: 1, carbsPer100g: 1, fiberPer100g: null, sugarPer100g: null, sodiumPer100g: null, price: 0,
  imageKey: '', imageUri: null, category: 'Крупы', mealTags: [], goalTags: [], dietTags: [], allergens: [],
  barcode: null, qrCode: null, isAvailable: true, dataStatus: 'imported' as const, sourceType: 'usda' as const,
  sourceId: '1', sourceName: 'USDA FoodData Central', sourceVersion: 'FNDDS 2021-2023', locale: 'ru',
  isUserCreated: false, isFavorite: false, createdAt: null, updatedAt: null };
const products: Product[] = [
  { ...base, id: 1, slug: 'buckwheat', name: 'Гречка варёная', aliases: ['гречневая каша', 'греча'] },
  { ...base, id: 2, slug: 'chicken', name: 'Куриная грудка', aliases: ['кур грудка'] },
  { ...base, id: 3, slug: 'curd', name: 'Творог 5%', aliases: ['творог пять процентов'] },
];

describe('local product search', () => {
  it.each([['греча', 1], ['кур грудка', 2], ['творог 5', 3]])('finds %s using Russian names and aliases', (query, id) => {
    expect(searchProducts(products, query)[0]?.id).toBe(id);
  });
  it('tolerates a small typo', () => { expect(searchProducts(products, 'гречкка')[0]?.id).toBe(1); });
  it('groups favorites and source sections without losing products', () => { const groups = groupProductsBySource([{ ...products[0], isFavorite: true }, { ...products[1], sourceType: 'user_product', isUserCreated: true }]); expect(groups.my[0].id).toBe(2); expect(groups.common[0].isFavorite).toBe(true); });
});
