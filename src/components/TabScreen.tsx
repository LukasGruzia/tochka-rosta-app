import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSegments } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTabBarLayout } from '@/contexts/TabBarLayoutContext';
import { spacing } from '@/theme/tokens';
import { AppBackground } from './AppBackground';
import { AppScreenHeader } from './AppScreenHeader';

interface Props extends PropsWithChildren {
  title?: string;
  subtitle?: string;
  headerRight?: ReactNode;
  collapsible?: boolean;
  showBack?: boolean;
  fallbackRoute?: string;
}

export function TabScreen({ title, subtitle, headerRight, showBack, fallbackRoute, children }: Props) {
  const { contentInset } = useTabBarLayout();
  const segments = useSegments();
  const isRootTab = segments[0] === '(tabs)';
  const shouldShowBack = showBack ?? !isRootTab;
  return <AppBackground><SafeAreaView style={styles.safe} edges={['top']}>
    {title ? <AppScreenHeader title={title} subtitle={subtitle} showBack={shouldShowBack} fallbackRoute={fallbackRoute} right={isRootTab ? headerRight : undefined} /> : null}
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scroll, { paddingBottom: contentInset }]}>
      {children}
    </ScrollView>
  </SafeAreaView></AppBackground>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
});
