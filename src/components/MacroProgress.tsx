import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function MacroProgress({ label, value, target, color, compact = false }: { label: string; value: number; target: number; color?: string; compact?: boolean }) {
  const { colors } = useTheme();
  const fillColor = color ?? colors.greenPrimary;
  const ratio = target > 0 ? Math.min(value / target, 1) : 0;
  return <View style={styles.block}>
    <View style={[styles.row, compact && styles.compactRow]}><AppText variant="caption" tone="secondary" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>{label}</AppText><AppText variant="caption" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{Math.round(value)} / {Math.round(target)} г</AppText></View>
    <View style={[styles.track, { backgroundColor: colors.greenDark }]}><View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: fillColor }]} /></View>
  </View>;
}

const styles = StyleSheet.create({ block: { flex: 1, minWidth: 0, gap: spacing.xs }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs }, compactRow: { flexDirection: 'column', gap: 1 }, track: { height: 6, borderRadius: radii.pill, overflow: 'hidden' }, fill: { height: '100%', borderRadius: radii.pill } });
