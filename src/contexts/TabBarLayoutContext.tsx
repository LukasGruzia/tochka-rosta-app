import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { sizes } from '@/theme/tokens';

interface TabBarLayoutValue {
  tabBarHeight: number;
  setTabBarHeight: (height: number) => void;
}

const TabBarLayoutContext = createContext<TabBarLayoutValue>({ tabBarHeight: sizes.tabBarVisual + 6, setTabBarHeight: () => {} });

export function TabBarLayoutProvider({ children }: PropsWithChildren) {
  const [tabBarHeight, updateHeight] = useState(sizes.tabBarVisual + 6);
  const setTabBarHeight = useCallback((height: number) => {
    if (Number.isFinite(height) && height > 0) updateHeight(Math.round(height));
  }, []);
  const value = useMemo(() => ({ tabBarHeight, setTabBarHeight }), [setTabBarHeight, tabBarHeight]);
  return <TabBarLayoutContext.Provider value={value}>{children}</TabBarLayoutContext.Provider>;
}

export function useTabBarLayout() {
  return useContext(TabBarLayoutContext);
}
