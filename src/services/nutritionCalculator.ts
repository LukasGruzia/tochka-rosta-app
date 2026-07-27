import type { NutritionResult, ProfileDraft } from '@/types/domain';

export const activityFactors = { minimal: 1.2, light: 1.375, medium: 1.55, high: 1.725, veryHigh: 1.9 } as const;

export function calculateNutrition(input: Pick<ProfileDraft, 'age' | 'calculationSex' | 'heightCm' | 'weightKg' | 'activityLevel' | 'goal'>): NutritionResult {
  const bmr = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + (input.calculationSex === 'male' ? 5 : -161);
  const activityFactor = activityFactors[input.activityLevel];
  const tdee = bmr * activityFactor;
  const adultFactor = input.goal === 'loss' ? 0.9 : input.goal === 'gain' ? 1.1 : 1;
  const teenFactor = input.goal === 'loss' ? 0.95 : input.goal === 'gain' ? 1.05 : 1;
  const minimumCalories = input.calculationSex === 'male' ? 1500 : 1200;
  const calories = Math.max(tdee * (input.age < 18 ? teenFactor : adultFactor), minimumCalories);
  return {
    bmr, tdee, calories,
    proteinG: (calories * 0.25) / 4,
    fatG: (calories * 0.3) / 9,
    carbsG: (calories * 0.45) / 4,
    goal: input.goal, activityFactor,
  };
}

export function roundNutrition(result: NutritionResult) {
  return { bmr: Math.round(result.bmr), tdee: Math.round(result.tdee), calories: Math.round(result.calories), proteinG: Math.round(result.proteinG), fatG: Math.round(result.fatG), carbsG: Math.round(result.carbsG) };
}
