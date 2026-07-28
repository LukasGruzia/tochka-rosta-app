import * as Haptics from 'expo-haptics';
import { recordUiAction } from './uiDiagnostics';

export type AppHaptic = 'none' | 'selection' | 'light' | 'success';

const HAPTIC_THROTTLE_MS = 60;
let lastHapticAt = Number.NEGATIVE_INFINITY;

export async function safelyRunHaptic(kind: AppHaptic = 'selection') {
  if (kind === 'none') return true;
  const now = Date.now();
  if (now - lastHapticAt < HAPTIC_THROTTLE_MS) return true;
  lastHapticAt = now;
  try {
    if (kind === 'selection') await Haptics.selectionAsync();
    else if (kind === 'light') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return true;
  } catch (error) {
    recordUiAction('error_occurred', 'haptic_failed', error instanceof Error ? error.message : 'Haptic unavailable');
    return false;
  }
}
