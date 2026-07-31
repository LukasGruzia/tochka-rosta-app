import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Constants from "expo-constants";
import { Redirect, router } from "expo-router";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import packageJson from "../../package.json";
import { AppText } from "@/components/AppText";
import { GlassCard } from "@/components/GlassCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { TabScreen } from "@/components/TabScreen";
import {
  clearDiaryForDevelopment,
  clearFlowForDevelopment,
  clearV3DemoData,
  createDemoV3Data,
  createTestStreak,
  inspectDevelopmentDatabase,
  recalculateAllDiaryAggregates,
  reseedForDevelopment,
} from "@/database/repositories/developerRepository";
import { useAppStore } from "@/store/appStore";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import { futureFoodInputProviders } from "@/services/foodInputProviders";
import { featureFlagNames } from "@/config/features";
import { performanceModeLabels } from "@/config/performance";
import { validateTabRoutes } from "@/config/routes";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";
import { useTabBarLayout } from "@/contexts/TabBarLayoutContext";
import {
  getUiDiagnosticsSnapshot,
  subscribeUiDiagnostics,
} from "@/services/uiDiagnostics";
import { loadRhythmDiagnostics } from "@/features/rhythm/repositories/rhythmRepository";
import { publishRhythmEvent } from "@/features/rhythm/services/eventService";
import { RhythmCharacter } from "@/features/rhythm/components/RhythmCharacter";

export default function DeveloperScreen() {
  const initialize = useAppStore((state) => state.initialize);
  const setAvatar = useAppStore((state) => state.setAvatar);
  const profile = useAppStore((state) => state.profile);
  const { colors, mode, setMode } = useTheme();
  const [inspection, setInspection] = useState<Awaited<
    ReturnType<typeof inspectDevelopmentDatabase>
  > | null>(null);
  const [busy, setBusy] = useState(false);
  const [rhythmDiagnostics, setRhythmDiagnostics] = useState<Record<string, number> | null>(null);
  const insets = useSafeAreaInsets();
  const { tabBarHeight } = useTabBarLayout();
  const {
    flags,
    safeMode,
    performanceMode,
    resolvedPerformanceMode,
    setFlag,
    setSafeMode,
    resetUiSettings,
  } = useFeatureFlags();
  const diagnostics = useSyncExternalStore(
    subscribeUiDiagnostics,
    getUiDiagnosticsSnapshot,
    getUiDiagnosticsSnapshot,
  );
  const refresh = useCallback(
    async () => setInspection(await inspectDevelopmentDatabase()),
    [],
  );
  useEffect(() => {
    if (__DEV__) void refresh().catch((error) => console.warn("[DeveloperScreen] inspect", error));
  }, [refresh]);
  useEffect(() => { if (__DEV__) void loadRhythmDiagnostics().then(setRhythmDiagnostics).catch(() => undefined); }, []);
  if (!__DEV__) return <Redirect href="/(tabs)/profile" />;
  const run = async (label: string, action: () => Promise<void>) => {
    try {
      setBusy(true);
      await action();
      await initialize();
      await refresh();
      Alert.alert("Готово", label);
    } catch (error) {
      Alert.alert(
        "Ошибка",
        error instanceof Error ? error.message : "Операция не выполнена",
      );
    } finally {
      setBusy(false);
    }
  };
  const confirm = (title: string, action: () => Promise<void>) =>
    Alert.alert(title, "Изменятся только локальные тестовые данные.", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Продолжить",
        style: "destructive",
        onPress: () => {
          void run(title, action);
        },
      },
    ]);
  return (
    <TabScreen
      title="Диагностика"
      subtitle="Только development-сборка"
      headerRight={
        <Pressable
          style={[styles.close, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <AppText>×</AppText>
        </Pressable>
      }
    >
      <GlassCard>
        <AppText variant="heading">Среда</AppText>
        <AppText tone="secondary">
          Приложение: {Constants.expoConfig?.version ?? "—"} · Expo SDK{" "}
          {Constants.expoConfig?.sdkVersion ?? "54"}
        </AppText>
        <AppText tone="secondary">
          SQLite v{inspection?.version ?? "—"} ·{" "}
          {inspection
            ? `${(inspection.databaseBytes / 1024 / 1024).toFixed(1)} МБ`
            : "—"}
        </AppText>
        <AppText tone="secondary">
          Продукты {inspection?.products ?? "—"} · дневник{" "}
          {inspection?.entries ?? "—"} · коды {inspection?.coded ?? "—"}
        </AppText>
        <AppText tone={inspection?.duplicateCodes ? "warning" : "green"}>
          Дубли кодов: {inspection?.duplicateCodes ?? "—"}
        </AppText>
      </GlassCard>
      <GlassCard>
        <AppText variant="heading">Навигация и устройство</AppText>
        <AppText tone="secondary">
          Route: {diagnostics.currentRoute} · tab: {diagnostics.activeTab}
        </AppText>
        <AppText tone="secondary">
          Safe area: {insets.top}/{insets.right}/{insets.bottom}/{insets.left} ·
          tab bar: {tabBarHeight}px
        </AppText>
        <AppText tone="secondary">
          Профиль: {profile ? "загружен" : "не загружен"} · тема: {mode}
        </AppText>
        <AppText tone="secondary">
          Эффекты: {performanceModeLabels[performanceMode]} →{" "}
          {performanceModeLabels[resolvedPerformanceMode]}
        </AppText>
        <AppText variant="caption" tone="muted">
          RN {packageJson.dependencies["react-native"]} · Router{" "}
          {packageJson.dependencies["expo-router"]} · Reanimated{" "}
          {packageJson.dependencies["react-native-reanimated"]} · Gesture
          Handler {packageJson.dependencies["react-native-gesture-handler"]}
        </AppText>
        <PrimaryButton
          label="Проверить все маршруты"
          secondary
          onPress={() => {
            const invalid = validateTabRoutes().filter((item) => !item.valid);
            Alert.alert(
              invalid.length ? "Найдены ошибки" : "Маршруты исправны",
              invalid.length
                ? invalid.map((item) => item.key).join(", ")
                : "Все пять вкладок имеют статические маршруты.",
            );
          }}
        />
        <PrimaryButton
          label="Performance Diagnostics"
          secondary
          onPress={() => router.push("/performance-diagnostics" as never)}
        />
        <PrimaryButton
          label="Качество эффектов"
          secondary
          onPress={() => router.push("/performance-effects" as never)}
        />
      </GlassCard>
      <GlassCard variant={safeMode ? "accent" : "default"}>
        <AppText variant="heading">
          Safe Mode: {safeMode ? "включён" : "выключен"}
        </AppText>
        <AppText tone="secondary">
          Отключает сложные анимации и drag, сохраняя навигацию, SQLite,
          дневник, каталог и профиль.
        </AppText>
        <PrimaryButton
          label={
            safeMode
              ? "Вернуть проверенные анимации"
              : "Отключить сложные анимации"
          }
          secondary={!safeMode}
          onPress={() => setSafeMode(!safeMode)}
        />
        <PrimaryButton
          label="Сбросить только UI settings"
          secondary
          onPress={resetUiSettings}
        />
      </GlassCard>
      <GlassCard>
        <AppText variant="heading">Feature flags</AppText>
        {featureFlagNames.map((name) => (
          <View key={name} style={styles.flag}>
            <View style={styles.flex}>
              <AppText variant="caption">{name}</AppText>
              <AppText variant="caption" tone={flags[name] ? "green" : "muted"}>
                {flags[name] ? "Включено" : "Выключено"}
              </AppText>
            </View>
            <PrimaryButton
              label={flags[name] ? "Выкл." : "Вкл."}
              secondary
              onPress={() => setFlag(name, !flags[name])}
            />
          </View>
        ))}
      </GlassCard>
      <GlassCard>
        <AppText variant="heading">Последние действия</AppText>
        {diagnostics.actions
          .slice(-20)
          .reverse()
          .map((item) => (
            <AppText
              key={item.id}
              variant="caption"
              tone={item.type === "error_occurred" ? "warning" : "muted"}
            >
              {item.timestamp.slice(11, 19)} · {item.type} · {item.label}
              {item.details ? ` · ${item.details}` : ""}
            </AppText>
          ))}
        {!diagnostics.actions.length ? (
          <AppText tone="muted">Журнал пока пуст.</AppText>
        ) : null}
        {diagnostics.lastError ? (
          <AppText tone="warning">
            Последняя ошибка: {diagnostics.lastError}
          </AppText>
        ) : null}
      </GlassCard>
      <GlassCard>
        <AppText variant="heading">Данные APP v0.3</AppText>
        <AppText tone="secondary">
          Вес {inspection?.weights ?? "—"} · вода {inspection?.water ?? "—"} ·
          наборы {inspection?.templates ?? "—"} · поиски{" "}
          {inspection?.searches ?? "—"}
        </AppText>
        <PrimaryButton
          label="Создать демо v0.3"
          secondary
          disabled={busy}
          onPress={() => run("Демо-данные v0.3 созданы", createDemoV3Data)}
        />
        <PrimaryButton
          label="Очистить демо v0.3"
          secondary
          disabled={busy}
          onPress={() => confirm("Очистить демо v0.3?", clearV3DemoData)}
        />
      </GlassCard>
      <GlassCard variant="accent">
        <View style={styles.future}><RhythmCharacter size="compact" emotion="thinking" action="presentAdvice"/><View style={styles.flex}><AppText variant="heading">Диагностика Ритма</AppText><AppText tone="secondary">Симуляции создают только служебное событие и не изменяют реальный дневник, профиль или Поток.</AppText></View></View>
        <AppText variant="caption" tone="muted">{rhythmDiagnostics ? Object.entries(rhythmDiagnostics).map(([key,value]) => `${key}: ${value}`).join(' · ') : 'Загрузка локальных счётчиков…'}</AppText>
        <PrimaryButton label="Симулировать добавление блюда" secondary onPress={() => publishRhythmEvent({type:'MEAL_ADDED',route:'/developer',payload:{simulation:true}})} />
        <PrimaryButton label="Симулировать milestone" secondary onPress={() => publishRhythmEvent({type:'FLOW_MILESTONE',route:'/developer',payload:{streak:7,simulation:true}})} />
        <PrimaryButton label="Симулировать приближение к бюджету" secondary onPress={() => publishRhythmEvent({type:'BUDGET_APPROACHING',route:'/developer',payload:{simulation:true}})} />
      </GlassCard>
      <GlassCard>
        <AppText variant="heading">Тема</AppText>
        <AppText tone="secondary">Текущий режим: {mode}</AppText>
        <View style={styles.row}>
          {(
            [
              ["system", "Система"],
              ["dark", "Тёмная"],
              ["light", "Светлая"],
            ] as const
          ).map(([value, label]) => (
            <View key={value} style={styles.flex}>
              <PrimaryButton
                label={label}
                secondary={mode !== value}
                disabled={busy}
                onPress={() => {
                  void setMode(value);
                }}
              />
            </View>
          ))}
        </View>
      </GlassCard>
      <GlassCard>
        <AppText variant="heading">Тестовый Поток</AppText>
        <View style={[styles.row, styles.wrap]}>
          {([3, 7, 14, 30] as const).map((days) => (
            <View key={days} style={styles.half}>
              <PrimaryButton
                label={`${days} дней`}
                secondary
                disabled={busy}
                onPress={() =>
                  run(`Создана серия ${days} дней`, () =>
                    createTestStreak(days),
                  )
                }
              />
            </View>
          ))}
        </View>
        <PrimaryButton
          label="Очистить только Поток"
          secondary
          disabled={busy}
          onPress={() => confirm("Очистить Поток?", clearFlowForDevelopment)}
        />
      </GlassCard>
      <GlassCard>
        <AppText variant="heading">База и агрегаты</AppText>
        <PrimaryButton
          label="Пересчитать агрегаты"
          secondary
          disabled={busy}
          onPress={() =>
            run("Агрегаты пересчитаны", recalculateAllDiaryAggregates)
          }
        />
        <PrimaryButton
          label="Повторить seed"
          secondary
          disabled={busy}
          onPress={() => run("Seed выполнен", reseedForDevelopment)}
        />
        <PrimaryButton
          label="Очистить дневник"
          secondary
          disabled={busy}
          onPress={() => confirm("Очистить дневник?", clearDiaryForDevelopment)}
        />
      </GlassCard>
      <GlassCard>
        <AppText variant="heading">Проверка интерфейса</AppText>
        <PrimaryButton
          label="Очистить аватар"
          secondary
          disabled={busy}
          onPress={() => confirm("Очистить аватар?", () => setAvatar(null))}
        />
        <PrimaryButton
          label="Открыть универсальный поиск"
          secondary
          disabled={busy}
          onPress={() => router.push("/food-search")}
        />
        <PrimaryButton
          label="Открыть прогресс веса"
          secondary
          disabled={busy}
          onPress={() => router.push("/weight-progress")}
        />
        <PrimaryButton
          label="Открыть трекер воды"
          secondary
          disabled={busy}
          onPress={() => router.push("/water-tracker")}
        />
        <AppText variant="caption" tone="muted">
          После очистки демо-данных эти экраны позволяют проверить empty states
          и возврат по навигации.
        </AppText>
      </GlassCard>
      <GlassCard>
        <AppText variant="heading">Демонстрация и исследование</AppText>
        <PrimaryButton
          label="Демонстрация проекта"
          secondary
          onPress={() => router.push("/jury-demo" as never)}
        />
        <PrimaryButton
          label="Исследовательский режим"
          secondary
          onPress={() => router.push("/research-mode" as never)}
        />
        <AppText variant="caption" tone="muted">
          Guided demo не изменяет реальные данные. Research mode собирает только
          анонимные локальные события после уведомления.
        </AppText>
      </GlassCard>
      <GlassCard>
        <AppText variant="heading">Будущие способы добавления</AppText>
        {futureFoodInputProviders.map((provider) => (
          <View key={provider.id} style={styles.future}>
            <View style={styles.flex}>
              <AppText>{provider.title}</AppText>
              <AppText variant="caption" tone="muted">
                {provider.availability}
              </AppText>
            </View>
            <AppText variant="caption" tone="green">
              В разработке
            </AppText>
          </View>
        ))}
      </GlassCard>
      <AppText variant="caption" tone="muted">
        Экран недоступен в production. Все действия локальны и не отправляют
        данные в сеть.
      </AppText>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  close: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", gap: spacing.xs },
  wrap: { flexWrap: "wrap" },
  flex: { flex: 1 },
  half: { flexBasis: "46%", flexGrow: 1 },
  future: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  flag: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
