import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { cancelAnimation, runOnJS, type SharedValue, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTabRoute } from '@/config/routes';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { useTabBarLayout } from '@/contexts/TabBarLayoutContext';
import { safelyRunHaptic } from '@/services/haptics';
import { getTabBarMetrics } from '@/services/tabBarMetrics';
import { clampTabIndex, createTabNavigationGate, performTabPress } from '@/services/tabNavigation';
import { recordUiAction } from '@/services/uiDiagnostics';
import { useRenderTracker } from '@/performance/renderTracker';
import { useTheme } from '@/theme/ThemeProvider';
import { motion, radii } from '@/theme/tokens';
import { AppIcon } from './AppIcon';
import { AppPressable } from './AppPressable';
import { AppText } from './AppText';
import { LiquidTabSlider } from './LiquidTabSlider';

let lastDragHapticAt = Number.NEGATIVE_INFINITY;

function triggerDragSelectionHaptic() {
  const now = Date.now();
  if (now - lastDragHapticAt < 70) return;
  lastDragHapticAt = now;
  void safelyRunHaptic('selection');
}

const TabItem = memo(function TabItem({ focused, label, icon, index, onSelect, onLongSelect }: { focused: boolean; label: string; icon: Parameters<typeof AppIcon>[0]['name']; index: number; onSelect: (index: number) => void; onLongSelect: (index: number) => void }) {
  const { colors } = useTheme();
  return <Pressable
    accessibilityRole="tab"
    accessibilityLabel={label}
    accessibilityState={{ selected: focused }}
    onPress={() => onSelect(index)}
    onLongPress={() => onLongSelect(index)}
    delayLongPress={420}
    style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
  >
    <View style={styles.itemInner}>
      <AppIcon name={icon} size={24} color={focused ? colors.greenBright : colors.textSecondary} />
      <AppText numberOfLines={1} style={[styles.label, { color: focused ? colors.textPrimary : colors.textMuted }]}>{label}</AppText>
    </View>
  </Pressable>;
});

function DraggableSurface({ children, width, count, activeIndex, position, reducedMotion, hapticsEnabled, onSelect }: { children: ReactNode; width: number; count: number; activeIndex: number; position: SharedValue<number>; reducedMotion: boolean; hapticsEnabled: boolean; onSelect: (index: number) => void }) {
  const lastHapticIndex = useSharedValue(activeIndex);
  const committed = useSharedValue(false);
  const pan = useMemo(() => Gesture.Pan()
    .minDistance(10)
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onBegin(() => {
      cancelAnimation(position);
      committed.set(false);
      lastHapticIndex.set(activeIndex);
    })
    .onUpdate((event) => {
      if (width <= 0) return;
      const raw = clampTabIndex(event.x / (width / count) - 0.5, count);
      position.set(raw);
      const nearest = Math.round(raw);
      if (hapticsEnabled && nearest !== lastHapticIndex.get()) {
        lastHapticIndex.set(nearest);
        runOnJS(triggerDragSelectionHaptic)();
      }
    })
    .onEnd(() => {
      if (committed.get()) return;
      committed.set(true);
      const nearest = clampTabIndex(Math.round(position.get()), count);
      position.set(reducedMotion ? nearest : withSpring(nearest, motion.spring.liquid));
      runOnJS(onSelect)(nearest);
    })
    .onFinalize((_event, success) => {
      if (!success) position.set(reducedMotion ? activeIndex : withSpring(activeIndex, motion.spring.soft));
    }), [activeIndex, committed, count, hapticsEnabled, lastHapticIndex, onSelect, position, reducedMotion, width]);
  return <GestureDetector gesture={pan}>{children}</GestureDetector>;
}

function LiquidTabBarComponent({ state, navigation }: BottomTabBarProps) {
  useRenderTracker('PremiumTabBar');
  const { colors, isDark } = useTheme();
  const { flags, resolvedPerformanceMode } = useFeatureFlags();
  const { setTabBarLayout } = useTabBarLayout();
  const insets = useSafeAreaInsets();
  const metrics = getTabBarMetrics(insets.bottom);
  const [width, setWidth] = useState(0);
  const [quick, setQuick] = useState<string | null>(null);
  const [allowNavigation] = useState(() => createTabNavigationGate());
  const activeIndex = state.index;
  const tabCount = state.routes.length;
  const position = useSharedValue(activeIndex);
  const reducedMotion = useReducedMotion();
  const pendingAnimationIndex = useRef<number | null>(null);

  useEffect(() => () => cancelAnimation(position), [position]);
  useEffect(() => {
    if (pendingAnimationIndex.current === activeIndex) {
      pendingAnimationIndex.current = null;
      return;
    }
    cancelAnimation(position);
    position.set(!flags.enableLiquidTabAnimation || reducedMotion ? activeIndex : withTiming(activeIndex, { duration: motion.tabMorph }));
  }, [activeIndex, flags.enableLiquidTabAnimation, position, reducedMotion]);

  const navigate = useCallback((index: number) => {
    const route = state.routes[index];
    if (!route) {
      recordUiAction('error_occurred', 'tab_route_missing', String(index));
      return 'missing' as const;
    }
    if (index === activeIndex) return 'unchanged' as const;
    if (!allowNavigation()) return 'blocked' as const;
    recordUiAction('navigation_requested', route.name);
    const result = performTabPress({
      routes: state.routes,
      activeIndex,
      targetIndex: index,
      emit: (route) => navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }),
      navigate: (route) => navigation.navigate(route.name, route.params),
    });
    if (result !== 'missing') recordUiAction('navigation_completed', route.name);
    return result;
  }, [activeIndex, allowNavigation, navigation, state.routes]);

  const selectTab = useCallback((index: number) => {
    if (index < 0 || index >= tabCount) return;
    const result = navigate(index);
    if (result !== 'navigated') return;
    pendingAnimationIndex.current = index;
    cancelAnimation(position);
    position.set(!flags.enableLiquidTabAnimation || reducedMotion ? index : withTiming(index, { duration: motion.tabMorph }));
    if (flags.enableHaptics) void safelyRunHaptic('selection');
  }, [flags.enableHaptics, flags.enableLiquidTabAnimation, navigate, position, reducedMotion, tabCount]);

  const selectDraggedTab = useCallback((index: number) => {
    const result = navigate(index);
    if (result === 'navigated') {
      pendingAnimationIndex.current = index;
      return;
    }
    cancelAnimation(position);
    position.set(reducedMotion ? activeIndex : withTiming(activeIndex, { duration: motion.tabMorph }));
  }, [activeIndex, navigate, position, reducedMotion]);

  const longSelectTab = useCallback((index: number) => {
    const route = state.routes[index];
    if (!route) return;
    navigation.emit({ type: 'tabLongPress', target: route.key });
    if (flags.enableHaptics) void safelyRunHaptic('light');
    setQuick(route.name);
  }, [flags.enableHaptics, navigation, state.routes]);

  const chooseQuick = useCallback(() => {
    const selected = quick;
    setQuick(null);
    const action = selected ? getTabRoute(selected)?.action : undefined;
    if (!action) return;
    recordUiAction('navigation_requested', action);
    router.push(action as never);
  }, [quick]);

  const onBarLayout = useCallback((event: Parameters<NonNullable<React.ComponentProps<typeof View>['onLayout']>>[0]) => {
    setWidth(event.nativeEvent.layout.width);
    setTabBarLayout(event.nativeEvent.layout.height, metrics.bottomOffset);
  }, [metrics.bottomOffset, setTabBarLayout]);
  const barThemeStyle = useMemo(() => ({ height: metrics.visualHeight, borderColor: colors.glassBorderStrong, backgroundColor: colors.surfaceStrong }), [colors.glassBorderStrong, colors.surfaceStrong, metrics.visualHeight]);
  const specularStyle = useMemo(() => ({ backgroundColor: `${colors.textPrimary}32` }), [colors.textPrimary]);

  const glassSurface = <View
    onLayout={onBarLayout}
    style={[styles.bar, barThemeStyle]}
  >
    {Platform.OS === 'ios' && flags.enableAdvancedGlassBlur ? <BlurView intensity={resolvedPerformanceMode === 'full' ? 30 : 18} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} /> : null}
    <LinearGradient colors={[`${colors.surfaceSolid}E8`, `${colors.greenDark}D8`]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
    <View style={[styles.specular, specularStyle]} />
    <View style={styles.visual}>
      {width > 0 && flags.enableLiquidTabAnimation ? <LiquidTabSlider position={position} barWidth={width} count={tabCount} /> : null}
      <View style={styles.row}>{state.routes.map((route, index) => {
        const item = getTabRoute(route.name) ?? getTabRoute('index')!;
        return <TabItem
          key={route.key}
          focused={activeIndex === index}
          label={item.title}
          icon={item.icon}
          index={index}
          onSelect={selectTab}
          onLongSelect={longSelectTab}
        />;
      })}</View>
    </View>
  </View>;

  return <>
    <View pointerEvents="box-none" style={[styles.host, { height: metrics.visualHeight, bottom: metrics.bottomOffset }]}>
      {flags.enableLiquidTabDrag
        ? <DraggableSurface width={width} count={tabCount} activeIndex={activeIndex} position={position} reducedMotion={reducedMotion} hapticsEnabled={flags.enableHaptics} onSelect={selectDraggedTab}>{glassSurface}</DraggableSurface>
        : glassSurface}
    </View>
    <Modal visible={quick !== null} transparent animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={() => setQuick(null)}>
      <Pressable style={[styles.scrim, { backgroundColor: colors.blackScrim }]} onPress={() => setQuick(null)} />
      <View style={[styles.quickSheet, { backgroundColor: colors.surfaceSolid, borderColor: colors.glassBorderStrong }]}>
        <AppText variant="caption" tone="green">БЫСТРОЕ ДЕЙСТВИЕ</AppText>
        <AppText variant="heading">{quick ? getTabRoute(quick)?.title : ''}</AppText>
        <AppPressable accessibilityRole="button" accessibilityLabel="Открыть быстрое действие" actionLabel="tab_quick_action" onPress={chooseQuick} haptic="selection" style={[styles.quickButton, { backgroundColor: colors.greenGlow }]}>
          <View style={styles.quickButtonContent}><AppText tone="green">Открыть</AppText></View>
        </AppPressable>
      </View>
    </Modal>
  </>;
}

export const LiquidTabBar = memo(LiquidTabBarComponent);

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 12, right: 12 },
  bar: { overflow: 'hidden', borderRadius: radii.xl, borderWidth: 1, shadowOpacity: 0.24, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  visual: { position: 'relative', flex: 1 },
  specular: { position: 'absolute', left: 22, right: 22, top: 1, height: StyleSheet.hairlineWidth, zIndex: 3 },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  item: { flex: 1, height: 58, minWidth: 0 },
  itemPressed: { opacity: 0.84 },
  itemInner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '600', maxWidth: '100%' },
  scrim: { ...StyleSheet.absoluteFillObject },
  quickSheet: { position: 'absolute', left: 18, right: 18, bottom: 24, borderRadius: radii.xl, borderWidth: 1, padding: 20, gap: 12 },
  quickButton: { minHeight: 48, borderRadius: radii.md, overflow: 'hidden' },
  quickButtonContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
