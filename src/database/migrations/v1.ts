export const migrationV1 = `
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS user_profile (
  id INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  calculation_sex TEXT NOT NULL,
  height_cm REAL NOT NULL,
  weight_kg REAL NOT NULL,
  activity_level TEXT NOT NULL,
  goal TEXT NOT NULL,
  diet_preference TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS user_restrictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
  restriction TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS nutrition_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
  bmr REAL NOT NULL,
  tdee REAL NOT NULL,
  calories REAL NOT NULL,
  protein_g REAL NOT NULL,
  fat_g REAL NOT NULL,
  carbs_g REAL NOT NULL,
  goal TEXT NOT NULL,
  activity_factor REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  serving_size_g REAL NOT NULL,
  calories REAL NOT NULL,
  protein_g REAL NOT NULL,
  fat_g REAL NOT NULL,
  carbs_g REAL NOT NULL,
  price REAL NOT NULL,
  image_key TEXT NOT NULL,
  category TEXT NOT NULL,
  is_available INTEGER NOT NULL DEFAULT 1,
  data_status TEXT NOT NULL DEFAULT 'demo'
);
CREATE TABLE IF NOT EXISTS diary_days (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT UNIQUE NOT NULL,
  target_calories REAL NOT NULL,
  consumed_calories REAL NOT NULL DEFAULT 0,
  is_completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS diary_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diary_day_id INTEGER NOT NULL REFERENCES diary_days(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  meal_type TEXT NOT NULL,
  servings REAL NOT NULL,
  calories REAL NOT NULL,
  protein_g REAL NOT NULL,
  fat_g REAL NOT NULL,
  carbs_g REAL NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS flow_state (
  id INTEGER PRIMARY KEY NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_date TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_diary_entries_day ON diary_entries(diary_day_id);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_profile ON user_restrictions(profile_id);
`;
