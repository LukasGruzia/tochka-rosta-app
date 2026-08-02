import type { DiarySummary, MealType } from '@/types/domain';

export type NextBestActionKind = 'add-meal' | 'continue-diary' | 'add-water' | 'close-remainder' | 'recommendation' | 'close-day' | 'continue-flow';

export interface SmartStep {
  kind: NextBestActionKind;
  meal: MealType;
  title: string;
  description: string;
}

export interface NextBestActionContext {
  diary: DiarySummary | null;
  hour: number;
  waterTotalMl?: number;
  recommendationAvailable?: boolean;
}

const meals: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

function preferredMeal(hour: number): MealType {
  return hour < 11 ? 'breakfast' : hour < 15 ? 'lunch' : hour < 18 ? 'snack' : 'dinner';
}

function mealTitle(meal: MealType) {
  return ({ breakfast: 'Добавить завтрак', lunch: 'Добавить обед', snack: 'Добавить перекус', dinner: 'Добавить ужин' } as const)[meal];
}

export function getNextBestAction({ diary, hour, waterTotalMl, recommendationAvailable }: NextBestActionContext): SmartStep {
  const preferred = preferredMeal(hour);
  const hasMeal = (meal: MealType) => Boolean(diary?.entries.some((entry) => entry.mealType === meal));
  const meal = !hasMeal(preferred) ? preferred : meals.find((item) => !hasMeal(item)) ?? preferred;
  const entryCount = diary?.entries.length ?? 0;
  const remaining = (diary?.targetCalories ?? 0) - (diary?.consumedCalories ?? 0);

  if (diary?.isCompleted) return { kind: 'continue-flow', meal, title: 'Продолжить Поток', description: 'Сегодняшний день уже закрыт' };
  if (!entryCount) return { kind: 'add-meal', meal, title: mealTitle(meal), description: 'Одна запись запустит сегодняшний баланс' };
  if (remaining <= Math.max(120, (diary?.targetCalories ?? 0) * 0.05)) return { kind: 'close-day', meal, title: 'Закрыть день', description: 'Баланс достаточно близок к ориентиру' };
  if (waterTotalMl === 0 && hour >= 12 && hour < 17) return { kind: 'add-water', meal, title: 'Добавить воду', description: 'Сегодня вода ещё не отмечена' };
  if (hour >= 18 && remaining > 120 && remaining < 1200) return { kind: 'close-remainder', meal, title: 'Закрыть остаток', description: `Подобрать вариант примерно на ${Math.round(remaining)} ккал` };
  if (recommendationAvailable && hour >= 16) return { kind: 'recommendation', meal, title: 'Посмотреть рекомендацию', description: 'Есть подходящий вариант для текущего баланса' };
  return { kind: 'continue-diary', meal, title: mealTitle(meal), description: 'Продолжить сегодняшний дневник' };
}

export function getSmartNextStep(diary: DiarySummary | null, hour: number): SmartStep {
  return getNextBestAction({ diary, hour });
}
