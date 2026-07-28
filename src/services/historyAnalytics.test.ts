import { describe, expect, it } from 'vitest';
import { calculateHistoryAverages, type AnalyticsDay } from './historyAnalytics';
const day = (calories: number, target = 2000, completed = 0): AnalyticsDay => ({ consumed_calories: calories, consumed_protein_g: 100, consumed_fat_g: 70, consumed_carbs_g: 220, target_calories: target, is_completed: completed });
describe('profile history statistics', () => {
  it('calculates averages, accuracy and completed days', () => { expect(calculateHistoryAverages([day(1800, 2000, 1), day(2000, 2000, 1)])).toMatchObject({ averageCalories: 1900, averageProteinG: 100, averageTargetAccuracy: 95, completedDays: 2 }); });
  it('returns zeroes for an empty period', () => { expect(calculateHistoryAverages([])).toMatchObject({ averageCalories: 0, averageProteinG: 0, averageTargetAccuracy: 0, completedDays: 0 }); });
});
