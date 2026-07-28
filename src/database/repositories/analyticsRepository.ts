import type { HistoryAnalytics, MealType } from '@/types/domain';
import { getLocalDateKey } from '@/utils/date';
import { getDatabase } from '../database';

function startDate(periodDays: number) {
  const date = new Date();
  date.setDate(date.getDate() - periodDays + 1);
  return getLocalDateKey(date);
}

export async function loadHistoryAnalytics(periodDays: 7 | 30 | 90 | 365): Promise<HistoryAnalytics> {
  const db = await getDatabase();
  const from = startDate(periodDays);
  const days = await db.getAllAsync<{ date: string; consumed_calories: number; consumed_protein_g: number; consumed_fat_g: number; consumed_carbs_g: number; target_calories: number; is_completed: number }>(
    'SELECT date, consumed_calories, consumed_protein_g, consumed_fat_g, consumed_carbs_g, target_calories, is_completed FROM diary_days WHERE date>=? ORDER BY date', from);
  const summary = await db.getFirstAsync<{ entry_count: number; favorite_name: string | null }>(`SELECT COUNT(*) AS entry_count,
    (SELECT product_name_snapshot FROM diary_entries e2 JOIN diary_days d2 ON d2.id=e2.diary_day_id WHERE d2.date>=?
      GROUP BY product_name_snapshot ORDER BY COUNT(*) DESC, product_name_snapshot LIMIT 1) AS favorite_name
    FROM diary_entries e JOIN diary_days d ON d.id=e.diary_day_id WHERE d.date>=?`, from, from);
  const mealRows = await db.getAllAsync<{ meal_type: MealType; count: number }>(`SELECT e.meal_type, COUNT(*) AS count
    FROM diary_entries e JOIN diary_days d ON d.id=e.diary_day_id WHERE d.date>=? GROUP BY e.meal_type`, from);
  const flow = await db.getFirstAsync<{ longest_streak: number }>('SELECT longest_streak FROM flow_state WHERE id=1');
  const daysWithEntries = days.filter((day) => day.consumed_calories > 0);
  const mealDistribution: Record<MealType, number> = { breakfast: 0, lunch: 0, snack: 0, dinner: 0 };
  mealRows.forEach((row) => { mealDistribution[row.meal_type] = row.count; });
  return {
    periodDays,
    averageCalories: daysWithEntries.length ? daysWithEntries.reduce((sum, day) => sum + day.consumed_calories, 0) / daysWithEntries.length : 0,
    averageProteinG: daysWithEntries.length ? daysWithEntries.reduce((sum, day) => sum + day.consumed_protein_g, 0) / daysWithEntries.length : 0,
    averageFatG: daysWithEntries.length ? daysWithEntries.reduce((sum, day) => sum + day.consumed_fat_g, 0) / daysWithEntries.length : 0,
    averageCarbsG: daysWithEntries.length ? daysWithEntries.reduce((sum, day) => sum + day.consumed_carbs_g, 0) / daysWithEntries.length : 0,
    averageTargetAccuracy: daysWithEntries.length ? daysWithEntries.reduce((sum, day) => sum + Math.max(0, 100 - Math.abs(day.consumed_calories - day.target_calories) / Math.max(1, day.target_calories) * 100), 0) / daysWithEntries.length : 0,
    completedDays: days.filter((day) => day.is_completed === 1).length,
    longestStreak: flow?.longest_streak ?? 0,
    entryCount: summary?.entry_count ?? 0,
    mostFrequentProduct: summary?.favorite_name ?? null,
    caloriesByDay: days.map((day) => ({ date: day.date, calories: day.consumed_calories, completed: day.is_completed === 1 })),
    mealDistribution,
  };
}

export async function loadProfileOverview() {
  const db = await getDatabase();
  const [diary, weight] = await Promise.all([
    db.getFirstAsync<{ tracked_days: number; entry_count: number }>('SELECT COUNT(DISTINCT diary_day_id) AS tracked_days, COUNT(*) AS entry_count FROM diary_entries'),
    db.getFirstAsync<{ current_weight: number | null }>('SELECT weight_kg AS current_weight FROM weight_logs ORDER BY date DESC LIMIT 1'),
  ]);
  return { trackedDays: diary?.tracked_days ?? 0, entryCount: diary?.entry_count ?? 0, currentWeight: weight?.current_weight ?? null };
}
