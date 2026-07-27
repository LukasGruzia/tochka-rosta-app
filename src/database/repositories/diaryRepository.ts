import { calculateForWeight } from '@/services/foodMath';
import type { DiaryEntry, DiaryEntryInput, DiarySummary, FoodSourceType, MealType, NutritionResult } from '@/types/domain';
import { getLocalDateKey } from '@/utils/date';
import { getDatabase } from '../database';

interface DayRow {
  id: number;
  date: string;
  target_calories: number;
  target_protein_g: number;
  target_fat_g: number;
  target_carbs_g: number;
  consumed_calories: number;
  consumed_protein_g: number;
  consumed_fat_g: number;
  consumed_carbs_g: number;
  is_completed: number;
  completed_at: string | null;
}

interface EntryRow {
  id: number;
  product_id: number | null;
  product_name_snapshot: string | null;
  product_name: string | null;
  image_key: string | null;
  image_uri: string | null;
  source_type: FoodSourceType;
  meal_type: MealType;
  servings: number;
  serving_size_g: number;
  quantity_g: number;
  calories: number;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  created_at: string;
}

const entrySelect = `SELECT e.*, p.name AS product_name, p.image_key, p.image_uri FROM diary_entries e
  LEFT JOIN products p ON p.id = e.product_id`;

function mapEntry(row: EntryRow): DiaryEntry {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name_snapshot ?? row.product_name ?? 'Удалённый продукт',
    imageKey: row.image_key ?? '',
    imageUri: row.image_uri,
    sourceType: row.source_type,
    mealType: row.meal_type,
    servings: row.servings,
    servingSizeG: row.serving_size_g,
    quantityG: row.quantity_g,
    calories: row.calories,
    proteinG: row.protein_g,
    fatG: row.fat_g,
    carbsG: row.carbs_g,
    createdAt: row.created_at,
  };
}

export async function ensureDiaryDay(date: string, target: NutritionResult, updateExisting = false) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(`INSERT INTO diary_days (
    date, target_calories, target_protein_g, target_fat_g, target_carbs_g, consumed_calories,
    consumed_protein_g, consumed_fat_g, consumed_carbs_g, is_completed, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, 0, ?, ?) ON CONFLICT(date) DO NOTHING`,
  date, target.calories, target.proteinG, target.fatG, target.carbsG, now, now);
  if (updateExisting) {
    await db.runAsync(`UPDATE diary_days SET target_calories=?, target_protein_g=?, target_fat_g=?, target_carbs_g=?, updated_at=?
      WHERE date=? AND is_completed=0`, target.calories, target.proteinG, target.fatG, target.carbsG, now, date);
  }
}

export async function ensureTodayDiary(target: NutritionResult | number) {
  const normalized: NutritionResult = typeof target === 'number'
    ? { bmr: 0, tdee: 0, calories: target, proteinG: 0, fatG: 0, carbsG: 0, goal: 'balance', activityFactor: 1 }
    : target;
  await ensureDiaryDay(getLocalDateKey(), normalized, true);
}

export async function loadDiary(date: string): Promise<DiarySummary | null> {
  const db = await getDatabase();
  const day = await db.getFirstAsync<DayRow>('SELECT * FROM diary_days WHERE date = ?', date);
  if (!day) return null;
  const rows = await db.getAllAsync<EntryRow>(`${entrySelect} WHERE e.diary_day_id = ? ORDER BY e.created_at DESC, e.id DESC`, day.id);
  return {
    dayId: day.id,
    date: day.date,
    targetCalories: day.target_calories,
    targetProteinG: day.target_protein_g,
    targetFatG: day.target_fat_g,
    targetCarbsG: day.target_carbs_g,
    consumedCalories: day.consumed_calories,
    consumedProteinG: day.consumed_protein_g,
    consumedFatG: day.consumed_fat_g,
    consumedCarbsG: day.consumed_carbs_g,
    isCompleted: day.is_completed === 1,
    completedAt: day.completed_at,
    entries: rows.map(mapEntry),
  };
}

export function loadTodayDiary() {
  return loadDiary(getLocalDateKey());
}

export async function recalculateDiaryDay(dayId: number) {
  const db = await getDatabase();
  await db.runAsync(`UPDATE diary_days SET
    consumed_calories=COALESCE((SELECT SUM(calories) FROM diary_entries WHERE diary_day_id=?), 0),
    consumed_protein_g=COALESCE((SELECT SUM(protein_g) FROM diary_entries WHERE diary_day_id=?), 0),
    consumed_fat_g=COALESCE((SELECT SUM(fat_g) FROM diary_entries WHERE diary_day_id=?), 0),
    consumed_carbs_g=COALESCE((SELECT SUM(carbs_g) FROM diary_entries WHERE diary_day_id=?), 0),
    updated_at=? WHERE id=?`, dayId, dayId, dayId, dayId, new Date().toISOString(), dayId);
}

export async function addDiaryEntry(input: DiaryEntryInput, target?: NutritionResult) {
  const db = await getDatabase();
  if (target) await ensureDiaryDay(input.date, target);
  const day = await db.getFirstAsync<DayRow>('SELECT * FROM diary_days WHERE date = ?', input.date);
  if (!day) throw new Error('Дневной план ещё не создан');
  if (day.is_completed) throw new Error('Закрытый день нельзя изменять');
  const servings = Math.min(10, Math.max(0.25, input.servings));
  const quantityG = input.quantityG ?? input.product.servingSizeG * servings;
  if (quantityG <= 0 || quantityG > 10000) throw new Error('Проверь количество продукта');
  const values = calculateForWeight(input.product, quantityG);
  const now = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(`INSERT INTO diary_entries (
      diary_day_id, product_id, product_name_snapshot, meal_type, servings, serving_size_g, quantity_g,
      calories, protein_g, fat_g, carbs_g, source_type, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, day.id, input.product.id, input.product.name,
    input.mealType, servings, input.product.servingSizeG, quantityG, values.calories, values.proteinG, values.fatG,
    values.carbsG, input.product.sourceType, now, now);
    await txn.runAsync(`UPDATE diary_days SET
      consumed_calories=COALESCE((SELECT SUM(calories) FROM diary_entries WHERE diary_day_id=?), 0),
      consumed_protein_g=COALESCE((SELECT SUM(protein_g) FROM diary_entries WHERE diary_day_id=?), 0),
      consumed_fat_g=COALESCE((SELECT SUM(fat_g) FROM diary_entries WHERE diary_day_id=?), 0),
      consumed_carbs_g=COALESCE((SELECT SUM(carbs_g) FROM diary_entries WHERE diary_day_id=?), 0),
      updated_at=? WHERE id=?`, day.id, day.id, day.id, day.id, now, day.id);
  });
}

export async function addProductToToday(product: DiaryEntryInput['product'], mealType: MealType = 'snack') {
  return addDiaryEntry({ date: getLocalDateKey(), product, mealType, servings: 1 });
}

export async function updateDiaryEntry(entryId: number, changes: { mealType: MealType; servings: number; quantityG?: number }) {
  const db = await getDatabase();
  const entry = await db.getFirstAsync<EntryRow & { diary_day_id: number; day_completed: number }>(`SELECT e.*, d.is_completed AS day_completed
    FROM diary_entries e JOIN diary_days d ON d.id=e.diary_day_id WHERE e.id=?`, entryId);
  if (!entry) throw new Error('Запись не найдена');
  if (entry.day_completed) throw new Error('Закрытый день нельзя изменять');
  const servings = Math.min(10, Math.max(0.25, changes.servings));
  const quantityG = changes.quantityG ?? entry.serving_size_g * servings;
  const factor = entry.quantity_g > 0 ? quantityG / entry.quantity_g : 1;
  const scale = (value: number | null) => value == null ? null : value * factor;
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(`UPDATE diary_entries SET meal_type=?, servings=?, quantity_g=?, calories=?, protein_g=?, fat_g=?, carbs_g=?, updated_at=? WHERE id=?`,
      changes.mealType, servings, quantityG, entry.calories * factor, scale(entry.protein_g), scale(entry.fat_g),
      scale(entry.carbs_g), new Date().toISOString(), entryId);
    await txn.runAsync(`UPDATE diary_days SET
      consumed_calories=COALESCE((SELECT SUM(calories) FROM diary_entries WHERE diary_day_id=?), 0),
      consumed_protein_g=COALESCE((SELECT SUM(protein_g) FROM diary_entries WHERE diary_day_id=?), 0),
      consumed_fat_g=COALESCE((SELECT SUM(fat_g) FROM diary_entries WHERE diary_day_id=?), 0),
      consumed_carbs_g=COALESCE((SELECT SUM(carbs_g) FROM diary_entries WHERE diary_day_id=?), 0), updated_at=? WHERE id=?`,
      entry.diary_day_id, entry.diary_day_id, entry.diary_day_id, entry.diary_day_id, new Date().toISOString(), entry.diary_day_id);
  });
}

export async function deleteDiaryEntry(entryId: number) {
  const db = await getDatabase();
  const entry = await db.getFirstAsync<{ diary_day_id: number; is_completed: number }>(`SELECT e.diary_day_id, d.is_completed FROM diary_entries e JOIN diary_days d ON d.id=e.diary_day_id WHERE e.id=?`, entryId);
  if (!entry) return;
  if (entry.is_completed) throw new Error('Закрытый день нельзя изменять');
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('DELETE FROM diary_entries WHERE id=?', entryId);
    await txn.runAsync(`UPDATE diary_days SET
      consumed_calories=COALESCE((SELECT SUM(calories) FROM diary_entries WHERE diary_day_id=?), 0),
      consumed_protein_g=COALESCE((SELECT SUM(protein_g) FROM diary_entries WHERE diary_day_id=?), 0),
      consumed_fat_g=COALESCE((SELECT SUM(fat_g) FROM diary_entries WHERE diary_day_id=?), 0),
      consumed_carbs_g=COALESCE((SELECT SUM(carbs_g) FROM diary_entries WHERE diary_day_id=?), 0), updated_at=? WHERE id=?`,
      entry.diary_day_id, entry.diary_day_id, entry.diary_day_id, entry.diary_day_id, new Date().toISOString(), entry.diary_day_id);
  });
}

export async function markDiaryDayCompleted(date: string) {
  const db = await getDatabase();
  const day = await db.getFirstAsync<DayRow>('SELECT * FROM diary_days WHERE date=?', date);
  if (!day) throw new Error('День не найден');
  if (date > getLocalDateKey()) throw new Error('Будущий день закрыть нельзя');
  if (day.is_completed) throw new Error('Этот день уже закрыт');
  const count = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM diary_entries WHERE diary_day_id=?', day.id);
  if (!count?.count) throw new Error('Добавь хотя бы одно блюдо перед закрытием дня');
  const completedAt = new Date().toISOString();
  await db.runAsync('UPDATE diary_days SET is_completed=1, completed_at=?, updated_at=? WHERE id=?', completedAt, completedAt, day.id);
  return { ...day, is_completed: 1, completed_at: completedAt };
}

export async function clearDiary() {
  const db = await getDatabase();
  await db.execAsync('DELETE FROM diary_entries; DELETE FROM diary_days;');
}
