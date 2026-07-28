import { describe, expect, it } from 'vitest';
import { getHomeLayout, getScreenHorizontalPadding } from './layout';

describe('responsive premium layout', () => {
  it('keeps compact iPhones readable without horizontal overflow', () => {
    expect(getScreenHorizontalPadding(320)).toBe(16);
    expect(getHomeLayout(320)).toMatchObject({ compact: true, heroHorizontal: true, quickActionColumns: 2 });
  });

  it('uses the standard premium gutter on wider phones', () => {
    expect(getScreenHorizontalPadding(430)).toBe(20);
    expect(getHomeLayout(430).compact).toBe(false);
  });
});
