export function clampTabIndex(index: number, count: number) {
  return Math.max(0, Math.min(Math.max(0, count - 1), index));
}

export function getTabIndexFromPosition(x: number, width: number, count: number) {
  if (count <= 0 || width <= 0) return 0;
  return clampTabIndex(Math.floor(x / (width / count)), count);
}

export function getTabIndicatorMetrics(index: number, width: number, count: number, stretch = 0) {
  const itemWidth = count > 0 ? width / count : 0;
  const capsuleWidth = Math.max(44, Math.min(68, itemWidth - 10));
  return { x: itemWidth * clampTabIndex(index, count) + (itemWidth - capsuleWidth) / 2, width: capsuleWidth + Math.min(18, Math.abs(stretch)) };
}

export function shouldActivateTabDrag(dx: number, dy: number) {
  return Math.abs(dx) >= 8 && Math.abs(dx) > Math.abs(dy) * 1.25;
}
