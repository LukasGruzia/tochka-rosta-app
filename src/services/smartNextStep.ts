import type { DiarySummary, MealType } from '@/types/domain';

export interface SmartStep { meal: MealType; title: string; description: string; }

export function getSmartNextStep(diary: DiarySummary | null, hour: number): SmartStep {
  const preferred: MealType = hour < 11 ? 'breakfast' : hour < 15 ? 'lunch' : hour < 18 ? 'snack' : 'dinner';
  const hasMeal = (meal: MealType) => Boolean(diary?.entries.some((entry) => entry.mealType === meal));
  const meal = !hasMeal(preferred) ? preferred : (['breakfast', 'lunch', 'snack', 'dinner'] as MealType[]).find((item) => !hasMeal(item)) ?? preferred;
  const titles: Record<MealType, string> = { breakfast: 'Добавить завтрак', lunch: 'Время обеда', snack: 'Лёгкий перекус', dinner: 'Собрать ужин' };
  return { meal, title: titles[meal], description: hasMeal(meal) ? 'Можно дополнить приём пищи' : 'Этот приём пищи пока пуст' };
}
