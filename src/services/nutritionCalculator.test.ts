import { describe, expect, it } from 'vitest';
import { calculateNutrition } from './nutritionCalculator';

describe('calculateNutrition', () => {
  it('calculates Mifflin–St Jeor and macros', () => {
    const result = calculateNutrition({ age: 30, calculationSex: 'male', heightCm: 180, weightKg: 80, activityLevel: 'medium', goal: 'balance' });
    expect(result.bmr).toBe(1780);
    expect(result.tdee).toBe(2759);
    expect(result.proteinG).toBeCloseTo(172.44, 2);
    expect(result.fatG).toBeCloseTo(91.97, 2);
    expect(result.carbsG).toBeCloseTo(310.39, 2);
  });
  it('uses a 10% adult loss adjustment', () => {
    const result = calculateNutrition({ age: 28, calculationSex: 'female', heightCm: 168, weightKg: 65, activityLevel: 'light', goal: 'loss' });
    expect(result.calories).toBeCloseTo(result.tdee * 0.9, 6);
  });
  it('limits under-18 adjustment to 5%', () => {
    const result = calculateNutrition({ age: 16, calculationSex: 'male', heightCm: 175, weightKg: 70, activityLevel: 'medium', goal: 'gain' });
    expect(result.calories).toBeCloseTo(result.tdee * 1.05, 6);
  });
  it('applies a protective minimum', () => {
    const result = calculateNutrition({ age: 80, calculationSex: 'female', heightCm: 120, weightKg: 35, activityLevel: 'minimal', goal: 'loss' });
    expect(result.calories).toBe(1200);
  });
});
