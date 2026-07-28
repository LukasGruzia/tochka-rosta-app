import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { GlassCard } from './GlassCard';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { safelyRunHaptic } from '@/services/haptics';

interface Props { title: string; description?: string; selected: boolean; onPress: () => void; }
export function ChoiceCard({ title, description, selected, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <GlassCard variant="interactive" selected={selected} accessibilityLabel={`${title}${selected ? ', выбрано' : ''}`}
      onPress={() => { void safelyRunHaptic('selection'); onPress(); }} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.copy}><AppText style={styles.title}>{title}</AppText>{description ? <AppText variant="caption" tone="secondary">{description}</AppText> : null}</View>
        <View style={[styles.check, { borderColor: selected ? colors.greenBright : colors.glassBorder, backgroundColor: selected ? colors.greenPrimary : colors.transparent }]}>{selected ? <AppText style={[styles.checkText, { color: colors.backgroundPrimary }]}>✓</AppText> : null}</View>
      </View>
    </GlassCard>
  );
}
const styles = StyleSheet.create({
  card: { borderRadius: radii.md }, row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, copy: { flex: 1, gap: 4 }, title: { fontWeight: '700' },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, checkText: { fontWeight: '900', lineHeight: 18 },
});
