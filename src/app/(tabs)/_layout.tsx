import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { PremiumTabBar } from '@/components/PremiumTabBar';
import { TAB_ROUTES } from '@/config/routes';
import { TabBarLayoutProvider } from '@/contexts/TabBarLayoutContext';
import { createSectionErrorBoundary } from '@/components/ScreenErrorFallback';

export const ErrorBoundary = createSectionErrorBoundary('TabsLayout');

const screenOptions = { headerShown: false, lazy: true } as const;
const renderTabBar = (props: BottomTabBarProps) => <PremiumTabBar {...props} />;

export default function TabsLayout() {
  return <TabBarLayoutProvider>
    <Tabs tabBar={renderTabBar} screenOptions={screenOptions}>
      {TAB_ROUTES.map((item) => <Tabs.Screen key={item.key} name={item.key} options={{ title: item.title }} />)}
    </Tabs>
  </TabBarLayoutProvider>;
}
