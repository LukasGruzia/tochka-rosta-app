import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { IconName } from './AppIcon';
import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { GlassSurface } from './GlassSurface';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';

export interface HomeQuickAction { icon: IconName; label: string; onPress: () => void; }

function HomeQuickActionsComponent({ actions }: { actions: HomeQuickAction[] }) {
  const { colors } = useTheme();
  return <View style={styles.grid}>{actions.map((action) => <GlassSurface key={action.label} variant="interactive" accessibilityLabel={action.label} onPress={action.onPress} style={styles.item} contentStyle={styles.content}>
    <View style={[styles.icon, { backgroundColor: colors.greenGlow }]}><AppIcon name={action.icon} size={24} color={colors.greenBright} /></View>
    <AppText style={styles.label} numberOfLines={2}>{action.label}</AppText>
  </GlassSurface>)}</View>;
}

export const HomeQuickActions = memo(HomeQuickActionsComponent);

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  item: { width: '48%', flexGrow: 1, minWidth: 136, minHeight: 78, borderRadius: radii.md },
  content: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { width: 42, height: 42, flexShrink: 0, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontWeight: '700', fontSize: 14, lineHeight: 18 },
});
