import type { HistoryAnalytics, MealType } from '@/types/domain';
import { getLocalDateKey } from '@/utils/date';
import { getDatabase } from '../database';
import { calculateHistoryAverages, type AnalyticsDay } from '@/services/historyAnalytics';
import { profileQuery } from '@/performance/queryProfiler';

function startDate(periodDays: number) {
  const date = new Date();
  date.setDate(date.getDate() - periodDays + 1);
  return getLocalDateKey(date);
}

export async function loadHistoryAnalytics(periodDays: 7 | 30 | 90 | 365): Promise<HistoryAnalytics> {
  const db = await getDatabase();
  const from = startDate(periodDays);
  const [days, summary, mealRows, flow] = await profileQuery('analytics:period', () => Promise.all([
    db.getAllAsync<AnalyticsDay & { date: string }>(
      'SELECT date, consumed_calories, consumed_protein_g, consumed_fat_g, consumed_carbs_g, target_calories, is_completed FROM diary_days WHERE date>=? ORDER BY date', from),
    db.getFirstAsync<{ entry_count: number; favorite_name: string | null }>(`SELECT COUNT(*) AS entry_count,
      (SELECT product_name_snapshot FROM diary_entries e2 JOIN diary_days d2 ON d2.id=e2.diary_day_id WHERE d2.date>=?
        GROUP BY product_name_snapshot ORDER BY COUNT(*) DESC, product_name_snapshot LIMIT 1) AS favorite_name
      FROM diary_entries e JOIN diary_days d ON d.id=e.diary_day_id WHERE d.date>=?`, from, from),
    db.getAllAsync<{ meal_type: MealType; count: number }>(`SELECT e.meal_type, COUNT(*) AS count
      FROM diary_entries e JOIN diary_days d ON d.id=e.diary_day_id WHERE d.date>=? GROUP BY e.meal_type`, from),
    db.getFirstAsync<{ longest_streak: number }>('SELECT longest_streak FROM flow_state WHERE id=1'),
  ]));
  const chartRows = periodDays <= 30
    ? days.map((day) => ({ date: day.date, calories: day.consumed_calories, completed: day.is_completed === 1 }))
    : await profileQuery('analytics:chart_aggregates', () => db.getAllAsync<{ date: string; calories: number; completed: number }>(
      periodDays <= 90
        ? `SELECT strftime('%Y-W%W',date) AS date, AVG(consumed_calories) AS calories, MAX(is_completed) AS completed
           FROM diary_days WHERE date>=? GROUP BY strftime('%Y-W%W',date) ORDER BY date`
        : `SELECT substr(date,1,7) AS date, AVG(consumed_calories) AS calories, MAX(is_completed) AS completed
           FROM diary_days WHERE date>=? GROUP BY substr(date,1,7) ORDER BY date`,
      from,
    )).then((rows) => rows.map((row) => ({ ...row, completed: row.completed === 1 })));
  const averages = calculateHistoryAverages(days);
  const mealDistribution: Record<MealType, number> = { breakfast: 0, lunch: 0, snack: 0, dinner: 0 };
  mealRows.forEach((row) => { mealDistribution[row.meal_type] = row.count; });
  return {
    periodDays,
    ...averages,
    longestStreak: flow?.longest_streak ?? 0,
    entryCount: summary?.entry_count ?? 0,
    mostFrequentProduct: summary?.favorite_name ?? null,
    caloriesByDay: chartRows,
    mealDistribution,
  };
}

export async function loadProfileOverview() {
  const db = await getDatabase();
  const [diary, weight] = await profileQuery('profile:overview', () => Promise.all([
    db.getFirstAsync<{ tracked_days: number; entry_count: number }>('SELECT COUNT(DISTINCT diary_day_id) AS tracked_days, COUNT(*) AS entry_count FROM diary_entries'),
    db.getFirstAsync<{ current_weight: number | null }>('SELECT weight_kg AS current_weight FROM weight_logs ORDER BY date DESC LIMIT 1'),
  ]));
  return { trackedDays: diary?.tracked_days ?? 0, entryCount: diary?.entry_count ?? 0, currentWeight: weight?.current_weight ?? null };
}
