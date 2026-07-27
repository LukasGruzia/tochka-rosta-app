export type CalculationSex = 'female' | 'male';
export type ActivityLevel = 'minimal' | 'light' | 'medium' | 'high' | 'veryHigh';
export type Goal = 'loss' | 'balance' | 'gain';
export type DietPreference = 'all' | 'meat' | 'fish' | 'vegetarian';
export type Restriction = 'lactoseFree' | 'glutenFree' | 'sugarFree' | 'nutFree';
export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';
export type DataStatus = 'demo' | 'verified';

export interface ProfileDraft {
  name: string; age: number; calculationSex: CalculationSex; heightCm: number; weightKg: number;
  activityLevel: ActivityLevel; goal: Goal; dietPreference: DietPreference; restrictions: Restriction[];
}
export interface NutritionResult {
  bmr: number; tdee: number; calories: number; proteinG: number; fatG: number; carbsG: number;
  goal: Goal; activityFactor: number;
}
export interface SavedProfile extends ProfileDraft { id: number; createdAt: string; updatedAt: string; }
export interface Product {
  id: number; slug: string; name: string; description: string; servingSizeG: number; calories: number;
  proteinG: number; fatG: number; carbsG: number; price: number; imageKey: string; category: string;
  isAvailable: boolean; dataStatus: DataStatus;
}
export interface DiaryEntry {
  id: number; productId: number; productName: string; mealType: MealType; servings: number;
  calories: number; proteinG: number; fatG: number; carbsG: number;
}
export interface DiarySummary {
  dayId: number; date: string; targetCalories: number; consumedCalories: number;
  isCompleted: boolean; entries: DiaryEntry[];
}
