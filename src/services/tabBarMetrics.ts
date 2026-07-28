import { sizes } from '../theme/tokens';

export function getTabBarMetrics(bottomInset: number) {
  const safeBottom = Math.max(bottomInset, 6);
  return { bottom: 0, safeAreaHeight: safeBottom, visualHeight: sizes.tabBarVisual, height: sizes.tabBarVisual + safeBottom };
}
export function getTabContentPadding(bottomInset:number){return getTabBarMetrics(bottomInset).height+18;}
