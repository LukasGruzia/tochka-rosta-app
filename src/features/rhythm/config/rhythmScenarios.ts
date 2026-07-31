import type { RhythmEventType, RhythmMessageCategory } from '../types/rhythm';

export interface RhythmScenario {
  category: RhythmMessageCategory;
  priority: number;
  cooldownMs: number;
  autoDismiss: boolean;
  screen: string;
  primaryAction: string | null;
  secondaryAction: string | null;
  requested: boolean;
}

const initiativeCooldown = 2.5 * 60 * 60 * 1000;

export const rhythmScenarios = {
  APP_OPENED: { category: 'support', priority: 20, cooldownMs: initiativeCooldown, autoDismiss: true, screen: 'home', primaryAction: null, secondaryAction: null, requested: false },
  SCREEN_OPENED: { category: 'support', priority: 10, cooldownMs: initiativeCooldown, autoDismiss: true, screen: 'current', primaryAction: null, secondaryAction: null, requested: false },
  MEAL_ADDED: { category: 'mealAdded', priority: 75, cooldownMs: 0, autoDismiss: true, screen: 'diary', primaryAction: 'Открыть остаток', secondaryAction: null, requested: false },
  MEAL_REMOVED: { category: 'support', priority: 55, cooldownMs: 0, autoDismiss: true, screen: 'diary', primaryAction: 'Вернуть', secondaryAction: null, requested: false },
  MEAL_UPDATED: { category: 'mealAdded', priority: 62, cooldownMs: 0, autoDismiss: true, screen: 'diary', primaryAction: null, secondaryAction: null, requested: false },
  WATER_ADDED: { category: 'support', priority: 35, cooldownMs: initiativeCooldown, autoDismiss: true, screen: 'water', primaryAction: null, secondaryAction: null, requested: false },
  WEIGHT_ADDED: { category: 'support', priority: 40, cooldownMs: initiativeCooldown, autoDismiss: true, screen: 'weight', primaryAction: 'Открыть динамику', secondaryAction: null, requested: false },
  MEAL_PLAN_CREATED: { category: 'planner', priority: 70, cooldownMs: 0, autoDismiss: false, screen: 'planner', primaryAction: 'Открыть план', secondaryAction: 'Позже', requested: true },
  REMAINDER_MATCH_OPENED: { category: 'planner', priority: 68, cooldownMs: 0, autoDismiss: false, screen: 'remainder', primaryAction: 'Показать варианты', secondaryAction: 'Изменить условия', requested: true },
  RECOMMENDATION_ACCEPTED: { category: 'mealAdded', priority: 82, cooldownMs: 0, autoDismiss: true, screen: 'rhythm', primaryAction: 'Открыть дневник', secondaryAction: null, requested: true },
  RECOMMENDATION_REJECTED: { category: 'quiet', priority: 52, cooldownMs: 0, autoDismiss: true, screen: 'rhythm', primaryAction: 'Другой вариант', secondaryAction: 'Скрыть', requested: true },
  RECOMMENDATION_REPLACED: { category: 'planner', priority: 58, cooldownMs: 0, autoDismiss: true, screen: 'rhythm', primaryAction: 'Показать замену', secondaryAction: null, requested: true },
  DAY_READY_TO_CLOSE: { category: 'balance', priority: 65, cooldownMs: initiativeCooldown, autoDismiss: false, screen: 'diary', primaryAction: 'Закрыть день', secondaryAction: 'Проверить дневник', requested: false },
  DAY_COMPLETED: { category: 'flow', priority: 90, cooldownMs: 0, autoDismiss: false, screen: 'flow', primaryAction: 'Открыть Поток', secondaryAction: null, requested: true },
  FLOW_MILESTONE: { category: 'flow', priority: 95, cooldownMs: 0, autoDismiss: false, screen: 'flow', primaryAction: 'Посмотреть путь', secondaryAction: null, requested: true },
  WEEK_COMPLETED: { category: 'flow', priority: 88, cooldownMs: 0, autoDismiss: false, screen: 'flow', primaryAction: 'Итоги недели', secondaryAction: null, requested: true },
  BUDGET_APPROACHING: { category: 'balance', priority: 57, cooldownMs: initiativeCooldown, autoDismiss: true, screen: 'diary', primaryAction: 'Варианты в бюджете', secondaryAction: null, requested: false },
  BUDGET_EXCEEDED: { category: 'support', priority: 60, cooldownMs: initiativeCooldown, autoDismiss: true, screen: 'diary', primaryAction: 'Изменить бюджет', secondaryAction: 'Скрыть', requested: false },
  EMPTY_MEAL_DETECTED: { category: 'emptyMeal', priority: 45, cooldownMs: initiativeCooldown, autoDismiss: true, screen: 'diary', primaryAction: 'Подобрать вариант', secondaryAction: 'Не сейчас', requested: false },
  INSIGHT_CREATED: { category: 'balance', priority: 50, cooldownMs: initiativeCooldown, autoDismiss: true, screen: 'statistics', primaryAction: 'Посмотреть итог', secondaryAction: null, requested: false },
} satisfies Record<RhythmEventType, RhythmScenario>;

export const rhythmScenarioCount = Object.keys(rhythmScenarios).length;
