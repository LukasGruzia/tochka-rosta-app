import { useSyncExternalStore } from "react";
import { Redirect, router } from "expo-router";
import { StyleSheet, View } from "react-native";
import packageJson from "../../package.json";
import { AppPressable } from "@/components/AppPressable";
import { AppText } from "@/components/AppText";
import { GlassCard } from "@/components/GlassCard";
import { TabScreen } from "@/components/TabScreen";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";
import { currentDatabaseVersion } from "@/database/schema";
import {
  clearPerformanceEvents,
  getPerformanceSnapshot,
  subscribePerformance,
} from "@/performance/performanceLogger";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";

export default function PerformanceDiagnosticsScreen() {
  const { colors } = useTheme();
  const { flags, performanceMode, resolvedPerformanceMode } = useFeatureFlags();
  const snapshot = useSyncExternalStore(
    subscribePerformance,
    getPerformanceSnapshot,
    getPerformanceSnapshot,
  );
  if (!__DEV__) return <Redirect href="/(tabs)/profile" />;
  return (
    <TabScreen
      title="Performance Diagnostics"
      subtitle="Только анонимные данные текущей сессии"
      headerRight={
        <AppPressable
          accessibilityLabel="Закрыть"
          onPress={() => router.back()}
          style={[styles.close, { backgroundColor: colors.surface }]}
        >
          <AppText>×</AppText>
        </AppPressable>
      }
    >
      <GlassCard variant="accent">
        <Metric label="Route" value={snapshot.activeRoute} />
        <Metric
          label="Performance mode"
          value={`${performanceMode} → ${resolvedPerformanceMode}`}
        />
        <Metric label="Активные анимации" value={snapshot.activeAnimations} />
        <Metric label="Загружено продуктов" value={snapshot.loadedProducts} />
        <Metric label="Элементов списка" value={snapshot.currentListSize} />
      </GlassCard>
      <GlassCard>
        <AppText variant="heading">Render counters</AppText>
        <Metric label="Главная" value={snapshot.renderCounts.HomeScreen ?? 0} />
        <Metric
          label="Tab bar"
          value={snapshot.renderCounts.PremiumTabBar ?? 0}
        />
        <Metric
          label="Nutrition hero"
          value={snapshot.renderCounts.NutritionHeroCard ?? 0}
        />
        <Metric
          label="Каталог"
          value={snapshot.renderCounts.CatalogScreen ?? 0}
        />
      </GlassCard>
      <GlassCard>
        <AppText variant="heading">SQLite и среда</AppText>
        <Metric
          label="Последний запрос"
          value={snapshot.lastQueryLabel ?? "—"}
        />
        <Metric
          label="Длительность"
          value={
            snapshot.lastQueryDurationMs == null
              ? "—"
              : `${snapshot.lastQueryDurationMs} мс`
          }
        />
        <Metric
          label="Версия базы"
          value={snapshot.databaseVersion ?? currentDatabaseVersion}
        />
        <AppText variant="caption" tone="muted">
          Expo {packageJson.dependencies.expo} · Router{" "}
          {packageJson.dependencies["expo-router"]} · Reanimated{" "}
          {packageJson.dependencies["react-native-reanimated"]} · SQLite{" "}
          {packageJson.dependencies["expo-sqlite"]}
        </AppText>
      </GlassCard>
      <GlassCard>
        <AppText variant="heading">Активные эффекты</AppText>
        <AppText variant="caption" tone="secondary">
          {Object.entries(flags)
            .filter(([, value]) => value)
            .map(([name]) => name)
            .join("\n") || "Все тяжёлые эффекты отключены"}
        </AppText>
      </GlassCard>
      <GlassCard>
        <AppText variant="heading">Последние события</AppText>
        {snapshot.events
          .slice(-40)
          .reverse()
          .map((event) => (
            <AppText
              key={event.id}
              variant="caption"
              tone={event.type === "error" ? "warning" : "muted"}
            >
              {event.timestamp.slice(11, 19)} · {event.type} · {event.label}
              {event.durationMs == null ? "" : ` · ${event.durationMs} мс`}
              {event.value == null ? "" : ` · ${event.value}`}
            </AppText>
          ))}
        <AppPressable
          accessibilityLabel="Очистить журнал производительности"
          onPress={clearPerformanceEvents}
          style={[styles.button, { borderColor: colors.glassBorder }]}
        >
          <AppText tone="green">Очистить журнал</AppText>
        </AppPressable>
      </GlassCard>
      {snapshot.lastError ? (
        <GlassCard>
          <AppText tone="warning">
            Последняя ошибка: {snapshot.lastError}
          </AppText>
        </GlassCard>
      ) : null}
    </TabScreen>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.metric}>
      <AppText tone="secondary">{label}</AppText>
      <AppText style={styles.value}>{value}</AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  close: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  metric: {
    minHeight: 34,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  value: { flexShrink: 1, textAlign: "right", fontWeight: "700" },
  button: {
    minHeight: 48,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
