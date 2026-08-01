import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppBackButton } from './AppBackButton';
import { AppText } from './AppText';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export function AppScreenHeader({ title, subtitle, showBack = false, fallbackRoute, right }: { title: string; subtitle?: string; showBack?: boolean; fallbackRoute?: string; right?: ReactNode }) {
  const { colors } = useTheme();
  return <View style={[styles.header, { backgroundColor: colors.backgroundPrimary, borderBottomColor: colors.glassBorder }]}>
    {showBack ? <AppBackButton fallbackRoute={fallbackRoute} /> : null}
    <View style={styles.copy}><AppText variant="title">{title}</AppText>{subtitle ? <AppText tone="secondary">{subtitle}</AppText> : null}</View>
    {right ? <View style={styles.right}>{right}</View> : showBack ? <View style={styles.balance} /> : null}
  </View>;
}

const styles = StyleSheet.create({ header: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth }, copy: { flex: 1, gap: 4 }, right: { minWidth: 44, alignItems: 'flex-end' }, balance: { width: 44 } });
