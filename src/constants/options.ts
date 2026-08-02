import type { ActivityLevel, DietPreference, Goal, Restriction } from '@/types/domain';

export const activityOptions: readonly { value: ActivityLevel; title: string; description: string }[] = [
  { value: 'minimal', title: 'Минимальная активность', description: 'Преимущественно сидячий образ жизни' },
  { value: 'light', title: 'Лёгкая активность', description: 'Прогулки или тренировки 1–2 раза в неделю' },
  { value: 'medium', title: 'Средняя активность', description: 'Тренировки 3–4 раза в неделю' },
  { value: 'high', title: 'Высокая активность', description: 'Интенсивные тренировки 5–6 раз в неделю' },
  { value: 'veryHigh', title: 'Очень высокая активность', description: 'Ежедневные тренировки или физическая работа' },
];
export const goalOptions: readonly { value: Goal; title: string; description: string }[] = [
  { value: 'balance', title: 'Поддерживать форму', description: 'Сохранять комфортный баланс и привычный ритм' },
  { value: 'loss', title: 'Снижать вес постепенно', description: 'Мягко скорректировать ориентир без экстремальных значений' },
  { value: 'gain', title: 'Набирать массу', description: 'Умеренно увеличить дневной ориентир' },
  { value: 'regular', title: 'Питаться более регулярно', description: 'Сфокусироваться на понятном ритме приёмов пищи' },
];
export const dietOptions: readonly { value: DietPreference; title: string }[] = [
  { value: 'all', title: 'Ем всё' }, { value: 'meat', title: 'Больше мяса' },
  { value: 'fish', title: 'Больше рыбы' }, { value: 'vegetarian', title: 'Без мяса' },
  { value: 'plant', title: 'Растительное питание' },
];
export const restrictionOptions: readonly { value: Restriction; title: string }[] = [
  { value: 'lactoseFree', title: 'Без лактозы' }, { value: 'glutenFree', title: 'Без глютена' },
  { value: 'sugarFree', title: 'Без добавленного сахара' }, { value: 'nutFree', title: 'Без орехов' },
];
export const activityLabels = Object.fromEntries(activityOptions.map((item) => [item.value, item.title])) as Record<ActivityLevel, string>;
export const goalLabels = Object.fromEntries(goalOptions.map((item) => [item.value, item.title])) as Record<Goal, string>;
export const dietLabels = Object.fromEntries(dietOptions.map((item) => [item.value, item.title])) as Record<DietPreference, string>;
export const restrictionLabels = Object.fromEntries(restrictionOptions.map((item) => [item.value, item.title])) as Record<Restriction, string>;
export const mealLabels = { breakfast: 'Завтрак', lunch: 'Обед', snack: 'Перекус', dinner: 'Ужин' } as const;
