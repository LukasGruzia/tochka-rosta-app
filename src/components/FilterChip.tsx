import { Pressable, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, radii, spacing } from '@/theme/tokens';

export function FilterChip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
    style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}>
    <AppText variant="caption" tone={selected ? 'green' : 'secondary'} style={styles.label}>{label}</AppText>
  </Pressable>;
}

const styles = StyleSheet.create({
  chip: { minHeight: 38, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.surface },
  selected: { borderColor: colors.glassBorderStrong, backgroundColor: colors.greenGlow },
  pressed: { opacity: 0.75 }, label: { fontWeight: '700' },
});
