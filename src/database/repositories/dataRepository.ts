import { getDatabase } from '../database';

const restoreOrder = ['app_settings', 'user_profile', 'user_restrictions', 'nutrition_targets', 'products', 'diary_days', 'diary_entries', 'favorites', 'flow_state', 'flow_history', 'meal_plan_items', 'scan_history', 'recipes', 'recipe_ingredients', 'food_sources', 'external_food_cache', 'weight_logs', 'water_entries', 'meal_templates', 'meal_template_items', 'search_history'] as const;
const deleteOrder = [...restoreOrder].reverse();
type TableName = typeof restoreOrder[number];
type Row = Record<string, string | number | null>;
export interface LocalBackup { format: 'tochka-rosta-local-backup'; version: 1; createdAt: string; tables: Partial<Record<TableName, Row[]>>; }

export async function getLocalDataSummary() {
  const db = await getDatabase();
  const [products, custom, diary, recipes, scans, sources] = await Promise.all([
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM products WHERE deleted_at IS NULL'),
    db.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM products WHERE is_user_created=1 AND deleted_at IS NULL"),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM diary_entries'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM recipes WHERE deleted_at IS NULL'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM scan_history'),
    db.getAllAsync<{ source_type: string; count: number }>('SELECT source_type, COUNT(*) AS count FROM products WHERE deleted_at IS NULL GROUP BY source_type ORDER BY source_type'),
  ]);
  return { products: products?.count ?? 0, custom: custom?.count ?? 0, diary: diary?.count ?? 0, recipes: recipes?.count ?? 0, scans: scans?.count ?? 0, sources };
}

export async function createLocalBackup(): Promise<LocalBackup> {
  const db = await getDatabase(); const tables: LocalBackup['tables'] = {};
  for (const table of restoreOrder) tables[table] = await db.getAllAsync<Row>(`SELECT * FROM "${table}"`);
  return { format: 'tochka-rosta-local-backup', version: 1, createdAt: new Date().toISOString(), tables };
}

export async function restoreLocalBackup(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Файл резервной копии повреждён');
  const backup = value as Partial<LocalBackup>;
  if (backup.format !== 'tochka-rosta-local-backup' || backup.version !== 1 || !backup.tables) throw new Error('Это не резервная копия «Точки Роста»');
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const table of deleteOrder) await txn.runAsync(`DELETE FROM "${table}"`);
    for (const table of restoreOrder) {
      const rows = backup.tables?.[table] ?? [];
      if (!Array.isArray(rows)) throw new Error(`Некорректная таблица ${table}`);
      for (const row of rows) {
        if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error(`Некорректная строка ${table}`);
        const columns = Object.keys(row).filter((column) => /^[a-z_]+$/.test(column));
        if (!columns.length) continue;
        const placeholders = columns.map(() => '?').join(', ');
        await txn.runAsync(`INSERT INTO "${table}" (${columns.map((column) => `"${column}"`).join(', ')}) VALUES (${placeholders})`, ...columns.map((column) => row[column]));
      }
    }
  });
}
