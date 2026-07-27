import type { MealPlan, MealType } from '@/types/domain';
import { getDatabase } from '../database';
import { getProductById } from './productRepository';

export async function saveMealPlan(plan: MealPlan) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('DELETE FROM meal_plan_items WHERE date=?', plan.date);
    for (const item of plan.items) {
      await txn.runAsync(`INSERT INTO meal_plan_items (date, product_id, meal_type, servings, is_added_to_diary, created_at)
        VALUES (?, ?, ?, ?, ?, ?)`, plan.date, item.product.id, item.mealType, item.servings, item.isAddedToDiary ? 1 : 0, now);
    }
  });
}

export async function loadMealPlan(date: string): Promise<MealPlan | null> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: number; product_id: number; meal_type: MealType; servings: number; is_added_to_diary: number }>(
    'SELECT id, product_id, meal_type, servings, is_added_to_diary FROM meal_plan_items WHERE date=? ORDER BY id', date);
  if (!rows.length) return null;
  const items = (await Promise.all(rows.map(async (row) => {
    const product = await getProductById(row.product_id);
    return product ? { id: row.id, date, product, mealType: row.meal_type, servings: row.servings, isAddedToDiary: row.is_added_to_diary === 1 } : null;
  }))).filter((item): item is NonNullable<typeof item> => item != null);
  if (!items.length) return null;
  return {
    date,
    items,
    calories: items.reduce((sum, item) => sum + item.product.calories * item.servings, 0),
    proteinG: items.reduce((sum, item) => sum + (item.product.proteinG ?? 0) * item.servings, 0),
    fatG: items.reduce((sum, item) => sum + (item.product.fatG ?? 0) * item.servings, 0),
    carbsG: items.reduce((sum, item) => sum + (item.product.carbsG ?? 0) * item.servings, 0),
    price: items.reduce((sum, item) => sum + item.product.price * item.servings, 0),
  };
}

export async function markMealPlanItemAdded(id: number) {
  const db = await getDatabase();
  await db.runAsync('UPDATE meal_plan_items SET is_added_to_diary=1 WHERE id=?', id);
}

export async function clearMealPlan(date: string) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM meal_plan_items WHERE date=?', date);
}
