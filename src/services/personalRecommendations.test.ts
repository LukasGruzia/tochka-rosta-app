import { describe, expect, it } from 'vitest';
import { rankPersonalRecommendations } from './personalRecommendations';
import type { Product, ProfileDraft } from '@/types/domain';

const makeProduct = (id: number, patch: Partial<Product> = {}) => ({ id, name: `Продукт ${id}`, caloriesPer100g: 200, servingSizeG: 100, allergens: [], dietTags: [], goalTags: [], mealTags: [], isFavorite: false, sourceType: 'usda', ...patch } as Product);
const profile: ProfileDraft = { name: 'Анна', age: 30, calculationSex: 'female', heightCm: 168, weightKg: 70, activityLevel: 'medium', goal: 'loss', restrictions: [], dietPreference: 'all' };
describe('personal food recommendations', () => {
  it('ranks a meal and goal match near the calorie remainder first', () => { const ranked = rankPersonalRecommendations([makeProduct(1), makeProduct(2, { goalTags: ['loss'], mealTags: ['lunch'], caloriesPer100g: 420 })], profile, 450, 'lunch'); expect(ranked[0].id).toBe(2); });
  it('removes products conflicting with restrictions', () => { const restricted: ProfileDraft = { ...profile, restrictions: ['nutFree'] }; expect(rankPersonalRecommendations([makeProduct(1, { allergens: ['Peanuts'] })], restricted, 300)).toHaveLength(0); });
});
