import { useEffect, useState, type ReactNode } from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, type SharedValue, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTabRoute } from '@/config/routes';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { useTabBarLayout } from '@/contexts/TabBarLayoutContext';
import { safelyRunHaptic } from '@/services/haptics';
import { getTabBarMetrics } from '@/services/tabBarMetrics';
import { clampTabIndex, performTabPress } from '@/services/tabNavigation';
import { recordUiAction } from '@/services/uiDiagnostics';
import { useTheme } from '@/theme/ThemeProvider';
import { motion, radii } from '@/theme/tokens';
import { AppIcon } from './AppIcon';
import { AppPressable } from './AppPressable';
import { AppText } from './AppText';
import { LiquidTabIndicator } from './LiquidTabIndicator';

function triggerSelectionHaptic() {
  void safelyRunHaptic('selection');
}

function TabItem({ focused, label, icon, onPress, onLongPress }: { focused: boolean; label: string; icon: Parameters<typeof AppIcon>[0]['name']; onPress: () => void; onLongPress: () => void }) {
  const { colors } = useTheme();
  return <AppPressable
    accessibilityRole="tab"
    accessibilityLabel={label}
    accessibilityState={{ selected: focused }}
    actionLabel={`tab:${label}`}
    onPress={onPress}
    onLongPress={onLongPress}
    delayLongPress={420}
    haptic="selection"
    style={styles.item}
    pressedStyle={styles.itemPressed}
  >
    <View style={styles.itemInner}>
      <AppIcon name={icon} size={24} color={focused ? colors.greenBright : colors.textSecondary} />
      <AppText numberOfLines={1} style={[styles.label, { color: focused ? colors.textPrimary : colors.textMuted }]}>{label}</AppText>
    </View>
  </AppPressable>;
}

function DraggableSurface({ children, width, count, activeIndex, position, reducedMotion, onSelect }: { children: ReactNode; width: number; count: number; activeIndex: number; position: SharedValue<number>; reducedMotion: boolean; onSelect: (index: number) => void }) {
  'use no memo';
  const lastHapticIndex = useSharedValue(activeIndex);
  const committed = useSharedValue(false);
  const pan = Gesture.Pan()
    .minDistance(10)
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onBegin(() => {
      committed.set(false);
      lastHapticIndex.set(activeIndex);
    })
    .onUpdate((event) => {
      if (width <= 0) return;
      const raw = clampTabIndex(event.x / (width / count) - 0.5, count);
      position.set(raw);
      const nearest = Math.round(raw);
      if (nearest !== lastHapticIndex.get()) {
        lastHapticIndex.set(nearest);
        runOnJS(triggerSelectionHaptic)();
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
    });
  return <GestureDetector gesture={pan}>{children}</GestureDetector>;
}

export function LiquidTabBar({ state, navigation }: BottomTabBarProps) {
  'use no memo';
  const { colors, isDark } = useTheme();
  const { flags } = useFeatureFlags();
  const { setTabBarHeight } = useTabBarLayout();
  const insets = useSafeAreaInsets();
  const metrics = getTabBarMetrics(insets.bottom);
  const [width, setWidth] = useState(0);
  const [quick, setQuick] = useState<string | null>(null);
  const activeIndex = state.index;
  const tabCount = state.routes.length;
  const position = useSharedValue(activeIndex);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    position.set(!flags.enableLiquidTabAnimation || reducedMotion ? activeIndex : withSpring(activeIndex, motion.spring.liquid));
  }, [activeIndex, flags.enableLiquidTabAnimation, position, reducedMotion]);

  const navigate = (index: number) => {
    const route = state.routes[index];
    if (!route) {
      recordUiAction('error_occurred', 'tab_route_missing', String(index));
      return;
    }
    recordUiAction('navigation_requested', route.name);
    const result = performTabPress({
      routes: state.routes,
      activeIndex,
      targetIndex: index,
      emit: (route) => navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }),
      navigate: (route) => navigation.navigate(route.name, route.params),
    });
    if (result !== 'missing') recordUiAction('navigation_completed', route.name);
  };

  const selectTab = (index: number) => {
    if (index < 0 || index >= tabCount) return;
    position.set(!flags.enableLiquidTabAnimation || reducedMotion ? index : withTiming(index, { duration: motion.tabMorph }));
    navigate(index);
  };

  const chooseQuick = () => {
    const selected = quick;
    setQuick(null);
    const action = selected ? getTabRoute(selected)?.action : undefined;
    if (!action) return;
    recordUiAction('navigation_requested', action);
    router.push(action as never);
  };

  const glassSurface = <View
    onLayout={(event) => {
      setWidth(event.nativeEvent.layout.width);
      setTabBarHeight(event.nativeEvent.layout.height);
    }}
    style={[styles.bar, { height: metrics.height, borderColor: colors.glassBorderStrong, backgroundColor: colors.surfaceStrong }]}
  >
    {Platform.OS === 'ios' && flags.enableAdvancedGlassBlur ? <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} /> : null}
    <LinearGradient colors={[`${colors.surfaceSolid}E8`, `${colors.greenDark}D8`]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
    <View style={[styles.specular, { backgroundColor: `${colors.textPrimary}32` }]} />
    <View style={[styles.visual, { height: metrics.visualHeight }]}>
      {width > 0 && flags.enableLiquidTabAnimation ? <LiquidTabIndicator position={position} barWidth={width} count={tabCount} /> : null}
      <View style={styles.row}>{state.routes.map((route, index) => {
        const item = getTabRoute(route.name) ?? getTabRoute('index')!;
        return <TabItem
          key={route.key}
          focused={activeIndex === index}
          label={item.title}
          icon={item.icon}
          onPress={() => selectTab(index)}
          onLongPress={() => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
            void safelyRunHaptic('light');
            setQuick(route.name);
          }}
        />;
      })}</View>
    </View>
    <View pointerEvents="none" style={{ height: metrics.safeAreaHeight }} />
  </View>;

  return <>
    <View pointerEvents="box-none" style={[styles.host, { height: metrics.height }]}>
      {flags.enableLiquidTabDrag
        ? <DraggableSurface width={width} count={tabCount} activeIndex={activeIndex} position={position} reducedMotion={reducedMotion} onSelect={selectTab}>{glassSurface}</DraggableSurface>
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

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 10, right: 10, bottom: 0 },
  bar: { overflow: 'hidden', borderRadius: radii.xl, borderWidth: 1, shadowOpacity: 0.24, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  visual: { position: 'relative' },
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
