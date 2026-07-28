import { Pressable, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function FilterChip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
    style={({ pressed }) => [styles.chip, { borderColor: selected ? colors.glassBorderStrong : colors.glassBorder, backgroundColor: selected ? colors.greenGlow : colors.surface }, pressed && styles.pressed]}>
    <AppText variant="caption" tone={selected ? 'green' : 'secondary'} style={styles.label}>{label}</AppText>
  </Pressable>;
}

const styles = StyleSheet.create({
  chip: { minHeight: 38, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radii.pill, borderWidth: 1 },
  pressed: { opacity: 0.75 }, label: { fontWeight: '700' },
});
