import { sizes } from '../theme/tokens';

export function getTabBarMetrics(bottomInset: number) {
  const safeBottom = Math.max(bottomInset, 6);
  return { bottom: safeBottom, paddingBottom: safeBottom, height: sizes.tabBarBase + safeBottom };
}
