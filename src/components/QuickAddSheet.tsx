import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { router } from 'expo-router';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, runOnJS, type SharedValue, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { copyYesterdayMeal, repeatMostRecentMeal } from '@/database/repositories/diaryRepository';
import { getSetting, setSetting } from '@/database/repositories/settingsRepository';
import { safelyRunHaptic } from '@/services/haptics';
import { prioritizeQuickActions, type QuickAddAction } from '@/services/quickAdd';
import { getSmartNextStep } from '@/services/smartNextStep';
import { recordUiAction } from '@/services/uiDiagnostics';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme/ThemeProvider';
import { motion, radii, spacing } from '@/theme/tokens';
import type { MealType } from '@/types/domain';
import { AppPressable } from './AppPressable';
import { AppText } from './AppText';

export function QuickAddButton({ onPress, label = 'Добавить' }: { onPress: () => void; label?: string }) {
  const { colors } = useTheme();
  return <AppPressable accessibilityRole="button" accessibilityLabel={label} actionLabel={label} onPress={onPress} haptic="selection" style={[styles.fab, { backgroundColor: colors.greenPrimary }]} pressedStyle={styles.pressed}>
    <View style={styles.fabContent}><AppText style={styles.fabPlus}>＋</AppText><AppText style={styles.fabLabel}>{label}</AppText></View>
  </AppPressable>;
}

function SheetDragSurface({ children, translateY, onClose }: { children: ReactNode; translateY: SharedValue<number>; onClose: () => void }) {
  'use no memo';
  const pan = Gesture.Pan().activeOffsetY(10).onBegin(() => {
    cancelAnimation(translateY);
  }).onUpdate((event) => {
    translateY.set(Math.max(0, event.translationY));
  }).onEnd((event) => {
    if (event.translationY > 80 || event.velocityY > 700) runOnJS(onClose)();
    else translateY.set(withSpring(0, motion.spring.soft));
  });
  return <GestureDetector gesture={pan}>{children}</GestureDetector>;
}

export function QuickAddSheet({ visible, onClose, date, mealType }: { visible: boolean; onClose: () => void; date: string; mealType?: MealType }) {
  'use no memo';
  const { colors } = useTheme();
  const { flags } = useFeatureFlags();
  const insets = useSafeAreaInsets();
  const target = useAppStore((state) => state.target);
  const diary = useAppStore((state) => state.diary);
  const refresh = useAppStore((state) => state.refreshDiary);
  const reduced = useReducedMotion();
  const translateY = useSharedValue(0);
  const [last, setLast] = useState<QuickAddAction | null>(null);
  const [busy, setBusy] = useState<QuickAddAction | null>(null);
  const alertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (visible) {
      recordUiAction('bottom_sheet_opened', 'quick_add');
      let active = true;
      void getSetting('last_quick_action').then((value) => {
        if (active) setLast(value as QuickAddAction | null);
      });
      return () => { active = false; };
    }
  }, [visible]);
  useEffect(() => () => {
    cancelAnimation(translateY);
    if (alertTimer.current) clearTimeout(alertTimer.current);
  }, [translateY]);
  const options = useMemo(() => prioritizeQuickActions(last), [last]);
  const close = () => { translateY.set(0); onClose(); };
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: reduced ? 0 : translateY.get() }] }));

  const choose = async (action: QuickAddAction) => {
    if (busy) return;
    try {
      setBusy(action);
      if (flags.enableHaptics) void safelyRunHaptic('selection');
      await setSetting('last_quick_action', action);
      setLast(action);
      const meal = mealType ?? getSmartNextStep(diary, new Date().getHours()).meal;
      close();
      if (action === 'search' || action === 'recent' || action === 'favorites') router.push({ pathname: '/food-search' as never, params: { meal, date, mode: action } } as never);
      else if (action === 'scan') router.push('/scanner' as never);
      else if (action === 'product') router.push('/product/new' as never);
      else if (action === 'recipe') router.push('/recipe/new' as never);
      else if (action === 'template') router.push('/meal-templates' as never);
      else if (action === 'water') router.push('/water-tracker' as never);
      else if (action === 'weight') router.push('/weight-progress' as never);
      else if (target) {
        if (action === 'repeat') await repeatMostRecentMeal(date, target);
        else await copyYesterdayMeal(date, meal, target);
        await refresh(date);
        if (flags.enableHaptics) void safelyRunHaptic('success');
      }
    } catch (error) {
      recordUiAction('error_occurred', 'quick_add', error instanceof Error ? error.message : 'Unknown quick add error');
      alertTimer.current = setTimeout(() => Alert.alert('Не удалось добавить', error instanceof Error ? error.message : 'Попробуй ещё раз.'), 250);
    } finally {
      setBusy(null);
    }
  };

  const sheet = <Animated.View style={[styles.sheet, { backgroundColor: colors.surfaceSolid, borderColor: colors.glassBorderStrong, paddingBottom: Math.max(24, insets.bottom + 16) }, animated]}>
    <View style={[styles.handle, { backgroundColor: colors.textMuted }]} />
    <AppText variant="title">Что добавить?</AppText>
    <AppText tone="secondary">Частые действия — без полного прохода по каталогу.</AppText>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.options}>
      {options.map((item, index) => <AppPressable key={item.key} accessibilityRole="button" accessibilityLabel={item.label} actionLabel={`quick_add:${item.key}`} disabled={busy !== null} onPress={() => choose(item.key)} style={[styles.option, index > 0 && { borderTopColor: colors.glassBorder, borderTopWidth: StyleSheet.hairlineWidth }]} pressedStyle={styles.pressed}>
        <View style={styles.optionContent}><View style={[styles.symbol, { backgroundColor: colors.greenGlow }]}><AppText tone="green">{item.symbol}</AppText></View><View style={styles.copy}><AppText style={styles.bold}>{item.label}</AppText><AppText variant="caption" tone="muted">{item.hint}</AppText></View><AppText tone="muted">›</AppText></View>
      </AppPressable>)}
    </ScrollView>
  </Animated.View>;

  return <Modal visible={visible} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={close}>
    <Pressable style={[styles.scrim, { backgroundColor: colors.blackScrim }]} onPress={close} />
    {flags.enableSheetGestures ? <SheetDragSurface translateY={translateY} onClose={close}>{sheet}</SheetDragSurface> : sheet}
  </Modal>;
}

const styles = StyleSheet.create({
  fab: { minHeight: 50, borderRadius: radii.pill, paddingHorizontal: spacing.lg, overflow: 'hidden' },
  fabContent: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  fabPlus: { color: '#031108', fontSize: 22, fontWeight: '800' }, fabLabel: { color: '#031108', fontWeight: '800' },
  pressed: { opacity: 0.82 }, scrim: { ...StyleSheet.absoluteFillObject },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '82%', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, borderWidth: 1, gap: spacing.xs },
  handle: { width: 42, height: 5, borderRadius: 3, alignSelf: 'center', opacity: 0.45, marginBottom: spacing.sm }, options: { paddingTop: spacing.sm },
  option: { minHeight: 62 }, optionContent: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  symbol: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, gap: 2 }, bold: { fontWeight: '700' },
});
