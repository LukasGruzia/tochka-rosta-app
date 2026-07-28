import * as Haptics from 'expo-haptics';
import { recordUiAction } from './uiDiagnostics';

export type AppHaptic = 'none' | 'selection' | 'light' | 'success';

export async function safelyRunHaptic(kind: AppHaptic = 'selection') {
  if (kind === 'none') return true;
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
