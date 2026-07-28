export const migrationV3 = `
BEGIN;

ALTER TABLE user_profile ADD COLUMN avatar_uri TEXT;
ALTER TABLE user_profile ADD COLUMN water_goal_ml INTEGER NOT NULL DEFAULT 2000;
ALTER TABLE diary_entries ADD COLUMN date TEXT;
UPDATE diary_entries SET date=(SELECT date FROM diary_days WHERE diary_days.id=diary_entries.diary_day_id) WHERE date IS NULL;

CREATE TABLE weight_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  weight_kg REAL NOT NULL CHECK(weight_kg > 0),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE water_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  amount_ml INTEGER NOT NULL CHECK(amount_ml > 0 AND amount_ml <= 5000),
  created_at TEXT NOT NULL
);

CREATE TABLE meal_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  default_meal_type TEXT NOT NULL DEFAULT 'breakfast',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE meal_template_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL REFERENCES meal_templates(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  product_name_snapshot TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  servings REAL NOT NULL,
  quantity_g REAL NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE search_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL UNIQUE COLLATE NOCASE,
  use_count INTEGER NOT NULL DEFAULT 1,
  last_used_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_name_v3 ON products(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_products_slug_v3 ON products(slug);
CREATE INDEX IF NOT EXISTS idx_diary_entries_date_v3 ON diary_entries(date);
CREATE INDEX IF NOT EXISTS idx_weight_logs_date_v3 ON weight_logs(date);
CREATE INDEX IF NOT EXISTS idx_water_entries_date_v3 ON water_entries(date);
CREATE INDEX IF NOT EXISTS idx_search_history_query_v3 ON search_history(query COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_template_items_template_v3 ON meal_template_items(template_id);

COMMIT;
`;
