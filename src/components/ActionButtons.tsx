import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppPressable } from './AppPressable';
import { AppText } from './AppText';
import { PrimaryButton } from './PrimaryButton';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type PrimaryProps = ComponentProps<typeof PrimaryButton>;

export function SecondaryButton(props: PrimaryProps) {
  return <PrimaryButton {...props} secondary />;
}

export function TertiaryButton({ label, onPress, disabled, accessibilityLabel }: PrimaryProps) {
  return <AppPressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} disabled={disabled} onPress={onPress} style={styles.tertiary} pressedStyle={styles.pressed}>
    <View style={styles.center}><AppText variant="button" tone="green">{label}</AppText></View>
  </AppPressable>;
}

export function DestructiveButton({ label, onPress, disabled, accessibilityLabel }: PrimaryProps) {
  const { colors } = useTheme();
  return <AppPressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} disabled={disabled} onPress={onPress} haptic="warning" style={[styles.destructive, { backgroundColor: colors.danger }]} pressedStyle={styles.pressed}>
    <View style={styles.center}><AppText variant="button" style={{ color: colors.surfaceSolid }}>{label}</AppText></View>
  </AppPressable>;
}

export function IconButton({ label, onPress, symbol, disabled }: { label: string; onPress: () => void | Promise<void>; symbol: string; disabled?: boolean }) {
  const { colors } = useTheme();
  return <AppPressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[styles.icon, { backgroundColor: colors.surfaceInteractive, borderColor: colors.borderSubtle }]} pressedStyle={styles.pressed}>
    <View style={styles.center}><AppText variant="heading">{symbol}</AppText></View>
  </AppPressable>;
}

const styles = StyleSheet.create({
  tertiary: { minHeight: 48, borderRadius: radii.md }, destructive: { minHeight: 54, borderRadius: radii.md, overflow: 'hidden' }, icon: { width: 44, height: 44, borderRadius: radii.pill, borderWidth: StyleSheet.hairlineWidth },
  center: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md }, pressed: { opacity: 0.82 },
});
