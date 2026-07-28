import { sizes } from '../theme/tokens';

export function getTabBarMetrics(bottomInset: number) {
  const safeBottom = Math.max(bottomInset, 6);
  return { bottom: 0, paddingBottom: safeBottom, height: sizes.tabBarBase + safeBottom };
}
export function getTabContentPadding(bottomInset:number){return getTabBarMetrics(bottomInset).height+18;}
