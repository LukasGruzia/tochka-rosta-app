import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteDiaryEntry, restoreDiaryEntry } from './diaryRepository';

const state = vi.hoisted(() => ({ deleted: false }));
const db = vi.hoisted(() => ({
  getFirstAsync: vi.fn(async (sql: string) => {
    if (sql.includes('e.deleted_at IS NULL')) return state.deleted ? null : { diary_day_id: 4, is_completed: 0 };
    if (sql.includes('e.deleted_at IS NOT NULL')) return state.deleted ? { diary_day_id: 4, is_completed: 0 } : null;
    return null;
  }),
  runAsync: vi.fn(async (sql: string) => {
    if (sql.includes('SET deleted_at=?')) state.deleted = true;
    if (sql.includes('SET deleted_at=NULL')) state.deleted = false;
    return {};
  }),
  withExclusiveTransactionAsync: vi.fn(async (callback: (transaction: typeof db) => Promise<void>) => callback(db)),
}));

vi.mock('../database', () => ({ getDatabase: async () => db }));
vi.mock('@/services/foodMath', () => ({ calculateForWeight: vi.fn() }));
vi.mock('@/services/diaryMath', () => ({ scaleDiarySnapshot: vi.fn() }));
vi.mock('@/utils/date', () => ({ getLocalDateKey: vi.fn(() => '2026-07-31') }));

describe('recoverable diary deletion', () => {
  beforeEach(() => {
    state.deleted = false;
    vi.clearAllMocks();
  });

  it('soft-deletes and restores the same SQLite row', async () => {
    await deleteDiaryEntry(7);
    expect(state.deleted).toBe(true);
    expect(db.runAsync.mock.calls.some(([sql]) => String(sql).includes("sync_status='pending'"))).toBe(true);

    await restoreDiaryEntry(7);
    expect(state.deleted).toBe(false);
    expect(db.runAsync.mock.calls.some(([sql]) => String(sql).includes('deleted_at=NULL'))).toBe(true);
  });

  it('excludes soft-deleted rows from every diary aggregate', async () => {
    await deleteDiaryEntry(7);
    const aggregateSql = db.runAsync.mock.calls.map(([sql]) => String(sql)).find((sql) => sql.includes('consumed_calories'));
    expect(aggregateSql).toContain('deleted_at IS NULL');
  });
});
