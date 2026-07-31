const uuidExpression =
  "lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6)))";

export const migrationV7 = `
BEGIN;

ALTER TABLE diary_days ADD COLUMN uuid TEXT;
ALTER TABLE rhythm_events ADD COLUMN uuid TEXT;
ALTER TABLE rhythm_decisions ADD COLUMN uuid TEXT;
ALTER TABLE rhythm_recommendations ADD COLUMN uuid TEXT;
ALTER TABLE rhythm_feedback ADD COLUMN uuid TEXT;
ALTER TABLE meal_plan_runs ADD COLUMN uuid TEXT;

UPDATE diary_days SET uuid=${uuidExpression} WHERE uuid IS NULL;
UPDATE rhythm_events SET uuid=${uuidExpression} WHERE uuid IS NULL;
UPDATE rhythm_decisions SET uuid=${uuidExpression} WHERE uuid IS NULL;
UPDATE rhythm_recommendations SET uuid=${uuidExpression} WHERE uuid IS NULL;
UPDATE rhythm_feedback SET uuid=${uuidExpression} WHERE uuid IS NULL;
UPDATE meal_plan_runs SET uuid=${uuidExpression} WHERE uuid IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_diary_days_uuid_v7 ON diary_days(uuid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rhythm_events_uuid_v7 ON rhythm_events(uuid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rhythm_decisions_uuid_v7 ON rhythm_decisions(uuid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rhythm_recommendations_uuid_v7 ON rhythm_recommendations(uuid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rhythm_feedback_uuid_v7 ON rhythm_feedback(uuid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_meal_plan_runs_uuid_v7 ON meal_plan_runs(uuid);

CREATE TRIGGER set_diary_days_uuid_v7 AFTER INSERT ON diary_days WHEN NEW.uuid IS NULL BEGIN UPDATE diary_days SET uuid=${uuidExpression} WHERE id=NEW.id; END;
CREATE TRIGGER set_rhythm_events_uuid_v7 AFTER INSERT ON rhythm_events WHEN NEW.uuid IS NULL BEGIN UPDATE rhythm_events SET uuid=${uuidExpression} WHERE id=NEW.id; END;
CREATE TRIGGER set_rhythm_decisions_uuid_v7 AFTER INSERT ON rhythm_decisions WHEN NEW.uuid IS NULL BEGIN UPDATE rhythm_decisions SET uuid=${uuidExpression} WHERE id=NEW.id; END;
CREATE TRIGGER set_rhythm_recommendations_uuid_v7 AFTER INSERT ON rhythm_recommendations WHEN NEW.uuid IS NULL BEGIN UPDATE rhythm_recommendations SET uuid=${uuidExpression} WHERE id=NEW.id; END;
CREATE TRIGGER set_rhythm_feedback_uuid_v7 AFTER INSERT ON rhythm_feedback WHEN NEW.uuid IS NULL BEGIN UPDATE rhythm_feedback SET uuid=${uuidExpression} WHERE id=NEW.id; END;
CREATE TRIGGER set_meal_plan_runs_uuid_v7 AFTER INSERT ON meal_plan_runs WHEN NEW.uuid IS NULL BEGIN UPDATE meal_plan_runs SET uuid=${uuidExpression} WHERE id=NEW.id; END;

INSERT INTO app_settings(key,value,updated_at) VALUES('database_schema_version','7',CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET value='7',updated_at=CURRENT_TIMESTAMP;

COMMIT;
`;
