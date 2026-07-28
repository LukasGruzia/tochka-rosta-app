import { StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { GlassCard } from './GlassCard';
import { spacing } from '@/theme/tokens';

export function ProfileStatCard({ value, label }: { value: string | number; label: string }) {
  return <GlassCard variant="compact" style={styles.root}><AppText variant="heading">{value}</AppText><AppText variant="caption" tone="secondary">{label}</AppText></GlassCard>;
}

const styles = StyleSheet.create({ root: { flex: 1, minWidth: 98, gap: spacing.xs } });
