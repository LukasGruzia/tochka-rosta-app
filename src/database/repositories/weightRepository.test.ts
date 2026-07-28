import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteWeightLog, loadWeightLogs, saveWeightLog } from './weightRepository';

type Row = { id: number; date: string; weight_kg: number; note: string; created_at: string; updated_at: string };
const state = vi.hoisted(() => ({ rows: [] as Row[], nextId: 1 }));
const db = vi.hoisted(() => ({
  getAllAsync: vi.fn(async (_sql: string) => [...state.rows].sort((a, b) => a.date.localeCompare(b.date))),
  runAsync: vi.fn(async (sql: string, ...args: unknown[]) => {
    if (sql.startsWith('INSERT')) { const [date, weight, note, created, updated] = args as [string, number, string, string, string]; const existing = state.rows.find((row) => row.date === date); if (existing) Object.assign(existing, { weight_kg: weight, note, updated_at: updated }); else state.rows.push({ id: state.nextId++, date, weight_kg: weight, note, created_at: created, updated_at: updated }); }
    if (sql.startsWith('UPDATE')) { const [date, weight, note, updated, id] = args as [string, number, string, string, number]; const row = state.rows.find((item) => item.id === id); if (row) Object.assign(row, { date, weight_kg: weight, note, updated_at: updated }); }
    if (sql.startsWith('DELETE')) state.rows = state.rows.filter((row) => row.id !== args[0]); return {};
  }),
}));
vi.mock('../database', () => ({ getDatabase: async () => db }));
describe('weight log CRUD', () => {
  beforeEach(() => { state.rows = []; state.nextId = 1; vi.clearAllMocks(); });
  it('adds, changes and deletes a weight entry', async () => { await saveWeightLog({ date: '2026-07-28', weightKg: 80, note: 'start' }); let rows = await loadWeightLogs(); expect(rows[0]).toMatchObject({ weightKg: 80, note: 'start' }); await saveWeightLog({ id: rows[0].id, date: '2026-07-28', weightKg: 79.5, note: 'updated' }); rows = await loadWeightLogs(); expect(rows[0]).toMatchObject({ weightKg: 79.5, note: 'updated' }); await deleteWeightLog(rows[0].id); expect(await loadWeightLogs()).toHaveLength(0); });
});
