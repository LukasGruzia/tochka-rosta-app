import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSetting, setSetting } from './settingsRepository';

const state = vi.hoisted(() => ({ settings: new Map<string, string>() }));
const db = vi.hoisted(() => ({
  getFirstAsync: vi.fn(async (_sql: string, key: string) => state.settings.has(key) ? { value: state.settings.get(key) } : null),
  runAsync: vi.fn(async (_sql: string, key: string, value: string) => { state.settings.set(key, value); return {}; }),
}));
vi.mock('../database', () => ({ getDatabase: async () => db }));
describe('theme setting persistence', () => {
  beforeEach(() => { state.settings.clear(); vi.clearAllMocks(); });
  it('saves and reloads system, dark and light values', async () => { for (const mode of ['system', 'dark', 'light']) { await setSetting('theme_mode', mode); expect(await getSetting('theme_mode')).toBe(mode); } });
});
