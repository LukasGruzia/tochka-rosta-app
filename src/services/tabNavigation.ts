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
export function resolveTabGesture(activeIndex:number,x:number,width:number,count:number,cancelled=false){return cancelled?clampTabIndex(activeIndex,count):getTabIndexFromPosition(x,width,count);}

export function shouldCommitTabNavigation(alreadyCommitted: boolean) {
  return !alreadyCommitted;
}

export function performTabPress<T extends { key: string; name: string }>(input: {
  routes: readonly T[];
  activeIndex: number;
  targetIndex: number;
  emit: (route: T) => { defaultPrevented?: boolean };
  navigate: (route: T) => void;
}) {
  const route = input.routes[input.targetIndex];
  if (!route) return 'missing' as const;
  const event = input.emit(route);
  if (input.activeIndex === input.targetIndex || event.defaultPrevented) return 'unchanged' as const;
  input.navigate(route);
  return 'navigated' as const;
}
