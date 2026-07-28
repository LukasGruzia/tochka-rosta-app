import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { GlassCard } from './GlassCard';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function ProfileMenuSection({ title, children }: PropsWithChildren<{ title: string }>) {
  return <View style={styles.section}><AppText variant="caption" tone="muted" style={styles.title}>{title.toUpperCase()}</AppText><GlassCard variant="compact">{children}</GlassCard></View>;
}

export function ProfileMenuRow({ icon, label, value, danger, onPress }: { icon: string; label: string; value?: string; danger?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, { borderBottomColor: colors.glassBorder }, pressed && styles.pressed]}>
    <View style={[styles.icon, { backgroundColor: danger ? `${colors.danger}22` : colors.greenGlow }]}><AppText>{icon}</AppText></View>
    <AppText style={[styles.label, danger && { color: colors.danger }]}>{label}</AppText>
    {value ? <AppText variant="caption" tone="muted">{value}</AppText> : null}
    <AppText tone="muted" style={styles.chevron}>›</AppText>
  </Pressable>;
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs }, title: { paddingLeft: spacing.sm, letterSpacing: 0.7 },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  icon: { width: 34, height: 34, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' }, label: { flex: 1, fontWeight: '600' },
  chevron: { fontSize: 25, marginLeft: 2 }, pressed: { opacity: 0.62 },
});
