import { Tabs } from 'expo-router';
import { PremiumTabBar } from '@/components/PremiumTabBar';
import { TAB_ROUTES } from '@/config/routes';
import { TabBarLayoutProvider } from '@/contexts/TabBarLayoutContext';

export default function TabsLayout() {
  return <TabBarLayoutProvider>
    <Tabs tabBar={(props) => <PremiumTabBar {...props} />} screenOptions={{ headerShown: false }}>
      {TAB_ROUTES.map((item) => <Tabs.Screen key={item.key} name={item.key} options={{ title: item.title }} />)}
    </Tabs>
  </TabBarLayoutProvider>;
}
