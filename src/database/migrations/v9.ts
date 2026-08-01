export const migrationV9 = `
BEGIN;

CREATE TABLE IF NOT EXISTS product_serving_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount REAL NOT NULL CHECK(amount > 0),
  unit TEXT NOT NULL CHECK(unit IN ('g','ml','piece','serving')),
  grams_equivalent REAL NOT NULL CHECK(grams_equivalent > 0),
  is_default INTEGER NOT NULL DEFAULT 0,
  source_type TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(product_id, label, grams_equivalent)
);

CREATE TABLE IF NOT EXISTS user_product_serving_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  last_amount REAL NOT NULL CHECK(last_amount > 0),
  last_unit TEXT NOT NULL CHECK(last_unit IN ('g','ml','piece','serving')),
  last_grams_equivalent REAL NOT NULL CHECK(last_grams_equivalent > 0),
  usage_count INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS product_aliases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'seed',
  created_at TEXT NOT NULL,
  UNIQUE(product_id, normalized_alias)
);

CREATE TABLE IF NOT EXISTS catalog_size_migration_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  before_count INTEGER NOT NULL DEFAULT 0,
  canonical_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  serving_option_count INTEGER NOT NULL DEFAULT 0,
  alias_count INTEGER NOT NULL DEFAULT 0,
  unresolved_count INTEGER NOT NULL DEFAULT 0,
  diversity_added_count INTEGER NOT NULL DEFAULT 0,
  dry_run_json TEXT NOT NULL DEFAULT '{}',
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS product_catalog_backup_v9 AS SELECT * FROM products;

CREATE INDEX IF NOT EXISTS idx_product_aliases_normalized_v9 ON product_aliases(normalized_alias, product_id);
CREATE INDEX IF NOT EXISTS idx_product_servings_product_v9 ON product_serving_options(product_id, is_default DESC);
CREATE INDEX IF NOT EXISTS idx_user_product_serving_product_v9 ON user_product_serving_preferences(product_id);
CREATE INDEX IF NOT EXISTS idx_products_normalized_name_v9 ON products(normalized_name);

INSERT INTO app_settings(key,value,updated_at) VALUES('database_schema_version','9',CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET value='9',updated_at=CURRENT_TIMESTAMP;

COMMIT;
`;
