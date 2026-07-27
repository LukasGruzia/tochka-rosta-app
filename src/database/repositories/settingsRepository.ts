import { getDatabase } from '../database';

export async function getSetting(key: string) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(`INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`, key, value, now);
}

export async function resetApplicationData() {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM diary_entries;
    DELETE FROM diary_days;
    DELETE FROM favorites;
    DELETE FROM flow_history;
    DELETE FROM meal_plan_items;
    DELETE FROM scan_history;
    DELETE FROM recipe_ingredients;
    DELETE FROM recipes;
    DELETE FROM food_sources WHERE product_id IN (SELECT id FROM products WHERE is_user_created = 1 OR source_type = 'open_food_facts');
    DELETE FROM products WHERE is_user_created = 1 OR source_type = 'open_food_facts';
    DELETE FROM external_food_cache;
    DELETE FROM nutrition_targets;
    DELETE FROM user_restrictions;
    DELETE FROM user_profile;
    DELETE FROM app_settings;
    UPDATE flow_state SET current_streak = 0, longest_streak = 0, last_completed_date = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = 1;
  `);
}
