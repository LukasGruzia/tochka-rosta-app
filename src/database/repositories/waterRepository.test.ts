import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addWater, loadWaterSummary, removeWaterEntry } from './waterRepository';

type Row = { id: number; date: string; amount_ml: number; created_at: string };
const state = vi.hoisted(() => ({ rows: [] as Row[], nextId: 1 }));
const db = vi.hoisted(() => ({
  runAsync: vi.fn(async (sql: string, ...args: unknown[]) => { if (sql.startsWith('INSERT')) { const [date, amount, created] = args as [string, number, string]; state.rows.push({ id: state.nextId, date, amount_ml: amount, created_at: created }); return { lastInsertRowId: state.nextId++ }; } state.rows = state.rows.filter((row) => row.id !== args[0]); return {}; }),
  getAllAsync: vi.fn(async (_sql: string, date: string) => state.rows.filter((row) => row.date === date)),
  getFirstAsync: vi.fn(async () => ({ water_goal_ml: 2000 })),
}));
vi.mock('../database', () => ({ getDatabase: async () => db }));
describe('water entry CRUD', () => {
  beforeEach(() => { state.rows = []; state.nextId = 1; vi.clearAllMocks(); });
  it('adds, sums and removes water', async () => { const id = await addWater(250, '2026-07-28'); await addWater(500, '2026-07-28'); expect(await loadWaterSummary('2026-07-28')).toMatchObject({ totalMl: 750, goalMl: 2000 }); await removeWaterEntry(id); expect((await loadWaterSummary('2026-07-28')).totalMl).toBe(500); });
});
