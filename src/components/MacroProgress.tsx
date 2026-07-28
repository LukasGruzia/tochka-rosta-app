import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function MacroProgress({ label, value, target, color }: { label: string; value: number; target: number; color?: string }) {
  const { colors } = useTheme();
  const fillColor = color ?? colors.greenPrimary;
  const ratio = target > 0 ? Math.min(value / target, 1) : 0;
  return <View style={styles.block}>
    <View style={styles.row}><AppText variant="caption" tone="secondary">{label}</AppText><AppText variant="caption">{Math.round(value)} / {Math.round(target)} г</AppText></View>
    <View style={[styles.track, { backgroundColor: colors.greenDark }]}><View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: fillColor }]} /></View>
  </View>;
}

const styles = StyleSheet.create({ block: { flex: 1, minWidth: 88, gap: spacing.xs }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs }, track: { height: 6, borderRadius: radii.pill, overflow: 'hidden' }, fill: { height: '100%', borderRadius: radii.pill } });
