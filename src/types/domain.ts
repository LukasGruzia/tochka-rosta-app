export type CalculationSex = 'female' | 'male';
export type ActivityLevel = 'minimal' | 'light' | 'medium' | 'high' | 'veryHigh';
export type Goal = 'loss' | 'balance' | 'gain';
export type DietPreference = 'all' | 'meat' | 'fish' | 'vegetarian';
export type Restriction = 'lactoseFree' | 'glutenFree' | 'sugarFree' | 'nutFree';
export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';
export type DataStatus = 'verified' | 'imported' | 'community' | 'custom' | 'demo';
export type FoodSourceType = 'tochka_rosta' | 'usda' | 'open_food_facts' | 'user_product' | 'user_recipe';
export type NutritionBasis = 'per100g' | 'serving' | 'package';
export type BasisUnit = 'g' | 'ml' | 'piece' | 'serving';
export type ThemeMode = 'system' | 'dark' | 'light';
export type SyncStatus = 'local' | 'pending' | 'synced' | 'conflict';

export interface ProfileDraft {
  name: string;
  age: number;
  calculationSex: CalculationSex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  dietPreference: DietPreference;
  restrictions: Restriction[];
  avatarUri?: string | null;
  waterGoalMl?: number;
}

export interface NutritionResult {
  bmr: number;
  tdee: number;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  goal: Goal;
  activityFactor: number;
}

export interface SavedProfile extends ProfileDraft {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface WeightLog { id: number; date: string; weightKg: number; note: string; createdAt: string; updatedAt: string; }
export interface WeightProgress { entries: WeightLog[]; initialWeight: number | null; currentWeight: number | null; changeKg: number; minWeight: number | null; maxWeight: number | null; }
export interface WaterEntry { id: number; date: string; amountMl: number; createdAt: string; }
export interface WaterSummary { date: string; totalMl: number; goalMl: number; entries: WaterEntry[]; }
export interface MealTemplateItem { id?: number; product: Product; mealType: MealType; servings: number; quantityG: number; }
export interface MealTemplate { id: number; name: string; defaultMealType: MealType; items: MealTemplateItem[]; createdAt: string; updatedAt: string; }
export interface SearchHistoryItem { id: number; query: string; useCount: number; lastUsedAt: string; }

export interface Product {
  id: number;
  slug: string;
  name: string;
  originalName: string | null;
  description: string;
  ingredients: string | null;
  note?: string | null;
  servingSizeG: number;
  packageSizeG: number | null;
  calories: number;
  proteinG: number | null;
  fatG: number | null;
  carbsG: number | null;
  caloriesPer100g: number;
  proteinPer100g: number | null;
  fatPer100g: number | null;
  carbsPer100g: number | null;
  fiberPer100g: number | null;
  sugarPer100g: number | null;
  sodiumPer100g: number | null;
  price: number;
  imageKey: string;
  imageUri: string | null;
  category: string;
  mealTags: MealType[];
  goalTags: Goal[];
  dietTags: string[];
  allergens: string[];
  aliases: string[];
  barcode: string | null;
  qrCode: string | null;
  isAvailable: boolean;
  dataStatus: DataStatus;
  sourceType: FoodSourceType;
  sourceId: string | null;
  sourceName: string;
  sourceVersion: string | null;
  locale: string;
  isUserCreated: boolean;
  isFavorite: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProductDraft {
  id?: number;
  name: string;
  brand?: string;
  category: string;
  description?: string;
  ingredients?: string;
  note?: string;
  basisType: NutritionBasis;
  basisAmount: number;
  basisUnit: BasisUnit;
  servingSizeG: number;
  packageSizeG?: number | null;
  calories: number;
  proteinG: number | null;
  fatG: number | null;
  carbsG: number | null;
  fiberG?: number | null;
  sugarG?: number | null;
  sodiumMg?: number | null;
  allergens: string[];
  barcode?: string | null;
  imageUri?: string | null;
}

export interface DiaryEntry {
  id: number;
  productId: number | null;
  productName: string;
  imageKey: string;
  imageUri: string | null;
  sourceType: FoodSourceType;
  mealType: MealType;
  servings: number;
  servingSizeG: number;
  quantityG: number;
  calories: number;
  proteinG: number | null;
  fatG: number | null;
  carbsG: number | null;
  createdAt: string;
}

export interface DiarySummary {
  dayId: number;
  date: string;
  targetCalories: number;
  targetProteinG: number;
  targetFatG: number;
  targetCarbsG: number;
  consumedCalories: number;
  consumedProteinG: number;
  consumedFatG: number;
  consumedCarbsG: number;
  isCompleted: boolean;
  completedAt: string | null;
  entries: DiaryEntry[];
}

export interface DiaryEntryInput {
  date: string;
  product: Product;
  mealType: MealType;
  servings: number;
  quantityG?: number;
}

export interface FlowState {
  currentStreak: number;
  longestStreak: number;
  completedDays: number;
  completedDates: string[];
  lastCompletedDate: string | null;
}

export interface MealPlanItem {
  id?: number;
  date: string;
  product: Product;
  mealType: MealType;
  servings: number;
  isAddedToDiary: boolean;
}

export interface MealPlan {
  date: string;
  items: MealPlanItem[];
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  price: number;
}

export interface RecipeIngredientDraft {
  product: Product;
  amountG: number;
}

export interface RecipeDraft {
  id?: number;
  name: string;
  description: string;
  category: string;
  imageUri: string | null;
  servings: number;
  finalWeightG: number | null;
  ingredients: RecipeIngredientDraft[];
}

export interface HistoryAnalytics {
  periodDays: 7 | 30 | 90 | 365;
  averageCalories: number;
  averageProteinG: number;
  averageFatG: number;
  averageCarbsG: number;
  averageTargetAccuracy: number;
  completedDays: number;
  longestStreak: number;
  entryCount: number;
  mostFrequentProduct: string | null;
  caloriesByDay: { date: string; calories: number; completed: boolean }[];
  mealDistribution: Record<MealType, number>;
}

export interface ExternalFoodPreview {
  barcode: string;
  name: string;
  brand: string | null;
  quantity: string | null;
  servingSize: string | null;
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  fatPer100g: number | null;
  carbsPer100g: number | null;
  ingredients: string | null;
  allergens: string[];
  imageUrl: string | null;
  countries: string | null;
  sourceUpdatedAt: string | null;
  payload: string;
}

export interface BudgetSettings { perMealBudget: number | null; dailyBudget: number | null; weeklyBudget: number | null; currency: string; includeInRecommendations: boolean; showOnHome: boolean; }
export interface WeeklyPlanSettings { mealsPerDay: 3 | 4 | 5; mode: 'tochka' | 'mixed' | 'home' | 'budget' | 'highProtein' | 'quick'; maxRepeats: number; trainingDays: string[]; awayDays: string[]; quickDays: string[]; }
export interface WeeklyPlanItem { id?: number; uuid: string; date: string; product: Product; mealType: MealType; amountG: number; servings: number; estimatedCost: number; isAddedToDiary: boolean; }
export interface WeeklyPlan { id?: number; uuid: string; weekStartDate: string; targetBudget: number | null; estimatedCost: number; status: 'draft' | 'planned' | 'active' | 'completed'; settings: WeeklyPlanSettings; items: WeeklyPlanItem[]; }
export interface ShoppingListItem { id?: number; uuid: string; name: string; category: string; amount: number; unit: string; estimatedCost: number; sourceType: FoodSourceType | 'manual'; isChecked: boolean; isAtHome: boolean; }
export interface ShoppingList { id?: number; uuid: string; weekStartDate: string; items: ShoppingListItem[]; }
export interface DayBalanceItem { key: string; label: string; status: 'close' | 'enough' | 'supplement' | 'over' | 'noData'; detail: string; }
export interface PersonalInsight { id?: number; uuid: string; type: string; title: string; observation: string; action: string; periodStart: string; periodEnd: string; isHidden: boolean; }
export interface FlowPreferences { weeklyGoalDays: number; pauseTokens: number; totalPauses: number; }
export interface FlowPause { id: number; date: string; reason: string; createdAt: string; }
export type CalendarDayKind = 'completed' | 'filled' | 'missed' | 'future' | 'empty';
export interface CalendarDayStatus { date: string; entryCount: number; isCompleted: boolean; isPaused: boolean; isMilestone: boolean; kind: CalendarDayKind; }
export interface ResearchSession { id: number; uuid: string; startedAt: string; completedAt: string | null; durationSeconds: number | null; survey: Record<string, unknown> | null; }
