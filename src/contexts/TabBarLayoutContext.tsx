import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { sizes } from '@/theme/tokens';

interface TabBarLayoutValue {
  tabBarHeight: number;
  bottomOffset: number;
  contentInset: number;
  setTabBarLayout: (height: number, bottomOffset: number) => void;
}

const defaultBottomOffset = 8;
const TabBarLayoutContext = createContext<TabBarLayoutValue>({ tabBarHeight: sizes.tabBarVisual, bottomOffset: defaultBottomOffset, contentInset: sizes.tabBarVisual + defaultBottomOffset + 20, setTabBarLayout: () => {} });

export function TabBarLayoutProvider({ children }: PropsWithChildren) {
  const [layout, updateLayout] = useState<{ tabBarHeight: number; bottomOffset: number }>({ tabBarHeight: sizes.tabBarVisual, bottomOffset: defaultBottomOffset });
  const setTabBarLayout = useCallback((height: number, bottomOffset: number) => {
    if (!Number.isFinite(height) || height <= 0 || !Number.isFinite(bottomOffset)) return;
    const next = { tabBarHeight: Math.round(height), bottomOffset: Math.max(0, Math.round(bottomOffset)) };
    updateLayout((current) => current.tabBarHeight === next.tabBarHeight && current.bottomOffset === next.bottomOffset ? current : next);
  }, []);
  const value = useMemo(() => ({ ...layout, contentInset: layout.tabBarHeight + layout.bottomOffset + 20, setTabBarLayout }), [layout, setTabBarLayout]);
  return <TabBarLayoutContext.Provider value={value}>{children}</TabBarLayoutContext.Provider>;
}

export function useTabBarLayout() {
  return useContext(TabBarLayoutContext);
}
