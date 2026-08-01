import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('database performance persistence', () => {
  it('versions the product seed instead of importing it on every startup', () => {
    const source = read('src/database/database.ts');
    expect(source).toContain("seedDataVersion = 'usda-common-2026-08-v4'");
    expect(source).toContain("seeded?.value !== seedDataVersion");
    expect(source).toContain("'seed_data_version'");
  });

  it('adds bounded-search and diary indexes without deleting user rows', () => {
    const migration = read('src/database/migrations/v5.ts');
    expect(migration).toContain('idx_products_normalized_name_v5');
    expect(migration).toContain('idx_products_category_v5');
    expect(migration).toContain('idx_search_history_recent_v5');
    expect(migration).not.toMatch(/DROP TABLE|DELETE FROM/);
  });
});
