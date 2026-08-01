export const migrationV8 = `
BEGIN;

ALTER TABLE products ADD COLUMN canonical_key TEXT;
ALTER TABLE products ADD COLUMN brand TEXT;
ALTER TABLE products ADD COLUMN preparation_state TEXT;
ALTER TABLE products ADD COLUMN source_priority INTEGER NOT NULL DEFAULT 50;
ALTER TABLE products ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN merged_into_id INTEGER REFERENCES products(id);
ALTER TABLE products ADD COLUMN review_status TEXT NOT NULL DEFAULT 'verified';

UPDATE products SET
  canonical_key = CASE
    WHEN is_user_created=1 THEN 'user:' || COALESCE(uuid, slug)
    WHEN source_type='tochka_rosta' THEN 'tochka:' || slug
    WHEN source_type='open_food_facts' THEN 'off:' || COALESCE(barcode, source_id, slug)
    ELSE source_type || ':' || COALESCE(source_id, slug)
  END,
  source_priority = CASE
    WHEN is_user_created=1 THEN 100
    WHEN source_type='tochka_rosta' THEN 90
    WHEN source_type='usda' AND source_version LIKE 'Foundation%' THEN 80
    WHEN source_type='usda' THEN 60
    ELSE 50
  END,
  is_active = CASE WHEN is_available=1 AND deleted_at IS NULL THEN 1 ELSE 0 END;

CREATE TABLE product_catalog_backup_v8 AS SELECT * FROM products;
CREATE TABLE catalog_migration_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  before_count INTEGER NOT NULL,
  after_count INTEGER NOT NULL,
  technical_names_before INTEGER NOT NULL,
  technical_names_after INTEGER NOT NULL,
  merged_count INTEGER NOT NULL,
  needs_review_count INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
INSERT INTO catalog_migration_reports(
  migration_key,before_count,after_count,technical_names_before,technical_names_after,merged_count,needs_review_count,created_at,updated_at
) SELECT 'catalog-v8', COUNT(*), COUNT(*),
  COALESCE(SUM(CASE WHEN lower(name) LIKE '%вариант %' THEN 1 ELSE 0 END),0),
  COALESCE(SUM(CASE WHEN lower(name) LIKE '%вариант %' THEN 1 ELSE 0 END),0), 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM products WHERE deleted_at IS NULL;

CREATE INDEX idx_products_active_v8 ON products(is_active, is_available, deleted_at);
CREATE INDEX idx_products_canonical_v8 ON products(canonical_key);
CREATE INDEX idx_products_merged_v8 ON products(merged_into_id);
CREATE UNIQUE INDEX idx_products_canonical_active_v8 ON products(canonical_key)
  WHERE canonical_key IS NOT NULL AND is_user_created=0 AND is_active=1 AND deleted_at IS NULL;

COMMIT;
`;
