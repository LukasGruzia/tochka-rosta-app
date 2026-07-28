import type { MealTemplate, MealTemplateItem, MealType } from '@/types/domain';
import { getDatabase } from '../database';
import { getProductById } from './productRepository';

interface TemplateRow {
  id: number;
  name: string;
  default_meal_type: MealType;
  created_at: string;
  updated_at: string;
}

interface TemplateItemRow {
  id: number;
  product_id: number | null;
  meal_type: MealType;
  servings: number;
  quantity_g: number;
}

export async function loadMealTemplates(): Promise<MealTemplate[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TemplateRow>(
    'SELECT * FROM meal_templates ORDER BY updated_at DESC',
  );

  return Promise.all(
    rows.map(async (row) => {
      const items = await db.getAllAsync<TemplateItemRow>(
        'SELECT * FROM meal_template_items WHERE template_id = ? ORDER BY id',
        row.id,
      );
      const mapped: MealTemplateItem[] = [];

      for (const item of items) {
        if (!item.product_id) continue;
        const product = await getProductById(item.product_id);
        if (!product) continue;
        mapped.push({
          id: item.id,
          product,
          mealType: item.meal_type,
          servings: item.servings,
          quantityG: item.quantity_g,
        });
      }

      return {
        id: row.id,
        name: row.name,
        defaultMealType: row.default_meal_type,
        items: mapped,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }),
  );
}

export async function saveMealTemplate(input: {
  id?: number;
  name: string;
  defaultMealType: MealType;
  items: MealTemplateItem[];
}) {
  const name = input.name.replace(/\s+/g, ' ').trim();
  if (name.length < 2) throw new Error('Добавь название набора');
  if (!input.items.length) throw new Error('Добавь продукты');

  const db = await getDatabase();
  const now = new Date().toISOString();
  let id = input.id ?? 0;

  await db.withExclusiveTransactionAsync(async (txn) => {
    if (id) {
      await txn.runAsync(
        'UPDATE meal_templates SET name = ?, default_meal_type = ?, updated_at = ? WHERE id = ?',
        name,
        input.defaultMealType,
        now,
        id,
      );
    } else {
      const result = await txn.runAsync(
        'INSERT INTO meal_templates(name, default_meal_type, created_at, updated_at) VALUES(?, ?, ?, ?)',
        name,
        input.defaultMealType,
        now,
        now,
      );
      id = Number(result.lastInsertRowId);
    }

    await txn.runAsync('DELETE FROM meal_template_items WHERE template_id = ?', id);
    for (const item of input.items) {
      await txn.runAsync(
        'INSERT INTO meal_template_items(template_id, product_id, product_name_snapshot, meal_type, servings, quantity_g, created_at) VALUES(?, ?, ?, ?, ?, ?, ?)',
        id,
        item.product.id,
        item.product.name,
        item.mealType,
        item.servings,
        item.quantityG,
        now,
      );
    }
  });

  return id;
}

export async function deleteMealTemplate(id: number) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM meal_templates WHERE id = ?', id);
}
