import * as SQLite from 'expo-sqlite';
import { migrations, databaseName } from './schema';
import { seedDatabase } from './seed';
import { profileQuery } from '@/performance/queryProfiler';
import { setPerformanceMetric } from '@/performance/performanceLogger';
import { normalizeSearchText } from '@/services/productSearch';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
export const seedDataVersion = 'usda-common-2026-07-v1';

export function getDatabase() {
  databasePromise ??= SQLite.openDatabaseAsync(databaseName);
  return databasePromise;
}

async function backfillNormalizedProductNames(db: SQLite.SQLiteDatabase) {
  const products = await db.getAllAsync<{ id: number; name: string }>(
    `SELECT id, name FROM products WHERE normalized_name='' OR normalized_name IS NULL`,
  );
  if (!products.length) return;
  await db.withExclusiveTransactionAsync(async (txn) => {
    const statement = await txn.prepareAsync('UPDATE products SET normalized_name=? WHERE id=?');
    try {
      for (const product of products) {
        await statement.executeAsync(normalizeSearchText(product.name), product.id);
      }
    } finally {
      await statement.finalizeAsync();
    }
  });
}

export async function initializeDatabase() {
  const db = await profileQuery('database:open', getDatabase);
  await profileQuery('database:pragmas', () => db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;'));
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  for (const migration of migrations) {
    if (migration.version > version) {
      await profileQuery(`migration:v${migration.version}`, () => db.execAsync(migration.up));
      if (migration.version === 5) {
        await profileQuery('migration:v5:normalize-products', () => backfillNormalizedProductNames(db));
      }
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
      version = migration.version;
    }
  }
  setPerformanceMetric('databaseVersion', version);
  const seeded = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_settings WHERE key=?', 'seed_data_version');
  if (seeded?.value !== seedDataVersion) {
    await profileQuery('seed:products', () => db.withExclusiveTransactionAsync(async (txn) => {
      await seedDatabase(txn);
      await txn.runAsync(`INSERT INTO app_settings(key,value,updated_at) VALUES('seed_data_version',?,CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at`, seedDataVersion);
    }));
  }
  return db;
}
