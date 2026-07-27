import type { ExternalFoodPreview } from '@/types/domain';
import { getDatabase } from '../database';

export async function recordScan(code: string, productId: number | null) {
  const db = await getDatabase();
  await db.runAsync('INSERT INTO scan_history (code, product_id, scanned_at) VALUES (?, ?, ?)', code, productId, new Date().toISOString());
}

export async function getCachedExternalFood(barcode: string) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ payload_json: string; expires_at: string }>(
    `SELECT payload_json, expires_at FROM external_food_cache WHERE barcode=? AND source_type='open_food_facts'`, barcode);
  if (!row || row.expires_at < new Date().toISOString()) return null;
  try { return JSON.parse(row.payload_json) as ExternalFoodPreview; } catch { return null; }
}

export async function cacheExternalFood(preview: ExternalFoodPreview) {
  const db = await getDatabase();
  const cachedAt = new Date();
  const expiresAt = new Date(cachedAt);
  expiresAt.setDate(expiresAt.getDate() + 30);
  await db.runAsync(`INSERT INTO external_food_cache (barcode, source_type, source_id, payload_json, normalized_name,
    calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, cached_at, expires_at)
    VALUES (?, 'open_food_facts', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(barcode, source_type) DO UPDATE SET payload_json=excluded.payload_json, normalized_name=excluded.normalized_name,
      calories_per_100g=excluded.calories_per_100g, protein_per_100g=excluded.protein_per_100g,
      fat_per_100g=excluded.fat_per_100g, carbs_per_100g=excluded.carbs_per_100g, cached_at=excluded.cached_at,
      expires_at=excluded.expires_at`, preview.barcode, preview.barcode, JSON.stringify(preview), preview.name,
      preview.caloriesPer100g, preview.proteinPer100g, preview.fatPer100g, preview.carbsPer100g,
      cachedAt.toISOString(), expiresAt.toISOString());
}
