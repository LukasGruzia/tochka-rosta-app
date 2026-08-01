import { useCallback, useEffect, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Alert, Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { AppText } from "@/components/AppText";
import { createSectionErrorBoundary } from "@/components/ScreenErrorFallback";
import { GlassCard } from "@/components/GlassCard";
import { MonthCalendar } from "@/components/DiaryCalendarSheet";
import { PrimaryButton } from "@/components/PrimaryButton";
import { TabScreen } from "@/components/TabScreen";
import {
  loadCalendarMonth,
  loadWeeklyFlowSummary,
} from "@/database/repositories/calendarRepository";
import {
  applyFlowPause,
  loadFlowPauses,
  loadFlowPreferences,
  setWeeklyFlowGoal,
} from "@/database/repositories/flowRepository";
import {
  formatMonthTitle,
  getWeekStart,
  shiftLocalDate,
  shiftMonth,
} from "@/services/calendar";
import {
  flowMilestones,
  getFlowProgress,
  getFlowSubtitle,
} from "@/services/flowCalculator";
import { getWeeklyFlowProgress } from "@/services/flowGoals";
import { safelyRunHaptic } from "@/services/haptics";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";
import { useScreenActivity } from "@/hooks/useScreenActivity";
import { useRenderTracker } from "@/performance/renderTracker";
import { useAppStore } from "@/store/appStore";
import { useTheme } from "@/theme/ThemeProvider";
import { motion, radii, spacing } from "@/theme/tokens";
import type {
  CalendarDayStatus,
  FlowPause,
  FlowPreferences,
} from "@/types/domain";
import { getLocalDateKey } from "@/utils/date";
import { RhythmCharacter } from "@/features/rhythm/components/RhythmCharacter";
import { RhythmSuggestionCard } from "@/features/rhythm/components/RhythmSuggestionCard";
import { RhythmOnboardingSheet } from "@/features/rhythm/components/RhythmOnboardingSheet";
import { useRhythmOverlay } from "@/features/rhythm/components/RhythmOverlayProvider";

export const ErrorBoundary = createSectionErrorBoundary("FlowScreen");

function ProgressBar({ progress }: { progress: number }) {
  "use no memo";
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const activity = useScreenActivity();
  const value = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(value);
    value.set(
      reduced || !activity.canAnimate
        ? progress
        : withSpring(progress, motion.spring.soft),
    );
    return () => cancelAnimation(value);
  }, [activity.canAnimate, progress, reduced, value]);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scaleX: Math.max(0, Math.min(1, value.get())) }],
  }));
  return (
    <View style={[styles.progressTrack, { backgroundColor: colors.greenDark }]}>
      <Animated.View
        style={[
          styles.progressFill,
          { backgroundColor: colors.greenBright },
          animated,
        ]}
      />
    </View>
  );
}
export default function FlowScreen() {
  useRenderTracker("FlowScreen");
  const flow = useAppStore((state) => state.flow);
  const refreshFlow = useAppStore((state) => state.refreshFlow);
  const setDiaryDate = useAppStore((state) => state.setDiaryDate);
  const { colors } = useTheme();
  const { flags } = useFeatureFlags();
  const { settings:rhythmSettings }=useRhythmOverlay();
  const [active, setActive] = useState(false);
  const [info, setInfo] = useState(false);
  const [prefs, setPrefs] = useState<FlowPreferences>({
    weeklyGoalDays: 5,
    pauseTokens: 0,
    totalPauses: 0,
  });
  const [pauses, setPauses] = useState<FlowPause[]>([]);
  const monthNow = getLocalDateKey().slice(0, 7);
  const [month, setMonth] = useState(monthNow);
  const [statuses, setStatuses] = useState<CalendarDayStatus[]>([]);
  const [summary, setSummary] = useState({
    closedDays: 0,
    entryCount: 0,
    averageAccuracy: 0,
    averageProtein: 0,
  });
  const reloadGeneration = useRef(0);
  const weekStart = getWeekStart();
  const weekEnd = shiftLocalDate(weekStart, 6);
  const reload = useCallback(async () => {
    const generation = ++reloadGeneration.current;
    await refreshFlow();
    const [nextPrefs, nextPauses, nextSummary] = await Promise.all([
      loadFlowPreferences(),
      loadFlowPauses(),
      loadWeeklyFlowSummary(weekStart, weekEnd),
    ]);
    if (generation === reloadGeneration.current) {
      setPrefs(nextPrefs);
      setPauses(nextPauses);
      setSummary(nextSummary);
    }
  }, [refreshFlow, weekEnd, weekStart]);
  useFocusEffect(
    useCallback(() => {
      setActive(true);
      void reload().catch((error) => {
        if (__DEV__) console.warn("[FlowScreen] reload", error);
      });
      return () => {
        reloadGeneration.current += 1;
        setActive(false);
      };
    }, [reload]),
  );
  useEffect(() => {
    let activeRequest = true;
    void loadCalendarMonth(month)
      .then((next) => {
        if (activeRequest) setStatuses(next);
      })
      .catch((error) => {
        if (__DEV__) console.warn("[FlowScreen] calendar", error);
      });
    return () => {
      activeRequest = false;
    };
  }, [month, flow?.completedDays, pauses.length]);
  const streak = flow?.currentStreak ?? 0;
  const progress = getFlowProgress(streak);
  const weekly = getWeeklyFlowProgress(
    flow?.completedDates ?? [],
    weekStart,
    prefs.weeklyGoalDays,
  );
  const pauseDate = shiftLocalDate(getLocalDateKey(), -1);
  const pauseUsed = pauses.some((item) => item.date === pauseDate);
  const pauseCompleted = flow?.completedDates.includes(pauseDate);
  return (
    <>
      <TabScreen
        title="Твой Поток"
        subtitle={getFlowSubtitle(streak)}
        headerRight={
          <Pressable
            accessibilityLabel="Как работает Поток"
            style={[styles.info, { backgroundColor: colors.surface }]}
            onPress={() => setInfo(true)}
          >
            <AppText>i</AppText>
          </Pressable>
        }
      >
        <View style={styles.hero}>
          <RhythmCharacter
            size="hero"
            mode={rhythmSettings?.mode}
            emotion={streak >= 7 ? "celebrating" : streak > 0 ? "happy" : "idle"}
            action={streak >= 7 ? "celebrate" : streak > 0 ? "wave" : "none"}
            animated={active}
          />
          <AppText variant="display">
            {streak} {streak === 1 ? "день" : "дней"}
          </AppText>
          <AppText tone="secondary" style={styles.center}>
            {streak
              ? "Поток продолжается"
              : "Закрой первый день, чтобы огонёк ожил."}
          </AppText>
        </View>
        <RhythmSuggestionCard
          title={streak ? `Я рядом уже ${streak} дн.` : "Давай найдём твой ритм"}
          message={streak ? "Посмотрим, что мягко дополнит сегодняшний день?" : "Начни с одной записи — идеальный день не нужен."}
          emotion={streak ? "motivated" : "supportive"}
          action={streak ? "point" : "presentAdvice"}
          onPrimary={() => router.push("/rhythm-center")}
          secondaryLabel="Настройки Ритма"
          onSecondary={() => router.push("/rhythm-settings")}
        />
        <GlassCard variant="accent">
          <AppText variant="heading">Этапы пути</AppText>
          <View style={styles.milestones}>
            {flowMilestones.map((milestone, index) => {
              const unlocked = (flow?.longestStreak ?? 0) >= milestone.days;
              const current = progress.next?.days === milestone.days;
              return (
                <View key={milestone.days} style={styles.milestone}>
                  <View style={styles.rail}>
                    <View
                      style={[
                        styles.node,
                        {
                          borderColor:
                            unlocked || current
                              ? colors.greenBright
                              : colors.glassBorderStrong,
                          backgroundColor: unlocked
                            ? colors.greenPrimary
                            : current
                              ? colors.greenGlow
                              : colors.surface,
                        },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        style={unlocked ? styles.dark : undefined}
                      >
                        {unlocked ? "✓" : milestone.days}
                      </AppText>
                    </View>
                    {index < flowMilestones.length - 1 ? (
                      <View
                        style={[
                          styles.line,
                          {
                            backgroundColor: unlocked
                              ? colors.greenPrimary
                              : colors.glassBorder,
                          },
                        ]}
                      />
                    ) : null}
                  </View>
                  <View
                    style={[
                      styles.milestoneCopy,
                      current && {
                        backgroundColor: colors.greenGlow,
                        borderColor: colors.glassBorderStrong,
                      },
                    ]}
                  >
                    <AppText style={styles.bold}>{milestone.title}</AppText>
                    <AppText
                      variant="caption"
                      tone={
                        unlocked ? "green" : current ? "secondary" : "muted"
                      }
                    >
                      {unlocked
                        ? "Открыто · "
                        : current
                          ? "Текущий этап · "
                          : "Впереди · "}
                      {milestone.reward}
                    </AppText>
                  </View>
                </View>
              );
            })}
          </View>
        </GlassCard>
        <GlassCard>
          <AppText variant="caption" tone="green">
            ТЕКУЩИЙ ПРОГРЕСС
          </AppText>
          <View style={styles.progressHead}>
            <View>
              <AppText variant="title">{streak} дней</AppText>
              <AppText tone="secondary">
                {progress.next
                  ? `До этапа «${progress.next.title}» — ${progress.remaining} дн.`
                  : "Все текущие этапы открыты"}
              </AppText>
            </View>
            <View style={styles.best}>
              <AppText variant="heading">{flow?.longestStreak ?? 0}</AppText>
              <AppText variant="caption" tone="muted">
                лучшая
              </AppText>
            </View>
          </View>
          <ProgressBar progress={progress.progress} />
        </GlassCard>
        <GlassCard>
          <View style={styles.calendarHead}>
            <Pressable
              accessibilityLabel="Предыдущий месяц"
              onPress={() => setMonth(shiftMonth(month, -1))}
            >
              <AppText tone="green">‹</AppText>
            </Pressable>
            <AppText variant="heading">{formatMonthTitle(month)}</AppText>
            <Pressable
              accessibilityLabel="Следующий месяц"
              onPress={() => setMonth(shiftMonth(month, 1))}
            >
              <AppText tone="green">›</AppText>
            </Pressable>
          </View>
          <MonthCalendar
            monthKey={month}
            statuses={statuses}
            compact
            onMonthChange={setMonth}
            onSelect={async (date) => {
              await setDiaryDate(date);
              router.push("/(tabs)/diary");
            }}
          />
        </GlassCard>
        <GlassCard variant="compact">
          <View style={styles.progressHead}>
            <View style={styles.grow}>
              <AppText variant="heading">Недельная цель</AppText>
              <AppText tone="secondary">
                {weekly.completed} из {weekly.goal} дней ·{" "}
                {weekly.achieved
                  ? "цель выполнена"
                  : `осталось ${weekly.remaining}`}
              </AppText>
            </View>
            <AppText tone="green">{Math.round(weekly.progress * 100)}%</AppText>
          </View>
          <ProgressBar progress={weekly.progress} />
          <View style={styles.goalChips}>
            {([3, 5, 7] as const).map((goal) => (
              <Pressable
                key={goal}
                accessibilityRole="button"
                accessibilityLabel={`Недельная цель: ${goal} дней из 7`}
                accessibilityState={{ selected: prefs.weeklyGoalDays === goal }}
                onPress={async () => {
                  await setWeeklyFlowGoal(goal);
                  setPrefs({ ...prefs, weeklyGoalDays: goal });
                }}
                style={[
                  styles.goal,
                  {
                    borderColor:
                      prefs.weeklyGoalDays === goal
                        ? colors.glassBorderStrong
                        : colors.glassBorder,
                    backgroundColor:
                      prefs.weeklyGoalDays === goal
                        ? colors.greenGlow
                        : colors.transparent,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  tone={prefs.weeklyGoalDays === goal ? "green" : "secondary"}
                >
                  {goal} из 7
                </AppText>
              </Pressable>
            ))}
          </View>
        </GlassCard>
        <GlassCard variant="compact">
          <AppText variant="heading">Эта неделя</AppText>
          <AppText tone="secondary">
            Ты закрыл {summary.closedDays} дней из 7. Продолжай в удобном ритме.
          </AppText>
          <View style={styles.weekStats}>
            <AppText variant="caption" tone="muted">
              Записей: {summary.entryCount}
            </AppText>
            <AppText variant="caption" tone="muted">
              Среднее попадание: {Math.round(summary.averageAccuracy)}%
            </AppText>
            <AppText variant="caption" tone="muted">
              Белок: {Math.round(summary.averageProtein)} г
            </AppText>
          </View>
        </GlassCard>
        <GlassCard variant="compact">
          <AppText variant="heading">
            {streak === 0
              ? "Сегодня можно вернуться в свой ритм"
              : "Стабильность важнее идеальности"}
          </AppText>
          <AppText tone="secondary">
            Завершённые дни остаются частью твоего пути. Один пропуск не удаляет
            историю, лучшую серию или уже открытые этапы.
          </AppText>
        </GlassCard>
        <GlassCard variant="compact">
          <AppText variant="heading">День паузы</AppText>
          <AppText tone="secondary">
            Пауза не закрывает день и не увеличивает серию, но может сохранить
            текущий ритм. Доступно: {prefs.pauseTokens}.
          </AppText>
          <PrimaryButton
            label={
              pauseUsed ? "Пауза уже применена" : `Применить ко вчерашнему дню`
            }
            secondary
            disabled={pauseUsed || pauseCompleted || prefs.pauseTokens <= 0}
            onPress={() =>
              Alert.alert(
                "Использовать день паузы?",
                `Дата: ${pauseDate}. Пауза не считается завершённым днём.`,
                [
                  { text: "Отмена", style: "cancel" },
                  {
                    text: "Применить",
                    onPress: async () => {
                      try {
                        await applyFlowPause(pauseDate);
                        if (flags.enableHaptics) {
                          await safelyRunHaptic("success");
                        }
                        await reload();
                      } catch (error) {
                        Alert.alert(
                          "Не удалось",
                          error instanceof Error
                            ? error.message
                            : "Попробуй снова",
                        );
                      }
                    },
                  },
                ],
              )
            }
          />
        </GlassCard>
        <PrimaryButton
          label="Открыть статистику"
          secondary
          onPress={() => router.push("/analytics" as never)}
        />
      </TabScreen>
      <RhythmOnboardingSheet />
      <Modal
        visible={info}
        transparent
        animationType="fade"
        onRequestClose={() => setInfo(false)}
      >
        <Pressable
          style={[styles.scrim, { backgroundColor: colors.blackScrim }]}
          onPress={() => setInfo(false)}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surfaceSolid,
              borderColor: colors.glassBorderStrong,
            },
          ]}
        >
          <AppText variant="title">Как работает Поток</AppText>
          <AppText tone="secondary">
            День закрывается в дневнике после добавления еды. Серия учитывает
            последовательные закрытые дни; день паузы может сохранить ритм, но
            не увеличивает число.
          </AppText>
          <AppText tone="secondary">
            Один пропуск не удаляет историю, лучшую серию и уже открытые этапы.
          </AppText>
          <AppText variant="caption" tone="muted">
            Награды пока являются концепцией будущей программы лояльности и не
            обещают реальные скидки или подарки.
          </AppText>
          <PrimaryButton label="Понятно" onPress={() => setInfo(false)} />
        </View>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  info: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.sm },
  center: { textAlign: "center" },
  milestones: { marginTop: spacing.md },
  milestone: { flexDirection: "row", gap: spacing.md, minHeight: 78 },
  rail: { width: 42, alignItems: "center" },
  node: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  line: { width: 2, flex: 1 },
  milestoneCopy: {
    flex: 1,
    gap: 3,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  bold: { fontWeight: "700" },
  dark: { color: "#031108", fontWeight: "800" },
  progressHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  best: { alignItems: "center" },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    marginTop: spacing.md,
  },
  progressFill: {
    width: "100%",
    height: "100%",
    borderRadius: 5,
    transformOrigin: "left center",
  },
  calendarHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grow: { flex: 1 },
  goalChips: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.md },
  goal: {
    minHeight: 42,
    flex: 1,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  weekStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  scrim: { ...StyleSheet.absoluteFillObject },
  sheet: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 24,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
