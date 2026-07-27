import type { DiaryEntry, DiarySummary, MealType, Product } from '@/types/domain';
import { getLocalDateKey } from '@/utils/date';
import { getDatabase } from '../database';

interface DayRow { id: number; date: string; target_calories: number; consumed_calories: number; is_completed: number; }
interface EntryRow { id: number; product_id: number; product_name: string; meal_type: MealType; servings: number; calories: number; protein_g: number; fat_g: number; carbs_g: number; }

export async function ensureTodayDiary(targetCalories: number) {
  const db = await getDatabase();
  const date = getLocalDateKey();
  const now = new Date().toISOString();
  await db.runAsync(`INSERT INTO diary_days (date, target_calories, consumed_calories, is_completed, created_at, updated_at)
    VALUES (?, ?, 0, 0, ?, ?) ON CONFLICT(date) DO UPDATE SET target_calories = excluded.target_calories, updated_at = excluded.updated_at`,
    date, targetCalories, now, now);
}

export async function loadTodayDiary(): Promise<DiarySummary | null> {
  const db = await getDatabase();
  const day = await db.getFirstAsync<DayRow>('SELECT * FROM diary_days WHERE date = ?', getLocalDateKey());
  if (!day) return null;
  const rows = await db.getAllAsync<EntryRow>(`SELECT e.*, p.name AS product_name FROM diary_entries e
    JOIN products p ON p.id = e.product_id WHERE e.diary_day_id = ? ORDER BY e.id DESC`, day.id);
  const entries: DiaryEntry[] = rows.map((row) => ({
    id: row.id, productId: row.product_id, productName: row.product_name, mealType: row.meal_type,
    servings: row.servings, calories: row.calories, proteinG: row.protein_g, fatG: row.fat_g, carbsG: row.carbs_g,
  }));
  return { dayId: day.id, date: day.date, targetCalories: day.target_calories, consumedCalories: day.consumed_calories, isCompleted: day.is_completed === 1, entries };
}

export async function addProductToToday(product: Product, mealType: MealType = 'snack') {
  const db = await getDatabase();
  const day = await db.getFirstAsync<DayRow>('SELECT * FROM diary_days WHERE date = ?', getLocalDateKey());
  if (!day) throw new Error('Дневной план ещё не создан');
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(`INSERT INTO diary_entries
      (diary_day_id, product_id, meal_type, servings, calories, protein_g, fat_g, carbs_g, created_at)
      VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?)`, day.id, product.id, mealType, product.calories,
      product.proteinG, product.fatG, product.carbsG, new Date().toISOString());
    await txn.runAsync('UPDATE diary_days SET consumed_calories = consumed_calories + ?, updated_at = ? WHERE id = ?', product.calories, new Date().toISOString(), day.id);
  });
}
