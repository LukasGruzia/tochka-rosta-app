import { calculateForWeight, normalizeTo100g, validateProductDraft } from '@/services/foodMath';
import type { DataStatus, ExternalFoodPreview, FoodSourceType, Goal, MealType, Product, ProductDraft } from '@/types/domain';
import { getDatabase } from '../database';
import { profileQuery } from '@/performance/queryProfiler';
import { normalizeSearchText, searchProducts } from '@/services/productSearch';
import { clearRecommendationCache } from '@/services/recommendationCache';

interface ProductRow {
  id: number;
  slug: string;
  name: string;
  original_name: string | null;
  description: string;
  ingredients: string | null;
  note: string | null;
  serving_size_g: number;
  package_size_g: number | null;
  calories: number;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  fat_per_100g: number | null;
  carbs_per_100g: number | null;
  fiber_per_100g: number | null;
  sugar_per_100g: number | null;
  sodium_per_100g: number | null;
  price: number;
  image_key: string;
  image_uri: string | null;
  category: string;
  meal_tags: string;
  goal_tags: string;
  diet_tags: string;
  allergens: string;
  aliases: string;
  canonical_key: string | null;
  brand: string | null;
  preparation_state: string | null;
  source_priority: number;
  is_active: number;
  merged_into_id: number | null;
  review_status: 'verified' | 'needs_review';
  barcode: string | null;
  qr_code: string | null;
  is_available: number;
  data_status: DataStatus;
  source_type: FoodSourceType;
  source_id: string | null;
  source_name: string;
  source_version: string | null;
  locale: string;
  is_user_created: number;
  favorite_id: number | null;
  created_at: string | null;
  updated_at: string | null;
}

function parseList<T extends string>(value: string | null): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is T => typeof item === 'string') : [];
  } catch {
    return value.split(',').map((item) => item.trim()).filter(Boolean) as T[];
  }
}

export function mapProductRow(row: ProductRow): Product {
  const caloriesPer100g = row.calories_per_100g ?? (row.serving_size_g > 0 ? row.calories * 100 / row.serving_size_g : row.calories);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    originalName: row.original_name,
    description: row.description,
    ingredients: row.ingredients,
    note: row.note,
    servingSizeG: row.serving_size_g,
    packageSizeG: row.package_size_g,
    calories: row.calories,
    proteinG: row.protein_g,
    fatG: row.fat_g,
    carbsG: row.carbs_g,
    caloriesPer100g,
    proteinPer100g: row.protein_per_100g,
    fatPer100g: row.fat_per_100g,
    carbsPer100g: row.carbs_per_100g,
    fiberPer100g: row.fiber_per_100g,
    sugarPer100g: row.sugar_per_100g,
    sodiumPer100g: row.sodium_per_100g,
    price: row.price,
    imageKey: row.image_key,
    imageUri: row.image_uri,
    category: row.category,
    mealTags: parseList<MealType>(row.meal_tags),
    goalTags: parseList<Goal>(row.goal_tags),
    dietTags: parseList(row.diet_tags),
    allergens: parseList(row.allergens),
    aliases: parseList(row.aliases),
    canonicalKey: row.canonical_key,
    brand: row.brand,
    preparationState: row.preparation_state,
    sourcePriority: row.source_priority,
    isActive: row.is_active === 1,
    mergedIntoId: row.merged_into_id,
    reviewStatus: row.review_status,
    barcode: row.barcode,
    qrCode: row.qr_code,
    isAvailable: row.is_available === 1,
    dataStatus: row.data_status,
    sourceType: row.source_type,
    sourceId: row.source_id,
    sourceName: row.source_name,
    sourceVersion: row.source_version,
    locale: row.locale,
    isUserCreated: row.is_user_created === 1,
    isFavorite: row.favorite_id != null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const productSelect = `SELECT p.*, f.id AS favorite_id FROM products p
  LEFT JOIN favorites f ON f.product_id = p.id`;

export const PRODUCT_PAGE_SIZE = 32;
const MAX_SEARCH_CACHE_ENTRIES = 12;
const searchPageCache = new Map<string, Product[]>();

export function invalidateProductSearchCache() {
  searchPageCache.clear();
  clearRecommendationCache();
}

export interface ProductPageOptions {
  offset?: number;
  limit?: number;
  query?: string;
  category?: string;
  sourceType?: FoodSourceType;
  favoritesOnly?: boolean;
  userCreatedOnly?: boolean;
  includeUnavailable?: boolean;
}

function buildProductWhere(options: ProductPageOptions) {
  const conditions = ['p.deleted_at IS NULL', 'p.is_active=1'];
  const params: (string | number)[] = [];
  if (!options.includeUnavailable) conditions.push('p.is_available=1');
  if (options.category && options.category !== 'Все') { conditions.push('p.category=?'); params.push(options.category); }
  if (options.sourceType) { conditions.push('p.source_type=?'); params.push(options.sourceType); }
  if (options.favoritesOnly) conditions.push('f.id IS NOT NULL');
  if (options.userCreatedOnly) conditions.push('p.is_user_created=1');
  const normalized = normalizeSearchText(options.query ?? '');
  if (normalized) {
    const pattern = `%${normalized}%`;
    conditions.push('(p.normalized_name LIKE ? OR p.normalized_name LIKE ? OR p.name LIKE ? COLLATE NOCASE OR COALESCE(p.original_name,\'\') LIKE ? COLLATE NOCASE OR COALESCE(p.aliases,\'\') LIKE ? COLLATE NOCASE)');
    params.push(`${normalized}%`, pattern, pattern, pattern, pattern);
  }
  return { where: conditions.join(' AND '), params, normalized };
}

export async function loadProductsPage(options: ProductPageOptions = {}) {
  const db = await getDatabase();
  const limit = Math.max(1, Math.min(options.limit ?? PRODUCT_PAGE_SIZE, 100));
  const offset = Math.max(0, options.offset ?? 0);
  const { where, params, normalized } = buildProductWhere(options);
  const order = normalized
    ? `CASE WHEN p.normalized_name=? THEN 0 WHEN p.normalized_name LIKE ? THEN 1 ELSE 2 END, p.is_user_created DESC, p.name COLLATE NOCASE`
    : 'p.is_user_created DESC, p.name COLLATE NOCASE';
  const orderParams = normalized ? [normalized, `${normalized}%`] : [];
  const cacheKey = normalized && offset === 0
    ? JSON.stringify({ ...options, query: normalized, limit, offset })
    : null;
  const cached = cacheKey ? searchPageCache.get(cacheKey) : undefined;
  if (cached) return cached;
  return profileQuery('products:page', async () => {
    const rows = await db.getAllAsync<ProductRow>(`${productSelect} WHERE ${where} ORDER BY ${order} LIMIT ? OFFSET ?`, ...params, ...orderParams, limit, offset);
    let products = rows.map(mapProductRow);
    if (normalized && offset === 0 && products.length === 0) {
      const fallback = buildProductWhere({ ...options, query: undefined });
      const candidates = await db.getAllAsync<ProductRow>(`${productSelect} WHERE ${fallback.where} ORDER BY p.is_user_created DESC, p.name COLLATE NOCASE LIMIT 160`, ...fallback.params);
      products = searchProducts(candidates.map(mapProductRow), normalized).slice(0, limit);
    }
    if (cacheKey) {
      searchPageCache.set(cacheKey, products);
      while (searchPageCache.size > MAX_SEARCH_CACHE_ENTRIES) {
        searchPageCache.delete(searchPageCache.keys().next().value as string);
      }
    }
    return products;
  });
}

export async function countProducts(options: ProductPageOptions = {}) {
  const db = await getDatabase();
  const { where, params } = buildProductWhere(options);
  const row = await profileQuery('products:count', () => db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM products p LEFT JOIN favorites f ON f.product_id=p.id WHERE ${where}`, ...params));
  return row?.count ?? 0;
}

export async function loadProductCategories() {
  const db = await getDatabase();
  const rows = await profileQuery('products:categories', () => db.getAllAsync<{ category: string }>(`SELECT DISTINCT category FROM products WHERE deleted_at IS NULL AND is_active=1 AND is_available=1 AND category<>'' ORDER BY category COLLATE NOCASE LIMIT 40`));
  return rows.map((row) => row.category);
}

export async function loadProducts(options?: { includeUnavailable?: boolean; sourceType?: FoodSourceType }) {
  const db = await getDatabase();
  const conditions = ['p.deleted_at IS NULL', 'p.is_active=1'];
  const params: (string | number)[] = [];
  if (!options?.includeUnavailable) conditions.push('p.is_available = 1');
  if (options?.sourceType) { conditions.push('p.source_type = ?'); params.push(options.sourceType); }
  return profileQuery('products:all', async () => {
    const rows = await db.getAllAsync<ProductRow>(`${productSelect} WHERE ${conditions.join(' AND ')} ORDER BY p.is_user_created DESC, p.name COLLATE NOCASE`, ...params);
    return rows.map(mapProductRow);
  });
}

export async function getProductById(id: number) {
  const db = await getDatabase();
  const row = await profileQuery('products:by_id', () => db.getFirstAsync<ProductRow>(`${productSelect} WHERE p.id = ? AND p.deleted_at IS NULL`, id));
  if (!row) return null;
  if (row.merged_into_id) {
    const primary = await db.getFirstAsync<ProductRow>(`${productSelect} WHERE p.id=? AND p.deleted_at IS NULL`, row.merged_into_id);
    if (primary) return mapProductRow(primary);
  }
  return mapProductRow(row);
}

export async function findProductByCode(code: string) {
  const db = await getDatabase();
  const normalized = code.trim();
  const row = await db.getFirstAsync<ProductRow>(`${productSelect} WHERE p.deleted_at IS NULL AND p.is_active=1 AND (p.qr_code = ? OR p.barcode = ?) LIMIT 1`, normalized, normalized);
  return row ? mapProductRow(row) : null;
}

export async function createCustomProduct(draft: ProductDraft) {
  const errors = validateProductDraft(draft);
  if (errors.length) throw new Error(errors[0]);
  const db = await getDatabase();
  const normalized = normalizeTo100g(draft);
  const servingValues = {
    calories: normalized.calories * draft.servingSizeG / 100,
    proteinG: normalized.proteinG == null ? null : normalized.proteinG * draft.servingSizeG / 100,
    fatG: normalized.fatG == null ? null : normalized.fatG * draft.servingSizeG / 100,
    carbsG: normalized.carbsG == null ? null : normalized.carbsG * draft.servingSizeG / 100,
  };
  const now = new Date().toISOString();
  const slug = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const result = await db.runAsync(`INSERT INTO products (
    slug, name, description, ingredients, serving_size_g, package_size_g, calories, protein_g, fat_g, carbs_g,
    calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, fiber_per_100g, sugar_per_100g,
    sodium_per_100g, price, image_key, image_uri, category, meal_tags, goal_tags, diet_tags, allergens, aliases,
    barcode, qr_code, is_available, data_status, source_type, source_id, source_name, locale, is_user_created,
    basis_type, basis_amount, basis_unit, note, created_at, updated_at, normalized_name
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, '', ?, ?, '[]', '[]', '[]', ?, '[]', ?, ?, 1,
    'custom', 'user_product', ?, 'Пользователь', 'ru', 1, ?, ?, ?, ?, ?, ?, ?)`,
    slug, draft.name.trim(), draft.description?.trim() ?? '', draft.ingredients?.trim() || null,
    draft.servingSizeG, draft.packageSizeG ?? null, servingValues.calories, servingValues.proteinG, servingValues.fatG,
    servingValues.carbsG, normalized.calories, normalized.proteinG, normalized.fatG, normalized.carbsG,
    normalized.fiberG, normalized.sugarG, normalized.sodiumMg, draft.imageUri ?? null, draft.category,
    JSON.stringify(draft.allergens), draft.barcode?.trim() || null, draft.barcode?.trim() || null, slug,
    draft.basisType, draft.basisAmount, draft.basisUnit, draft.note?.trim() || null, now, now, normalizeSearchText(draft.name));
  await db.runAsync('UPDATE products SET canonical_key=?,brand=?,source_priority=100,is_active=1 WHERE id=?', `user:${slug}`, draft.brand?.trim() || null, Number(result.lastInsertRowId));
  invalidateProductSearchCache();
  return getProductById(Number(result.lastInsertRowId));
}

export async function updateCustomProduct(id: number, draft: ProductDraft) {
  const current = await getProductById(id);
  if (!current || current.sourceType !== 'user_product') throw new Error('Можно редактировать только собственные продукты');
  const errors = validateProductDraft(draft);
  if (errors.length) throw new Error(errors[0]);
  const db = await getDatabase();
  const normalized = normalizeTo100g(draft);
  const serving = calculateForWeight({ ...current, caloriesPer100g: normalized.calories, proteinPer100g: normalized.proteinG, fatPer100g: normalized.fatG, carbsPer100g: normalized.carbsG }, draft.servingSizeG);
  await db.runAsync(`UPDATE products SET name=?, description=?, ingredients=?, serving_size_g=?, package_size_g=?, calories=?,
    protein_g=?, fat_g=?, carbs_g=?, calories_per_100g=?, protein_per_100g=?, fat_per_100g=?, carbs_per_100g=?,
    fiber_per_100g=?, sugar_per_100g=?, sodium_per_100g=?, image_uri=?, category=?, allergens=?, barcode=?, qr_code=?,
    basis_type=?, basis_amount=?, basis_unit=?, note=?, updated_at=?, normalized_name=? WHERE id=?`,
    draft.name.trim(), draft.description?.trim() ?? '', draft.ingredients?.trim() || null, draft.servingSizeG,
    draft.packageSizeG ?? null, serving.calories, serving.proteinG, serving.fatG, serving.carbsG, normalized.calories,
    normalized.proteinG, normalized.fatG, normalized.carbsG, normalized.fiberG, normalized.sugarG, normalized.sodiumMg,
    draft.imageUri ?? null, draft.category, JSON.stringify(draft.allergens), draft.barcode?.trim() || null,
    draft.barcode?.trim() || null, draft.basisType, draft.basisAmount, draft.basisUnit, draft.note?.trim() || null,
    new Date().toISOString(), normalizeSearchText(draft.name), id);
  await db.runAsync('UPDATE products SET brand=? WHERE id=?', draft.brand?.trim() || null, id);
  invalidateProductSearchCache();
  return getProductById(id);
}

export async function cloneCustomProduct(id: number) {
  const product = await getProductById(id);
  if (!product || !product.isUserCreated) throw new Error('Продукт не найден');
  return createCustomProduct({
    name: `${product.name} — копия`, category: product.category, description: product.description,
    ingredients: product.ingredients ?? '', basisType: 'per100g', basisAmount: 100, basisUnit: 'g',
    servingSizeG: product.servingSizeG, packageSizeG: product.packageSizeG, calories: product.caloriesPer100g,
    proteinG: product.proteinPer100g, fatG: product.fatPer100g, carbsG: product.carbsPer100g,
    fiberG: product.fiberPer100g, sugarG: product.sugarPer100g, sodiumMg: product.sodiumPer100g,
    allergens: product.allergens, barcode: null, imageUri: product.imageUri,
  });
}

export async function deleteCustomProduct(id: number) {
  const product = await getProductById(id);
  if (!product || !product.isUserCreated) throw new Error('Можно удалить только собственный продукт или рецепт');
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('DELETE FROM favorites WHERE product_id = ?', id);
    await txn.runAsync('UPDATE products SET deleted_at=?, is_available=0, is_active=0, updated_at=? WHERE id=?', new Date().toISOString(), new Date().toISOString(), id);
    if (product.sourceType === 'user_recipe') await txn.runAsync('UPDATE recipes SET deleted_at=?, updated_at=? WHERE product_id=?', new Date().toISOString(), new Date().toISOString(), id);
  });
  invalidateProductSearchCache();
}

export async function toggleFavorite(productId: number) {
  const db = await getDatabase();
  const favorite = await db.getFirstAsync<{ id: number }>('SELECT id FROM favorites WHERE product_id = ?', productId);
  if (favorite) await db.runAsync('DELETE FROM favorites WHERE id = ?', favorite.id);
  else await db.runAsync('INSERT INTO favorites (product_id, created_at) VALUES (?, ?)', productId, new Date().toISOString());
  invalidateProductSearchCache();
  return !favorite;
}

export async function addFavorite(productId: number) {
  const db = await getDatabase();
  await db.runAsync('INSERT OR IGNORE INTO favorites (product_id, created_at) VALUES (?, ?)', productId, new Date().toISOString());
  invalidateProductSearchCache();
}

export async function restoreCustomProduct(id: number) {
  const db = await getDatabase();
  const product = await db.getFirstAsync<{ source_type: FoodSourceType }>('SELECT source_type FROM products WHERE id=? AND is_user_created=1 AND deleted_at IS NOT NULL', id);
  if (!product) throw new Error('Продукт уже недоступен для восстановления');
  const now = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync("UPDATE products SET deleted_at=NULL,is_available=1,is_active=1,sync_status='pending',updated_at=? WHERE id=?", now, id);
    if (product.source_type === 'user_recipe') await txn.runAsync("UPDATE recipes SET deleted_at=NULL,sync_status='pending',updated_at=? WHERE product_id=?", now, id);
  });
  invalidateProductSearchCache();
  return getProductById(id);
}

export async function saveExternalFoodProduct(preview: ExternalFoodPreview, corrections?: { name?: string; servingSizeG?: number; caloriesPer100g?: number | null; proteinPer100g?: number | null; fatPer100g?: number | null; carbsPer100g?: number | null }) {
  const db = await getDatabase();
  const existing = await findProductByCode(preview.barcode);
  if (existing) return existing;
  const caloriesPer100g = corrections?.caloriesPer100g ?? preview.caloriesPer100g;
  if (caloriesPer100g == null) throw new Error('Укажи калорийность перед сохранением');
  const servingSizeG = corrections?.servingSizeG ?? 100;
  const proteinPer100g = corrections?.proteinPer100g ?? preview.proteinPer100g;
  const fatPer100g = corrections?.fatPer100g ?? preview.fatPer100g;
  const carbsPer100g = corrections?.carbsPer100g ?? preview.carbsPer100g;
  const now = new Date().toISOString();
  const slug = `off-${preview.barcode}`;
  const result = await db.runAsync(`INSERT INTO products (
    slug, name, original_name, description, ingredients, serving_size_g, calories, protein_g, fat_g, carbs_g,
    calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, price, image_key, image_uri, category,
    meal_tags, goal_tags, diet_tags, allergens, aliases, barcode, qr_code, is_available, data_status, source_type,
    source_id, source_name, source_version, imported_at, locale, is_user_created, created_at, updated_at,
    normalized_name
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, '', ?, 'По штрихкоду', '[]', '[]', '[]', ?, '[]', ?, ?, 1,
    'community', 'open_food_facts', ?, 'Open Food Facts', 'API v3.6', ?, 'ru', 0, ?, ?, ?)`,
    slug, corrections?.name?.trim() || preview.name, preview.name, preview.brand ?? '', preview.ingredients, servingSizeG,
    caloriesPer100g * servingSizeG / 100, proteinPer100g == null ? null : proteinPer100g * servingSizeG / 100,
    fatPer100g == null ? null : fatPer100g * servingSizeG / 100,
    carbsPer100g == null ? null : carbsPer100g * servingSizeG / 100, caloriesPer100g, proteinPer100g, fatPer100g,
    carbsPer100g, preview.imageUrl, JSON.stringify(preview.allergens), preview.barcode, preview.barcode, preview.barcode,
    now, now, now, normalizeSearchText(corrections?.name?.trim() || preview.name));
  const id = Number(result.lastInsertRowId);
  await db.runAsync('UPDATE products SET canonical_key=?,brand=?,source_priority=70,is_active=1 WHERE id=?', `off:${preview.barcode}`, preview.brand ?? null, id);
  invalidateProductSearchCache();
  await db.runAsync(`INSERT OR IGNORE INTO food_sources (product_id, source_type, source_id, source_name, original_name,
    source_version, source_locale, source_updated_at, imported_at) VALUES (?, 'open_food_facts', ?, 'Open Food Facts', ?,
    'API v3.6', 'multi', ?, ?)`, id, preview.barcode, preview.name, preview.sourceUpdatedAt, now);
  return getProductById(id);
}
