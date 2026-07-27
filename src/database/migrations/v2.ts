export const migrationV2 = `
BEGIN;

ALTER TABLE products ADD COLUMN ingredients TEXT;
ALTER TABLE products ADD COLUMN meal_tags TEXT NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN goal_tags TEXT NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN diet_tags TEXT NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN allergens TEXT NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN aliases TEXT NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN qr_code TEXT;
ALTER TABLE products ADD COLUMN barcode TEXT;
ALTER TABLE products ADD COLUMN source_type TEXT NOT NULL DEFAULT 'tochka_rosta';
ALTER TABLE products ADD COLUMN source_id TEXT;
ALTER TABLE products ADD COLUMN source_name TEXT NOT NULL DEFAULT 'Точка Роста';
ALTER TABLE products ADD COLUMN original_name TEXT;
ALTER TABLE products ADD COLUMN source_version TEXT;
ALTER TABLE products ADD COLUMN imported_at TEXT;
ALTER TABLE products ADD COLUMN locale TEXT NOT NULL DEFAULT 'ru';
ALTER TABLE products ADD COLUMN is_user_created INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN basis_type TEXT NOT NULL DEFAULT 'serving';
ALTER TABLE products ADD COLUMN basis_amount REAL NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN basis_unit TEXT NOT NULL DEFAULT 'serving';
ALTER TABLE products ADD COLUMN package_size_g REAL;
ALTER TABLE products ADD COLUMN calories_per_100g REAL;
ALTER TABLE products ADD COLUMN protein_per_100g REAL;
ALTER TABLE products ADD COLUMN fat_per_100g REAL;
ALTER TABLE products ADD COLUMN carbs_per_100g REAL;
ALTER TABLE products ADD COLUMN fiber_per_100g REAL;
ALTER TABLE products ADD COLUMN sugar_per_100g REAL;
ALTER TABLE products ADD COLUMN sodium_per_100g REAL;
ALTER TABLE products ADD COLUMN image_uri TEXT;
ALTER TABLE products ADD COLUMN note TEXT;
ALTER TABLE products ADD COLUMN created_at TEXT;
ALTER TABLE products ADD COLUMN updated_at TEXT;
ALTER TABLE products ADD COLUMN deleted_at TEXT;

UPDATE products SET
  calories_per_100g = CASE WHEN serving_size_g > 0 THEN calories * 100.0 / serving_size_g ELSE calories END,
  protein_per_100g = CASE WHEN serving_size_g > 0 THEN protein_g * 100.0 / serving_size_g ELSE protein_g END,
  fat_per_100g = CASE WHEN serving_size_g > 0 THEN fat_g * 100.0 / serving_size_g ELSE fat_g END,
  carbs_per_100g = CASE WHEN serving_size_g > 0 THEN carbs_g * 100.0 / serving_size_g ELSE carbs_g END,
  meal_tags = CASE category
    WHEN 'Завтраки' THEN '["breakfast"]'
    WHEN 'Напитки' THEN '["snack"]'
    WHEN 'Десерты' THEN '["snack"]'
    ELSE '["lunch","dinner"]'
  END,
  qr_code = 'TR-' || UPPER(REPLACE(slug, '-', '')),
  source_id = slug,
  created_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
WHERE created_at IS NULL;

ALTER TABLE diary_days ADD COLUMN target_protein_g REAL NOT NULL DEFAULT 0;
ALTER TABLE diary_days ADD COLUMN target_fat_g REAL NOT NULL DEFAULT 0;
ALTER TABLE diary_days ADD COLUMN target_carbs_g REAL NOT NULL DEFAULT 0;
ALTER TABLE diary_days ADD COLUMN consumed_protein_g REAL NOT NULL DEFAULT 0;
ALTER TABLE diary_days ADD COLUMN consumed_fat_g REAL NOT NULL DEFAULT 0;
ALTER TABLE diary_days ADD COLUMN consumed_carbs_g REAL NOT NULL DEFAULT 0;
ALTER TABLE diary_days ADD COLUMN completed_at TEXT;

ALTER TABLE diary_entries ADD COLUMN product_name_snapshot TEXT;
ALTER TABLE diary_entries ADD COLUMN serving_size_g REAL NOT NULL DEFAULT 100;
ALTER TABLE diary_entries ADD COLUMN quantity_g REAL NOT NULL DEFAULT 100;
ALTER TABLE diary_entries ADD COLUMN source_type TEXT NOT NULL DEFAULT 'tochka_rosta';
ALTER TABLE diary_entries ADD COLUMN updated_at TEXT;

UPDATE diary_entries SET
  product_name_snapshot = (SELECT name FROM products WHERE products.id = diary_entries.product_id),
  serving_size_g = COALESCE((SELECT serving_size_g FROM products WHERE products.id = diary_entries.product_id), 100),
  quantity_g = servings * COALESCE((SELECT serving_size_g FROM products WHERE products.id = diary_entries.product_id), 100),
  updated_at = created_at
WHERE product_name_snapshot IS NULL;

UPDATE diary_days SET
  consumed_protein_g = COALESCE((SELECT SUM(protein_g) FROM diary_entries WHERE diary_day_id = diary_days.id), 0),
  consumed_fat_g = COALESCE((SELECT SUM(fat_g) FROM diary_entries WHERE diary_day_id = diary_days.id), 0),
  consumed_carbs_g = COALESCE((SELECT SUM(carbs_g) FROM diary_entries WHERE diary_day_id = diary_days.id), 0);

CREATE TABLE favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  created_at TEXT NOT NULL,
  UNIQUE(product_id)
);

CREATE TABLE flow_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  was_completed INTEGER NOT NULL,
  streak_after_completion INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE meal_plan_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products(id),
  meal_type TEXT NOT NULL,
  servings REAL NOT NULL DEFAULT 1,
  is_added_to_diary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE(date, meal_type)
);

CREATE TABLE scan_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  product_id INTEGER REFERENCES products(id),
  scanned_at TEXT NOT NULL
);

CREATE TABLE recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER UNIQUE REFERENCES products(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  image_uri TEXT,
  servings REAL NOT NULL,
  final_weight_g REAL NOT NULL,
  total_calories REAL NOT NULL,
  total_protein_g REAL,
  total_fat_g REAL,
  total_carbs_g REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE recipe_ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  source_type TEXT NOT NULL,
  product_name_snapshot TEXT NOT NULL,
  amount_g REAL NOT NULL,
  calories REAL NOT NULL,
  protein_g REAL,
  fat_g REAL,
  carbs_g REAL,
  created_at TEXT NOT NULL
);

CREATE TABLE food_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  source_type TEXT NOT NULL,
  source_id TEXT,
  source_name TEXT NOT NULL,
  original_name TEXT,
  source_version TEXT,
  source_locale TEXT,
  source_updated_at TEXT,
  imported_at TEXT NOT NULL,
  UNIQUE(product_id, source_type)
);

CREATE TABLE external_food_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  barcode TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT,
  payload_json TEXT NOT NULL,
  normalized_name TEXT,
  calories_per_100g REAL,
  protein_per_100g REAL,
  fat_per_100g REAL,
  carbs_per_100g REAL,
  cached_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  UNIQUE(barcode, source_type)
);

CREATE INDEX idx_products_source ON products(source_type, deleted_at);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_qr ON products(qr_code);
CREATE INDEX idx_diary_days_date_completed ON diary_days(date, is_completed);
CREATE INDEX idx_diary_entries_product ON diary_entries(product_id);
CREATE INDEX idx_meal_plan_date ON meal_plan_items(date);
CREATE INDEX idx_scan_history_code ON scan_history(code);
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_external_food_cache_barcode ON external_food_cache(barcode);

COMMIT;
`;
