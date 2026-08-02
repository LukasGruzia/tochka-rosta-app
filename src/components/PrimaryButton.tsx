import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppPressable } from './AppPressable';
import { AppText } from './AppText';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

interface Props { label: string; onPress: () => void | Promise<void>; disabled?: boolean; loading?: boolean; secondary?: boolean; accessibilityLabel?: string; }
export function PrimaryButton({ label, onPress, disabled, loading = false, secondary, accessibilityLabel }: Props) {
  const { colors } = useTheme();
  return (
    <AppPressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ disabled: Boolean(disabled || loading), busy: loading }} actionLabel={label} disabled={disabled} loading={loading} onPress={onPress} haptic="light"
      onError={(error) => Alert.alert('Не удалось выполнить действие', error instanceof Error ? error.message : 'Попробуй ещё раз.')}
      style={styles.wrapper} pressedStyle={styles.pressed}>
      {secondary ? <View style={[styles.secondary, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>{loading ? <ActivityIndicator color={colors.textPrimary} /> : null}<AppText style={styles.label}>{label}</AppText></View> :
        <LinearGradient colors={[colors.greenBright, colors.greenPrimary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
          {loading ? <ActivityIndicator color={colors.backgroundPrimary} /> : null}
          <AppText style={[styles.darkLabel, { color: colors.backgroundPrimary }]}>{label}</AppText>
        </LinearGradient>}
    </AppPressable>
  );
}
const styles = StyleSheet.create({
  wrapper: { minHeight: 54, borderRadius: radii.md, overflow: 'hidden' }, primary: { minHeight: 54, flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  secondary: { minHeight: 52, flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, borderWidth: 1, borderRadius: radii.md },
  label: { fontWeight: '700' }, darkLabel: { fontWeight: '800' }, pressed: { opacity: 0.9 },
});
