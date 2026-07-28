import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@/types/domain';
import { clearSearchHistory, loadFrequentProducts, loadRecentProducts, loadSearchHistory, recordSearch } from './searchRepository';

type HistoryRow = { id: number; query: string; use_count: number; last_used_at: string };
const state = vi.hoisted(() => ({ history: [] as HistoryRow[] }));
const db = vi.hoisted(() => ({
  runAsync: vi.fn(async (sql: string, ...args: unknown[]) => { if (sql.startsWith('DELETE')) state.history = []; else { const [query, time] = args as [string, string]; const existing = state.history.find((row) => row.query.toLowerCase() === query.toLowerCase()); if (existing) { existing.use_count += 1; existing.last_used_at = time; } else state.history.push({ id: state.history.length + 1, query, use_count: 1, last_used_at: time }); } return {}; }),
  getAllAsync: vi.fn(async (sql: string) => sql.includes('search_history') ? [...state.history].reverse() : [{ product_id: sql.includes('COUNT') ? 2 : 1 }]),
}));
vi.mock('../database', () => ({ getDatabase: async () => db }));
vi.mock('./productRepository', () => ({ getProductById: async (id: number) => ({ id, name: `Продукт ${id}` } as Product) }));
describe('search history and diary-derived lists', () => {
  beforeEach(() => { state.history = []; vi.clearAllMocks(); });
  it('records, increments and clears a normalized query', async () => { await recordSearch('  гречка  '); await recordSearch('гречка'); expect(await loadSearchHistory()).toMatchObject([{ query: 'гречка', useCount: 2 }]); await clearSearchHistory(); expect(await loadSearchHistory()).toHaveLength(0); });
  it('loads recent and frequent product ids as product cards', async () => { expect((await loadRecentProducts())[0].id).toBe(1); expect((await loadFrequentProducts())[0].id).toBe(2); });
});
