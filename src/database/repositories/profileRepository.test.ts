import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateProfileAvatar, updateWaterGoal } from './profileRepository';

const db = vi.hoisted(() => ({ runAsync: vi.fn(async () => ({})) }));
vi.mock('../database', () => ({ getDatabase: async () => db }));
describe('profile v3 fields', () => {
  beforeEach(() => vi.clearAllMocks());
  it('persists and clears avatar_uri', async () => { await updateProfileAvatar('file:///profile/avatar.jpg'); expect(db.runAsync).toHaveBeenLastCalledWith(expect.stringContaining('avatar_uri'), 'file:///profile/avatar.jpg', expect.any(String)); await updateProfileAvatar(null); expect(db.runAsync).toHaveBeenLastCalledWith(expect.stringContaining('avatar_uri'), null, expect.any(String)); });
  it('normalizes the saved water goal', async () => { expect(await updateWaterGoal(9999)).toBe(5000); expect(db.runAsync).toHaveBeenCalledWith(expect.stringContaining('water_goal_ml'), 5000, expect.any(String)); });
});
