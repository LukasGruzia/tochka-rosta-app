import { useMemo } from 'react';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { PremiumTabBar } from '@/components/PremiumTabBar';
import { TAB_ROUTES } from '@/config/routes';
import { TabBarLayoutProvider } from '@/contexts/TabBarLayoutContext';
import { createSectionErrorBoundary } from '@/components/ScreenErrorFallback';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { motion } from '@/theme/tokens';

export const ErrorBoundary = createSectionErrorBoundary('TabsLayout');

const renderTabBar = (props: BottomTabBarProps) => <PremiumTabBar {...props} />;

export default function TabsLayout() {
  const { flags } = useFeatureFlags();
  const screenOptions = useMemo(() => ({
    headerShown: false,
    lazy: true,
    animation: flags.enableLiquidTabAnimation ? 'fade' as const : 'none' as const,
    transitionSpec: { animation: 'timing' as const, config: { duration: motion.screenFade } },
  }), [flags.enableLiquidTabAnimation]);
  return <TabBarLayoutProvider>
    <Tabs tabBar={renderTabBar} screenOptions={screenOptions}>
      {TAB_ROUTES.map((item) => <Tabs.Screen key={item.key} name={item.key} options={{ title: item.title }} />)}
    </Tabs>
  </TabBarLayoutProvider>;
}
