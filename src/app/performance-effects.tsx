import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppPressable } from "@/components/AppPressable";
import { AppText } from "@/components/AppText";
import { GlassCard } from "@/components/GlassCard";
import { TabScreen } from "@/components/TabScreen";
import {
  performanceModeLabels,
  visiblePerformanceModes,
} from "@/config/performance";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";

const descriptions = {
  automatic:
    "Сбалансированные эффекты с учётом устройства и системного Reduced Motion.",
  full: "Максимальное качество. Используй только после проверки стабильности на устройстве.",
  balanced:
    "Liquid Glass на ключевых поверхностях и анимации только на активном экране.",
  reduced:
    "Статичные поверхности и минимум анимаций для максимальной плавности.",
} as const;

export default function PerformanceEffectsScreen() {
  const { colors } = useTheme();
  const { performanceMode, resolvedPerformanceMode, setPerformanceMode } =
    useFeatureFlags();
  return (
    <TabScreen
      title="Качество эффектов"
      subtitle={`Активный профиль: ${performanceModeLabels[resolvedPerformanceMode]}`}
      headerRight={
        <AppPressable
          accessibilityLabel="Назад"
          onPress={() => router.back()}
          style={[styles.close, { backgroundColor: colors.surface }]}
        >
          <AppText>×</AppText>
        </AppPressable>
      }
    >
      <GlassCard>
        <AppText tone="secondary">
          Настройка меняет только визуальные эффекты. Дневник, профиль, SQLite и
          остальные функции работают одинаково во всех режимах.
        </AppText>
      </GlassCard>
      {visiblePerformanceModes.map((mode) => (
        <GlassCard
          key={mode}
          variant={performanceMode === mode ? "accent" : "interactive"}
          selected={performanceMode === mode}
          onPress={() => setPerformanceMode(mode)}
          accessibilityLabel={`Выбрать: ${performanceModeLabels[mode]}`}
        >
          <View style={styles.option}>
            <View style={styles.copy}>
              <AppText variant="heading">{performanceModeLabels[mode]}</AppText>
              <AppText tone="secondary">{descriptions[mode]}</AppText>
            </View>
            <AppText tone={performanceMode === mode ? "green" : "muted"}>
              {performanceMode === mode ? "✓" : "○"}
            </AppText>
          </View>
        </GlassCard>
      ))}
    </TabScreen>
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
  option: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  copy: { flex: 1, gap: spacing.xs },
});
