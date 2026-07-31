import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radii, shadows, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

import { AppPressable } from './AppPressable';
import { AppText } from './AppText';

export function UndoToast({ message, onUndo, onExpire, timeoutMs = 7000 }: { message: string; onUndo: () => void | Promise<void>; onExpire: () => void; timeoutMs?: number }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;

  useEffect(() => {
    const timer = setTimeout(() => expireRef.current(), timeoutMs);
    return () => clearTimeout(timer);
  }, [timeoutMs]);

  const undo = async () => {
    if (busy) return;
    try {
      setBusy(true);
      await onUndo();
    } finally {
      expireRef.current();
    }
  };

  return <View pointerEvents="box-none" style={[styles.layer, { bottom: Math.max(insets.bottom, 8) + 82 }]}>
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.toast, shadows.floating, { backgroundColor: colors.surfaceOverlay, borderColor: colors.glassBorderStrong, shadowColor: colors.backgroundPrimary }]}>
      <AppText style={styles.message} numberOfLines={2}>{message}</AppText>
      <AppPressable accessibilityRole="button" accessibilityLabel="Вернуть удалённый продукт" actionLabel="undo_diary_entry" disabled={busy} onPress={undo} style={[styles.undo, { backgroundColor: colors.greenGlow }]}>
        <AppText variant="caption" tone="green">{busy ? 'Возвращаем…' : 'Вернуть'}</AppText>
      </AppPressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: spacing.md, right: spacing.md, zIndex: 50 },
  toast: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingLeft: spacing.md, paddingRight: spacing.xs, paddingVertical: spacing.xs, borderRadius: radii.md, borderWidth: 1 },
  message: { flex: 1 },
  undo: { minWidth: 88, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, paddingHorizontal: spacing.sm },
});
