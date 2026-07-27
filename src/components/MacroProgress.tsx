import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radii, spacing } from '@/theme/tokens';

export function MacroProgress({ label, value, target, color = colors.greenPrimary }: { label: string; value: number; target: number; color?: string }) {
  const ratio = target > 0 ? Math.min(value / target, 1) : 0;
  return <View style={styles.block}>
    <View style={styles.row}><AppText variant="caption" tone="secondary">{label}</AppText><AppText variant="caption">{Math.round(value)} / {Math.round(target)} г</AppText></View>
    <View style={styles.track}><View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: color }]} /></View>
  </View>;
}

const styles = StyleSheet.create({ block: { flex: 1, minWidth: 88, gap: spacing.xs }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs }, track: { height: 6, borderRadius: radii.pill, backgroundColor: colors.greenDark, overflow: 'hidden' }, fill: { height: '100%', borderRadius: radii.pill } });
