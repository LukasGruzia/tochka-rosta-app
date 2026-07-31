export const migrationV6 = `
BEGIN;

CREATE TABLE IF NOT EXISTS rhythm_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  mode TEXT NOT NULL DEFAULT 'balanced' CHECK (mode IN ('active','balanced','quiet','off')),
  enabled INTEGER NOT NULL DEFAULT 1,
  show_on_other_screens INTEGER NOT NULL DEFAULT 1,
  animations_enabled INTEGER NOT NULL DEFAULT 1,
  haptics_enabled INTEGER NOT NULL DEFAULT 1,
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS rhythm_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, route TEXT, payload_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS rhythm_decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, event_type TEXT NOT NULL, template_id TEXT NOT NULL, message TEXT NOT NULL,
  emotion TEXT NOT NULL, action TEXT NOT NULL, priority INTEGER NOT NULL, kind TEXT NOT NULL, route TEXT NOT NULL, context_hash TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS rhythm_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT, recommendation_key TEXT NOT NULL, context_hash TEXT NOT NULL, payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'shown', score REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS rhythm_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT, recommendation_key TEXT, product_id INTEGER, feedback_type TEXT NOT NULL,
  weight REAL NOT NULL, payload_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS rhythm_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, weight REAL NOT NULL DEFAULT 0,
  last_decayed_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(entity_type, entity_id)
);
CREATE TABLE IF NOT EXISTS rhythm_cooldowns (
  cooldown_key TEXT PRIMARY KEY, until_at TEXT NOT NULL, rejection_count INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS rhythm_message_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT, template_id TEXT NOT NULL, event_type TEXT NOT NULL, route TEXT NOT NULL, shown_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS meal_plan_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, context_hash TEXT NOT NULL, mode TEXT NOT NULL DEFAULT 'daily', candidate_count INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0, result_json TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rhythm_events_type_created ON rhythm_events(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rhythm_decisions_created ON rhythm_decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rhythm_recommendations_context ON rhythm_recommendations(context_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rhythm_feedback_product ON rhythm_feedback(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rhythm_preferences_entity ON rhythm_preferences(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_rhythm_message_template_date ON rhythm_message_history(template_id, shown_at DESC);
CREATE INDEX IF NOT EXISTS idx_meal_plan_runs_context ON meal_plan_runs(context_hash, created_at DESC);

INSERT OR IGNORE INTO rhythm_settings(id,mode,enabled,show_on_other_screens,animations_enabled,haptics_enabled,onboarding_completed,created_at,updated_at)
VALUES(1,'balanced',1,1,1,1,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT INTO app_settings(key,value,updated_at) VALUES('database_schema_version','6',CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET value='6',updated_at=CURRENT_TIMESTAMP;

COMMIT;
`;

