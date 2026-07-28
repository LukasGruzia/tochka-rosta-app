import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('avatar and tab polish regressions', () => {
  it('uses one shared profile hook on Home and Profile', () => {
    expect(read('src/components/HomeHeader.tsx')).toContain('useUserProfile()');
    expect(read('src/app/(tabs)/profile.tsx')).toContain('useUserProfile()');
    expect(read('src/hooks/useUserProfile.ts')).toContain('state.profile');
  });

  it('keeps initials under Expo Image and uses a stable memory-disk cache key', () => {
    const avatar = read('src/components/UserAvatar.tsx');
    expect(avatar.indexOf('<AppText')).toBeLessThan(avatar.indexOf('<Image'));
    expect(avatar).toContain('cachePolicy="memory-disk"');
    expect(avatar).toContain('cacheKey: cacheKey ?? uri');
  });

  it('persists a new file before updating SQLite-backed profile state', () => {
    const picker = read('src/components/AvatarPicker.tsx');
    expect(picker.indexOf('nextUri = await persistAvatar(sourceUri)')).toBeLessThan(picker.indexOf('await onChange(nextUri)'));
    expect(read('src/store/appStore.ts')).toContain('await updateProfileAvatar(uri)');
  });

  it('animates the slider only with transform and opacity', () => {
    const indicator = read('src/components/LiquidTabIndicator.tsx');
    const worklet = indicator.slice(indicator.indexOf('useAnimatedStyle'), indicator.indexOf('return <Animated.View'));
    expect(worklet).toContain('translateX');
    expect(worklet).toContain('scaleX');
    expect(worklet).toContain('opacity');
    expect(worklet).not.toContain('scaleY');
    expect(worklet).not.toMatch(/\b(width|left|backgroundColor|borderWidth|shadowRadius):/);
  });

  it('uses one cancellable route animation and one navigation call', () => {
    const tabBar = read('src/components/LiquidTabBar.tsx');
    expect(tabBar).toContain('pendingAnimationIndex');
    expect(tabBar).toContain('cancelAnimation(position)');
    expect(tabBar.match(/navigation\.navigate/g)).toHaveLength(1);
    expect(tabBar).not.toContain('const proximity = useAnimatedStyle');
    expect(tabBar).toContain('memo(LiquidTabBarComponent)');
  });

  it('shows the catalog shell before a paginated SQLite request', () => {
    const catalog = read('src/app/(tabs)/catalog.tsx');
    expect(catalog).toContain('InteractionManager.runAfterInteractions');
    expect(catalog).toContain('motion.tabDataDelay');
    expect(catalog).toContain('limit: PRODUCT_PAGE_SIZE');
    expect(catalog).toContain('<FlatList');
    expect(catalog).toContain('<CatalogSkeleton');
  });

  it('uses a short fade and disables it together with reduced tab motion', () => {
    const layout = read('src/app/(tabs)/_layout.tsx');
    expect(layout).toContain("flags.enableLiquidTabAnimation ? 'fade'");
    expect(layout).toContain("'none'");
    expect(layout).toContain('duration: motion.screenFade');
  });
});
