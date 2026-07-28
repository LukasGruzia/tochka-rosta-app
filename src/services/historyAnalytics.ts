export interface AnalyticsDay {
  consumed_calories: number; consumed_protein_g: number; consumed_fat_g: number; consumed_carbs_g: number; target_calories: number; is_completed: number;
}

export function calculateHistoryAverages(days: AnalyticsDay[]) {
  const tracked = days.filter((day) => day.consumed_calories > 0);
  const average = (select: (day: AnalyticsDay) => number) => tracked.length ? tracked.reduce((sum, day) => sum + select(day), 0) / tracked.length : 0;
  return {
    averageCalories: average((day) => day.consumed_calories), averageProteinG: average((day) => day.consumed_protein_g), averageFatG: average((day) => day.consumed_fat_g), averageCarbsG: average((day) => day.consumed_carbs_g),
    averageTargetAccuracy: average((day) => Math.max(0, 100 - Math.abs(day.consumed_calories - day.target_calories) / Math.max(1, day.target_calories) * 100)), completedDays: days.filter((day) => day.is_completed === 1).length,
  };
}
