import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from './AppText';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

interface Props { label: string; value: number; unit: string; min: number; max: number; onChange: (value: number) => void; }
export function NumberStepper({ label, value, unit, min, max, onChange }: Props) {
  const { colors } = useTheme();
  const update = (next: number) => { void Haptics.selectionAsync(); onChange(Math.min(max, Math.max(min, next))); };
  return (
    <View style={styles.block}>
      <AppText tone="secondary">{label}</AppText>
      <View style={[styles.control, { backgroundColor: colors.surfaceStrong, borderColor: colors.glassBorder }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Уменьшить ${label}`} onPress={() => update(value - 1)} style={[styles.button, { backgroundColor: colors.greenDark }]}><AppText variant="heading">−</AppText></Pressable>
        <View style={styles.valueWrap}>
          <TextInput accessibilityLabel={label} keyboardType="number-pad" selectTextOnFocus value={String(value)}
            onChangeText={(text) => { const next = Number(text.replace(/\D/g, '')); if (Number.isFinite(next) && next > 0) onChange(Math.min(max, Math.max(min, next))); }} style={[styles.input, { color: colors.textPrimary }]} />
          <AppText variant="caption" tone="secondary">{unit}</AppText>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Увеличить ${label}`} onPress={() => update(value + 1)} style={[styles.button, { backgroundColor: colors.greenDark }]}><AppText variant="heading">+</AppText></Pressable>
      </View>
      <AppText variant="caption" tone="muted">Допустимый диапазон: {min}–{max} {unit}</AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  block: { gap: spacing.sm }, control: { minHeight: 84, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radii.lg, borderWidth: 1, padding: spacing.sm },
  button: { width: 56, height: 56, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  valueWrap: { alignItems: 'center' }, input: { minWidth: 92, fontSize: 34, fontWeight: '800', textAlign: 'center', padding: 0 },
});
