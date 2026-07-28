import { beforeEach, describe, expect, it, vi } from 'vitest';
import { safelyRunHaptic } from './haptics';

const { selectionAsync, impactAsync, notificationAsync } = vi.hoisted(() => ({
  selectionAsync: vi.fn(),
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
}));

vi.mock('expo-haptics', () => ({
  selectionAsync,
  impactAsync,
  notificationAsync,
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

describe('safe haptic feedback', () => {
  beforeEach(() => { selectionAsync.mockReset(); impactAsync.mockReset(); notificationAsync.mockReset(); });

  it('absorbs an unavailable haptic engine', async () => {
    selectionAsync.mockRejectedValueOnce(new Error('unavailable'));
    await expect(safelyRunHaptic('selection')).resolves.toBe(false);
  });

  it('does not require a native call when haptics are disabled', async () => {
    await expect(safelyRunHaptic('none')).resolves.toBe(true);
    expect(selectionAsync).not.toHaveBeenCalled();
  });
});
