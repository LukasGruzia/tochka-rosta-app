import { useEffect, useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { GlassCard } from "@/components/GlassCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { TabScreen } from "@/components/TabScreen";
import { mealLabels } from "@/constants/options";
import { loadBudgetSettings } from "@/database/repositories/budgetRepository";
import { saveMealTemplate } from "@/database/repositories/mealTemplateRepository";
import {
  calculateRemainder,
  matchRemainder,
  type RemainderMatch,
} from "@/services/remainderMatcher";
import { getSmartNextStep } from "@/services/smartNextStep";
import { useAppStore } from "@/store/appStore";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import type { BudgetSettings, MealType } from "@/types/domain";
import { safelyRunHaptic } from "@/services/haptics";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";
import { RhythmCharacter } from "@/features/rhythm/components/RhythmCharacter";
import { publishRhythmEvent } from "@/features/rhythm/services/eventService";
import { recordRhythmFeedback } from "@/features/rhythm/repositories/rhythmRepository";

export default function RemainderMatchScreen() {
  const params = useLocalSearchParams<{ meal?: MealType }>();
  const profile = useAppStore((state) => state.profile);
  const target = useAppStore((state) => state.target);
  const products = useAppStore((state) => state.products);
  const diary = useAppStore((state) => state.diary);
  const diaryDate = useAppStore((state) => state.diaryDate);
  const addToDiary = useAppStore((state) => state.addToDiary);
  const ensureProductsLoaded = useAppStore(
    (state) => state.ensureProductsLoaded,
  );
  const { colors } = useTheme();
  const { flags } = useFeatureFlags();
  const [budget, setBudget] = useState<BudgetSettings | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void Promise.all([loadBudgetSettings(), ensureProductsLoaded()]).then(
      ([nextBudget]) => {
        if (active) setBudget(nextBudget);
      },
    );
    return () => {
      active = false;
    };
  }, [ensureProductsLoaded]);
  useEffect(() => { void publishRhythmEvent({ type: "REMAINDER_MATCH_OPENED", route: "/remainder-match" }); }, []);
  const meal =
    params.meal ?? getSmartNextStep(diary, new Date().getHours()).meal;
  const remaining = useMemo(
    () =>
      calculateRemainder(
        {
          calories: target?.calories ?? 0,
          proteinG: target?.proteinG ?? 0,
          fatG: target?.fatG ?? 0,
          carbsG: target?.carbsG ?? 0,
        },
        {
          calories: diary?.consumedCalories ?? 0,
          proteinG: diary?.consumedProteinG ?? 0,
          fatG: diary?.consumedFatG ?? 0,
          carbsG: diary?.consumedCarbsG ?? 0,
        },
      ),
    [diary, target],
  );
  const matches = useMemo(
    () =>
      profile
        ? matchRemainder(products, remaining, {
            profile,
            mealType: meal,
            budget,
            usedProductIds:
              diary?.entries.flatMap((entry) =>
                entry.productId ? [entry.productId] : [],
              ) ?? [],
          })
        : [],
    [budget, diary?.entries, meal, products, profile, remaining],
  );
  const add = async (match: RemainderMatch, only?: number) => {
    try {
      setBusy(match.id);
      const items = only == null ? match.items : [match.items[only]];
      for (const item of items)
        await addToDiary({
          date: diaryDate,
          product: item.product,
          mealType: meal,
          servings: item.servings,
          quantityG: item.quantityG,
        });
      void recordRhythmFeedback("accepted", { recommendationKey: match.id, productIds: items.map((item) => item.product.id) });
      if (flags.enableHaptics) await safelyRunHaptic("success");
      Alert.alert(
        "Добавлено",
        `${items.length} ${items.length === 1 ? "позиция" : "позиции"} в ${mealLabels[meal].toLocaleLowerCase("ru-RU")}.`,
      );
    } finally {
      setBusy(null);
    }
  };
  if (!profile || !target)
    return (
      <TabScreen title="Закрыть остаток">
        <AppText>Профиль ещё загружается.</AppText>
      </TabScreen>
    );
  return (
    <TabScreen
      title="Закрыть остаток"
      subtitle="Прозрачный локальный подбор — без AI"
      headerRight={
        <Pressable
          style={[styles.close, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <AppText>×</AppText>
        </Pressable>
      }
    >
      <GlassCard variant="accent">
        <View style={styles.rhythmHead}>
          <RhythmCharacter size="compact" emotion="thinking" action="presentAdvice" />
          <AppText tone="secondary" style={styles.copy}>Ритм сравнил доступные варианты. Выбор и добавление остаются за тобой.</AppText>
        </View>
        <AppText variant="caption" tone="green">
          ОСТАЛОСЬ НА СЕГОДНЯ
        </AppText>
        <AppText variant="title">{Math.round(remaining.calories)} ккал</AppText>
        <AppText tone="secondary">
          Б {Math.round(remaining.proteinG)} · Ж {Math.round(remaining.fatG)} ·
          У {Math.round(remaining.carbsG)} · {mealLabels[meal]}
        </AppText>
        {budget?.includeInRecommendations && budget.perMealBudget ? (
          <AppText variant="caption" tone="muted">
            Ориентир — до {Math.round(budget.perMealBudget)} ₽ на приём пищи
          </AppText>
        ) : null}
      </GlassCard>
      {!matches.length ? (
        <GlassCard>
          <AppText variant="heading">Подходящих вариантов пока нет</AppText>
          <AppText tone="secondary">
            Проверь ограничения или создай свой продукт. Мы не предлагаем
            позиции с конфликтующими аллергенами.
          </AppText>
          <PrimaryButton
            label="Открыть поиск"
            onPress={() => router.replace("/food-search" as never)}
          />
        </GlassCard>
      ) : (
        matches.map((match) => (
          <GlassCard
            key={match.id}
            variant={match.label === "Лучшее совпадение" ? "accent" : "default"}
          >
            <View style={styles.heading}>
              <View style={styles.copy}>
                <AppText variant="caption" tone="green">
                  {match.label.toLocaleUpperCase("ru-RU")}
                </AppText>
                <AppText variant="heading">
                  {match.items.map((item) => item.product.name).join(" + ")}
                </AppText>
              </View>
              <AppText variant="caption" tone="muted">
                {Math.max(0, Math.round(match.score))}%
              </AppText>
            </View>
            <AppText tone="secondary">
              {Math.round(match.total.calories)} ккал · Б{" "}
              {Math.round(match.total.proteinG)} · Ж{" "}
              {Math.round(match.total.fatG)} · У{" "}
              {Math.round(match.total.carbsG)}
            </AppText>
            <AppText variant="caption" tone="muted">
              ≈ {Math.round(match.total.price)} ₽ ·{" "}
              {match.items
                .map((item) => `${Math.round(item.quantityG)} г`)
                .join(" + ")}
            </AppText>
            {match.items.length > 1 ? (
              <View style={styles.items}>
                {match.items.map((item, index) => (
                  <Pressable
                    key={item.product.id}
                    onPress={() => void add(match, index)}
                    style={[styles.item, { borderColor: colors.glassBorder }]}
                  >
                    <AppText variant="caption">＋ {item.product.name}</AppText>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <PrimaryButton
              label={busy === match.id ? "Добавляем…" : "Добавить весь вариант"}
              disabled={busy !== null}
              onPress={() => add(match)}
            />
            {match.items.length > 1 ? (
              <PrimaryButton
                label="Сохранить как набор"
                secondary
                onPress={async () => {
                  await saveMealTemplate({
                    name: match.items
                      .map((item) => item.product.name)
                      .join(" + "),
                    defaultMealType: meal,
                    items: match.items.map((item) => ({
                      product: item.product,
                      mealType: meal,
                      servings: item.servings,
                      quantityG: item.quantityG,
                    })),
                  });
                  Alert.alert("Набор сохранён");
                }}
              />
            ) : null}
          </GlassCard>
        ))
      )}
      <AppText variant="caption" tone="muted">
        Scoring учитывает остаток КБЖУ, цель, приём пищи, ограничения, бюджет,
        повторяемость и качество данных. Результат является ориентиром, а не
        медицинской рекомендацией.
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
  heading: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  copy: { flex: 1, gap: 3 },
  rhythmHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  items: { gap: spacing.xs },
  item: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
});
