import type { SQLiteDatabase } from 'expo-sqlite';
import usdaFoods from './data/usda-common-foods.json';
import { normalizeSearchText } from '@/services/productSearch';

interface UsdaSeedFood { fdcId: number; name: string; originalName: string; category: string; caloriesPer100g: number; proteinPer100g: number; fatPer100g: number; carbsPer100g: number; fiberPer100g: number | null; sugarPer100g: number | null; sodiumPer100g: number | null; servingSizeG: number; aliases: string[]; sourceVersion: string; canonicalKey: string; brand: string | null; preparationState: string | null; sourcePriority: number; isActive: boolean; reviewStatus: 'verified' | 'needs_review'; }

const demoProducts = [
  ['khinkali-pp', 'Хинкали ПП', 'Сочное мясо и тонкое тесто', 'Мука, говядина, зелень, специи', 280, 420, 28, 14, 46, 390, 'khinkali', 'Основные блюда', ['lunch', 'dinner'], ['gain'], ['meat'], ['glutenFree'], 'TR-KHINKALI'],
  ['caesar', 'Салат Цезарь', 'Курица, салат и лёгкий соус', 'Курица, салат, сыр, сухарики, соус', 250, 310, 27, 15, 17, 420, 'caesar', 'Салаты', ['lunch', 'dinner'], ['balance', 'loss'], ['meat'], ['lactoseFree', 'glutenFree'], 'TR-CAESAR'],
  ['protein-shake', 'Протеиновый коктейль', 'Белковый напиток с мягким вкусом', 'Молочный белок, банан, какао', 350, 230, 31, 5, 16, 290, 'protein-shake', 'Напитки', ['breakfast', 'snack'], ['gain', 'balance'], [], ['lactoseFree'], 'TR-PROTEIN'],
  ['brownie-sugar-free', 'Брауни без сахара', 'Насыщенный шоколадный десерт', 'Какао, мука, яйцо, подсластитель', 110, 260, 9, 17, 23, 250, 'brownie', 'Десерты', ['snack'], ['balance'], ['vegetarian'], ['glutenFree'], 'TR-BROWNIE'],
  ['syrniki', 'Сырники', 'Нежный творожный завтрак', 'Творог, яйцо, рисовая мука', 220, 360, 24, 14, 35, 340, 'syrniki', 'Завтраки', ['breakfast', 'snack'], ['gain', 'balance'], ['vegetarian'], ['lactoseFree'], 'TR-SYRNIKI'],
  ['chicken-rice-bowl', 'Боул с курицей и рисом', 'Сбалансированный боул с овощами', 'Курица, рис, овощи, соус', 360, 510, 38, 16, 55, 470, 'chicken-rice-bowl', 'Основные блюда', ['lunch', 'dinner'], ['gain', 'balance'], ['meat'], [], 'TR-CHICKEN'],
] as const;

export async function seedDatabase(db: SQLiteDatabase) {
  const statement = await db.prepareAsync(`INSERT OR IGNORE INTO products (
    slug, name, description, ingredients, serving_size_g, calories, protein_g, fat_g, carbs_g, price, image_key,
    category, meal_tags, goal_tags, diet_tags, allergens, qr_code, is_available, data_status, source_type,
    source_id, source_name, locale, is_user_created, calories_per_100g, protein_per_100g, fat_per_100g,
    carbs_per_100g, created_at, updated_at, normalized_name
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'demo', 'tochka_rosta', ?, 'Точка Роста', 'ru', 0,
    ? * 100.0 / ?, ? * 100.0 / ?, ? * 100.0 / ?, ? * 100.0 / ?, ?, ?, ?)`);
  const now = new Date().toISOString();
  try {
    for (const product of demoProducts) {
      const [slug, name, description, ingredients, servingSize, calories, protein, fat, carbs, price, imageKey, category, mealTags, goalTags, dietTags, allergens, qrCode] = product;
      await statement.executeAsync(slug, name, description, ingredients, servingSize, calories, protein, fat, carbs, price,
        imageKey, category, JSON.stringify(mealTags), JSON.stringify(goalTags), JSON.stringify(dietTags),
        JSON.stringify(allergens), qrCode, slug, calories, servingSize, protein, servingSize, fat, servingSize, carbs,
        servingSize, now, now, normalizeSearchText(name));
    }
  } finally {
    await statement.finalizeAsync();
  }
  await db.runAsync(`UPDATE products SET canonical_key='tochka:'||slug,source_priority=90,is_active=1,review_status='verified'
    WHERE source_type='tochka_rosta' AND is_user_created=0`);
  await db.runAsync(`UPDATE products SET aliases='["боул","поке","поке боул"]',normalized_name=? WHERE slug='chicken-rice-bowl'`, normalizeSearchText('Боул с курицей и рисом'));
  const usdaStatement = await db.prepareAsync(`INSERT OR IGNORE INTO products (
    slug, name, original_name, description, serving_size_g, calories, protein_g, fat_g, carbs_g, price, image_key,
    category, meal_tags, goal_tags, diet_tags, allergens, aliases, is_available, data_status, source_type, source_id,
    source_name, source_version, imported_at, locale, is_user_created, basis_type, basis_amount, basis_unit,
    calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, fiber_per_100g, sugar_per_100g,
    sodium_per_100g, created_at, updated_at, normalized_name
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, '', ?, '[]', '[]', '[]', '[]', ?, 1, 'imported', 'usda', ?,
    'USDA FoodData Central', ?, ?, 'ru', 0, 'per100g', 100, 'g', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  try {
    for (const food of usdaFoods as UsdaSeedFood[]) {
      const serving = food.servingSizeG || 100;
      await usdaStatement.executeAsync(`usda-${food.fdcId}`, food.name, food.originalName, 'Справочные данные на 100 г', serving,
        food.caloriesPer100g * serving / 100, food.proteinPer100g * serving / 100, food.fatPer100g * serving / 100,
        food.carbsPer100g * serving / 100, food.category, JSON.stringify(food.aliases), String(food.fdcId),
        food.sourceVersion, now, food.caloriesPer100g, food.proteinPer100g, food.fatPer100g, food.carbsPer100g,
        food.fiberPer100g, food.sugarPer100g, food.sodiumPer100g, now, now, normalizeSearchText(food.name));
    }
  } finally { await usdaStatement.finalizeAsync(); }
  const refreshUsdaStatement = await db.prepareAsync(`UPDATE products SET name=?, original_name=?, category=?, serving_size_g=?,
    calories=?, protein_g=?, fat_g=?, carbs_g=?, calories_per_100g=?, protein_per_100g=?, fat_per_100g=?, carbs_per_100g=?,
    fiber_per_100g=?, sugar_per_100g=?, sodium_per_100g=?, aliases=?, source_version=?, updated_at=?, normalized_name=?,
    canonical_key=?, brand=?, preparation_state=?, source_priority=?, is_active=?, is_available=?, review_status=?, merged_into_id=NULL
    WHERE source_type='usda' AND source_id=?`);
  try {
    for (const food of usdaFoods as UsdaSeedFood[]) {
      const serving = food.servingSizeG || 100;
      const carbs = Math.max(0, food.carbsPer100g);
      await refreshUsdaStatement.executeAsync(food.name,food.originalName,food.category,serving,food.caloriesPer100g*serving/100,
        food.proteinPer100g*serving/100,food.fatPer100g*serving/100,carbs*serving/100,food.caloriesPer100g,
        food.proteinPer100g,food.fatPer100g,carbs,food.fiberPer100g,food.sugarPer100g,food.sodiumPer100g,
        JSON.stringify(food.aliases),food.sourceVersion,now,normalizeSearchText(food.name),food.canonicalKey,food.brand,
        food.preparationState,food.sourcePriority,food.isActive?1:0,food.isActive?1:0,food.reviewStatus,String(food.fdcId));
    }
  } finally { await refreshUsdaStatement.finalizeAsync(); }
  await reconcileCanonicalCatalog(db, now);
  await db.runAsync(`UPDATE products SET
    carbs_per_100g=MAX(0,carbs_per_100g),
    carbs_g=MAX(0,carbs_g),
    updated_at=?
    WHERE source_type='usda' AND (carbs_per_100g<0 OR carbs_g<0)`, now);
  await db.runAsync(`INSERT OR IGNORE INTO food_sources (product_id, source_type, source_id, source_name, original_name,
    source_version, source_locale, imported_at)
    SELECT id, 'usda', source_id, 'USDA FoodData Central', original_name, source_version, 'en-US', ?
    FROM products WHERE source_type='usda'`, now);
  await db.runAsync(`INSERT OR IGNORE INTO flow_state (id, current_streak, longest_streak, updated_at) VALUES (1, 0, 0, ?)`, now);
}

async function reconcileCanonicalCatalog(db: SQLiteDatabase, now: string) {
  const merged = await db.getAllAsync<{ id: number; primary_id: number }>(`SELECT secondary.id, primary_product.id AS primary_id
    FROM products secondary JOIN products primary_product
      ON primary_product.canonical_key=secondary.canonical_key AND primary_product.is_active=1 AND primary_product.deleted_at IS NULL
    WHERE secondary.source_type='usda' AND secondary.is_active=0 AND secondary.review_status='verified'
      AND secondary.deleted_at IS NULL AND secondary.id<>primary_product.id`);
  for (const item of merged) {
    await db.runAsync('INSERT OR IGNORE INTO favorites(product_id,created_at) SELECT ?,created_at FROM favorites WHERE product_id=?', item.primary_id, item.id);
    await db.runAsync('DELETE FROM favorites WHERE product_id=?', item.id);
    for (const table of ['meal_plan_items', 'meal_template_items', 'weekly_plan_items', 'recipe_ingredients', 'scan_history', 'rhythm_feedback']) {
      await db.runAsync(`UPDATE ${table} SET product_id=? WHERE product_id=?`, item.primary_id, item.id);
    }
    await db.runAsync(`INSERT INTO rhythm_preferences(entity_type,entity_id,weight,last_decayed_at,updated_at)
      SELECT 'product',?,weight,last_decayed_at,? FROM rhythm_preferences WHERE entity_type='product' AND entity_id=?
      ON CONFLICT(entity_type,entity_id) DO UPDATE SET weight=rhythm_preferences.weight+excluded.weight,updated_at=excluded.updated_at`,
      String(item.primary_id), now, String(item.id));
    await db.runAsync("DELETE FROM rhythm_preferences WHERE entity_type='product' AND entity_id=?", String(item.id));
    await db.runAsync('UPDATE products SET merged_into_id=?,updated_at=? WHERE id=?', item.primary_id, now, item.id);
  }
  await db.runAsync(`UPDATE catalog_migration_reports SET
    after_count=(SELECT COUNT(*) FROM products WHERE deleted_at IS NULL AND is_active=1),
    technical_names_after=(SELECT COUNT(*) FROM products WHERE deleted_at IS NULL AND is_active=1 AND lower(name) LIKE '%вариант %'),
    merged_count=(SELECT COUNT(*) FROM products WHERE merged_into_id IS NOT NULL),
    needs_review_count=(SELECT COUNT(*) FROM products WHERE review_status='needs_review'),
    updated_at=? WHERE migration_key='catalog-v8'`, now);
}
