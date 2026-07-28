export const migrationV4 = `
BEGIN;

ALTER TABLE user_profile ADD COLUMN uuid TEXT;
ALTER TABLE user_profile ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'local';
ALTER TABLE products ADD COLUMN uuid TEXT;
ALTER TABLE products ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'local';
ALTER TABLE recipes ADD COLUMN uuid TEXT;
ALTER TABLE recipes ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'local';
ALTER TABLE diary_entries ADD COLUMN uuid TEXT;
ALTER TABLE diary_entries ADD COLUMN deleted_at TEXT;
ALTER TABLE diary_entries ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'local';
ALTER TABLE meal_plan_items ADD COLUMN uuid TEXT;
ALTER TABLE meal_plan_items ADD COLUMN updated_at TEXT;
ALTER TABLE meal_plan_items ADD COLUMN deleted_at TEXT;
ALTER TABLE meal_plan_items ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'local';
ALTER TABLE meal_templates ADD COLUMN uuid TEXT;
ALTER TABLE meal_templates ADD COLUMN deleted_at TEXT;
ALTER TABLE meal_templates ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'local';
ALTER TABLE water_entries ADD COLUMN uuid TEXT;
ALTER TABLE water_entries ADD COLUMN updated_at TEXT;
ALTER TABLE water_entries ADD COLUMN deleted_at TEXT;
ALTER TABLE water_entries ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'local';
ALTER TABLE weight_logs ADD COLUMN uuid TEXT;
ALTER TABLE weight_logs ADD COLUMN deleted_at TEXT;
ALTER TABLE weight_logs ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'local';
ALTER TABLE flow_history ADD COLUMN uuid TEXT;
ALTER TABLE flow_history ADD COLUMN updated_at TEXT;
ALTER TABLE flow_history ADD COLUMN deleted_at TEXT;
ALTER TABLE flow_history ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'local';
ALTER TABLE flow_state ADD COLUMN weekly_goal_days INTEGER NOT NULL DEFAULT 5;
ALTER TABLE flow_state ADD COLUMN pause_tokens INTEGER NOT NULL DEFAULT 1;
ALTER TABLE flow_state ADD COLUMN total_pauses INTEGER NOT NULL DEFAULT 0;

UPDATE user_profile SET uuid=lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))) WHERE uuid IS NULL;
UPDATE products SET uuid=lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))) WHERE uuid IS NULL;
UPDATE recipes SET uuid=lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))) WHERE uuid IS NULL;
UPDATE diary_entries SET uuid=lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))) WHERE uuid IS NULL;
UPDATE meal_plan_items SET uuid=lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))), updated_at=COALESCE(updated_at,created_at) WHERE uuid IS NULL;
UPDATE meal_templates SET uuid=lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))) WHERE uuid IS NULL;
UPDATE water_entries SET uuid=lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))), updated_at=COALESCE(updated_at,created_at) WHERE uuid IS NULL;
UPDATE weight_logs SET uuid=lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))) WHERE uuid IS NULL;
UPDATE flow_history SET uuid=lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))), updated_at=COALESCE(updated_at,created_at) WHERE uuid IS NULL;

CREATE TABLE meal_plan_items_v4 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products(id),
  meal_type TEXT NOT NULL,
  servings REAL NOT NULL DEFAULT 1,
  is_added_to_diary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  uuid TEXT,
  updated_at TEXT,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'local'
);
INSERT INTO meal_plan_items_v4 SELECT id,date,product_id,meal_type,servings,is_added_to_diary,created_at,uuid,updated_at,deleted_at,sync_status FROM meal_plan_items;
DROP TABLE meal_plan_items;
ALTER TABLE meal_plan_items_v4 RENAME TO meal_plan_items;

CREATE TABLE budget_settings (
  id INTEGER PRIMARY KEY CHECK(id=1),
  per_meal_budget REAL,
  daily_budget REAL,
  weekly_budget REAL,
  currency TEXT NOT NULL DEFAULT 'RUB',
  include_in_recommendations INTEGER NOT NULL DEFAULT 0,
  show_on_home INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
INSERT INTO budget_settings(id,currency,include_in_recommendations,show_on_home,created_at,updated_at) VALUES(1,'RUB',0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

CREATE TABLE weekly_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  week_start_date TEXT NOT NULL UNIQUE,
  target_budget REAL,
  estimated_cost REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  settings_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'local'
);
CREATE TABLE weekly_plan_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  weekly_plan_id INTEGER NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  product_id INTEGER REFERENCES products(id),
  product_name_snapshot TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  amount REAL NOT NULL,
  servings REAL NOT NULL DEFAULT 1,
  estimated_cost REAL NOT NULL DEFAULT 0,
  is_added_to_diary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'local'
);
CREATE TABLE shopping_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  week_start_date TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'local'
);
CREATE TABLE shopping_list_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  shopping_list_id INTEGER NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  unit TEXT NOT NULL,
  estimated_cost REAL NOT NULL DEFAULT 0,
  source_type TEXT NOT NULL,
  is_checked INTEGER NOT NULL DEFAULT 0,
  is_at_home INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'local'
);
CREATE TABLE user_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  is_hidden INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE flow_pauses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  date TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'local'
);
CREATE TABLE achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  achieved_at TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'local'
);
CREATE TABLE research_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  duration_seconds INTEGER,
  survey_json TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE research_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  screen TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_user_profile_uuid_v4 ON user_profile(uuid);
CREATE UNIQUE INDEX idx_products_uuid_v4 ON products(uuid);
CREATE UNIQUE INDEX idx_recipes_uuid_v4 ON recipes(uuid);
CREATE UNIQUE INDEX idx_diary_entries_uuid_v4 ON diary_entries(uuid);
CREATE UNIQUE INDEX idx_meal_plan_uuid_v4 ON meal_plan_items(uuid);
CREATE INDEX idx_meal_plan_date_v4 ON meal_plan_items(date);
CREATE UNIQUE INDEX idx_meal_template_uuid_v4 ON meal_templates(uuid);
CREATE UNIQUE INDEX idx_water_uuid_v4 ON water_entries(uuid);
CREATE UNIQUE INDEX idx_weight_uuid_v4 ON weight_logs(uuid);
CREATE UNIQUE INDEX idx_flow_history_uuid_v4 ON flow_history(uuid);
CREATE TRIGGER set_user_profile_uuid_v4 AFTER INSERT ON user_profile WHEN NEW.uuid IS NULL BEGIN UPDATE user_profile SET uuid=lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))) WHERE id=NEW.id; END;
CREATE TRIGGER set_products_uuid_v4 AFTER INSERT ON products WHEN NEW.uuid IS NULL BEGIN UPDATE products SET uuid=lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))) WHERE id=NEW.id; END;
CREATE TRIGGER set_recipes_uuid_v4 AFTER INSERT ON recipes WHEN NEW.uuid IS NULL BEGIN UPDATE recipes SET uuid=lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))) WHERE id=NEW.id; END;
CREATE TRIGGER set_diary_entries_uuid_v4 AFTER INSERT ON diary_entries WHEN NEW.uuid IS NULL BEGIN UPDATE diary_entries SET uuid=lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))) WHERE id=NEW.id; END;
CREATE TRIGGER set_meal_plan_uuid_v4 AFTER INSERT ON meal_plan_items WHEN NEW.uuid IS NULL BEGIN UPDATE meal_plan_items SET uuid=lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))),updated_at=COALESCE(NEW.updated_at,NEW.created_at) WHERE id=NEW.id; END;
CREATE TRIGGER set_meal_template_uuid_v4 AFTER INSERT ON meal_templates WHEN NEW.uuid IS NULL BEGIN UPDATE meal_templates SET uuid=lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))) WHERE id=NEW.id; END;
CREATE TRIGGER set_water_uuid_v4 AFTER INSERT ON water_entries WHEN NEW.uuid IS NULL BEGIN UPDATE water_entries SET uuid=lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))),updated_at=COALESCE(NEW.updated_at,NEW.created_at) WHERE id=NEW.id; END;
CREATE TRIGGER set_weight_uuid_v4 AFTER INSERT ON weight_logs WHEN NEW.uuid IS NULL BEGIN UPDATE weight_logs SET uuid=lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))) WHERE id=NEW.id; END;
CREATE TRIGGER set_flow_history_uuid_v4 AFTER INSERT ON flow_history WHEN NEW.uuid IS NULL BEGIN UPDATE flow_history SET uuid=lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))),updated_at=COALESCE(NEW.updated_at,NEW.created_at) WHERE id=NEW.id; END;
CREATE INDEX idx_weekly_plan_items_plan_v4 ON weekly_plan_items(weekly_plan_id,date);
CREATE INDEX idx_shopping_items_list_v4 ON shopping_list_items(shopping_list_id,category);
CREATE INDEX idx_insights_period_v4 ON user_insights(period_start,period_end,is_hidden);
CREATE INDEX idx_flow_pauses_date_v4 ON flow_pauses(date);
CREATE INDEX idx_research_events_session_v4 ON research_events(session_id,created_at);

COMMIT;
`;
