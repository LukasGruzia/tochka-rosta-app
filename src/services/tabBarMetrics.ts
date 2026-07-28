import { sizes } from '../theme/tokens';

export function getTabBarMetrics(bottomInset: number) {
  const bottomOffset = Math.max(bottomInset - 4, 8);
  const visualHeight = Math.min(sizes.tabBarVisual, sizes.tabBarMax);
  const occupiedHeight = visualHeight + bottomOffset;
  return { bottomOffset, visualHeight, occupiedHeight, contentInset: occupiedHeight + 20 };
}
export function getTabContentPadding(bottomInset: number) { return getTabBarMetrics(bottomInset).contentInset; }
