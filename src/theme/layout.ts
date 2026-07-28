import { sizes } from './sizes';

export function getScreenHorizontalPadding(width: number) {
  return width < 360 ? sizes.screenHorizontalCompact : sizes.screenHorizontal;
}

export function getHomeLayout(width: number) {
  const compact = width < 375;
  const horizontalPadding = getScreenHorizontalPadding(width);
  return {
    compact,
    horizontalPadding,
    heroHorizontal: width < 430,
    heroHeight: compact ? 276 : 292,
    quickActionColumns: 2 as const,
  };
}
