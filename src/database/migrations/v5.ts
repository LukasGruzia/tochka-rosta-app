export const migrationV5 = `
BEGIN;

ALTER TABLE products ADD COLUMN normalized_name TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_products_normalized_name_v5 ON products(normalized_name, is_available, deleted_at);
CREATE INDEX IF NOT EXISTS idx_products_category_v5 ON products(category, is_available, deleted_at);
CREATE INDEX IF NOT EXISTS idx_products_available_source_v5 ON products(source_type, is_available, deleted_at);
CREATE INDEX IF NOT EXISTS idx_diary_entries_created_v5 ON diary_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_search_history_recent_v5 ON search_history(last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_flow_history_date_v5 ON flow_history(date);
CREATE INDEX IF NOT EXISTS idx_favorites_product_v5 ON favorites(product_id);

INSERT INTO app_settings(key,value,updated_at) VALUES('database_schema_version','5',CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET value='5',updated_at=CURRENT_TIMESTAMP;

COMMIT;
`;
