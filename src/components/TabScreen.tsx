import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTabBarLayout } from '@/contexts/TabBarLayoutContext';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { AppBackground } from './AppBackground';
import { AppText } from './AppText';

interface Props extends PropsWithChildren {
  title?: string;
  subtitle?: string;
  headerRight?: ReactNode;
  collapsible?: boolean;
}

export function TabScreen({ title, subtitle, headerRight, children }: Props) {
  const { contentInset } = useTabBarLayout();
  const { colors } = useTheme();
  return <AppBackground><SafeAreaView style={styles.safe} edges={['top']}>
    {title ? <View style={[styles.header, { backgroundColor: colors.backgroundPrimary, borderBottomColor: colors.glassBorder }]}>
      <View style={styles.copy}><AppText variant="title">{title}</AppText>{subtitle ? <AppText tone="secondary">{subtitle}</AppText> : null}</View>
      {headerRight}
    </View> : null}
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scroll, { paddingBottom: contentInset }]}>
      {children}
    </ScrollView>
  </SafeAreaView></AppBackground>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  copy: { flex: 1, gap: 4 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
});
