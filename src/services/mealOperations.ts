import type { DiaryEntry, MealTemplateItem, MealType } from '@/types/domain';

export function getDiaryCopyPreview(entries: DiaryEntry[], meal: MealType | null) {
  const selected = meal ? entries.filter((entry) => entry.mealType === meal) : entries;
  return { entries: selected, count: selected.length, calories: Math.round(selected.reduce((sum, entry) => sum + entry.calories, 0)) };
}

export function getMealTemplateCalories(items: MealTemplateItem[]) {
  return Math.round(items.reduce((sum, item) => sum + item.product.caloriesPer100g * item.quantityG / 100, 0));
}
