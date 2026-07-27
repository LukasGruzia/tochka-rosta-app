import { StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from './AppText';
import { GlassCard } from './GlassCard';
import { colors, radii, spacing } from '@/theme/tokens';

interface Props { title: string; description?: string; selected: boolean; onPress: () => void; }
export function ChoiceCard({ title, description, selected, onPress }: Props) {
  return (
    <GlassCard variant="interactive" selected={selected} accessibilityLabel={`${title}${selected ? ', выбрано' : ''}`}
      onPress={() => { void Haptics.selectionAsync(); onPress(); }} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.copy}><AppText style={styles.title}>{title}</AppText>{description ? <AppText variant="caption" tone="secondary">{description}</AppText> : null}</View>
        <View style={[styles.check, selected && styles.checkSelected]}>{selected ? <AppText style={styles.checkText}>✓</AppText> : null}</View>
      </View>
    </GlassCard>
  );
}
const styles = StyleSheet.create({
  card: { borderRadius: radii.md }, row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, copy: { flex: 1, gap: 4 }, title: { fontWeight: '700' },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center', justifyContent: 'center' },
  checkSelected: { backgroundColor: colors.greenPrimary, borderColor: colors.greenBright }, checkText: { color: colors.backgroundPrimary, fontWeight: '900', lineHeight: 18 },
});
