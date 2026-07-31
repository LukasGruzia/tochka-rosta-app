import { useEffect, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import { Alert, Pressable, StyleSheet } from "react-native";
import { AppText } from "@/components/AppText";
import { createSectionErrorBoundary } from "@/components/ScreenErrorFallback";
import { GlassCard } from "@/components/GlassCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { TabScreen } from "@/components/TabScreen";
import {
  createLocalBackup,
  restoreLocalBackup,
  summarizeBackup,
} from "@/database/repositories/dataRepository";
import {
  getSetting,
  setSetting,
} from "@/database/repositories/settingsRepository";
import { useAppStore } from "@/store/appStore";
import { useTheme } from "@/theme/ThemeProvider";
import { radii } from "@/theme/tokens";
import { safelyRunHaptic } from "@/services/haptics";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";
export const ErrorBoundary = createSectionErrorBoundary("DataManagementScreen");
export default function DataManagementScreen() {
  const initialize = useAppStore((state) => state.initialize);
  const { colors } = useTheme();
  const { flags } = useFeatureFlags();
  const [busy, setBusy] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void getSetting("last_export_at").then((value) => {
      if (active) setLastExport(value);
    });
    return () => {
      active = false;
    };
  }, []);
  const exportData = async () => {
    try {
      setBusy(true);
      const backup = await createLocalBackup();
      const uri = `${FileSystem.cacheDirectory}tochka-rosta-backup-${backup.createdAt.slice(0, 10)}.json`;
      await FileSystem.writeAsStringAsync(
        uri,
        JSON.stringify(backup, null, 2),
        { encoding: FileSystem.EncodingType.UTF8 },
      );
      await setSetting("last_export_at", backup.createdAt);
      setLastExport(backup.createdAt);
      if (flags.enableHaptics) await safelyRunHaptic("success");
      if (await Sharing.isAvailableAsync())
        await Sharing.shareAsync(uri, {
          mimeType: "application/json",
          dialogTitle: "Сохранить резервную копию",
        });
      else Alert.alert("Файл готов", uri);
    } catch (error) {
      Alert.alert(
        "Не удалось создать копию",
        error instanceof Error ? error.message : "Попробуй ещё раз",
      );
    } finally {
      setBusy(false);
    }
  };
  const importData = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    try {
      setBusy(true);
      const text = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const value = JSON.parse(text) as unknown;
      const summary = summarizeBackup(value);
      setBusy(false);
      Alert.alert(
        "Проверка пройдена",
        `Копия от ${new Date(summary.createdAt).toLocaleString("ru-RU")}\nПрофиль: ${summary.profile}\nСвои продукты: ${summary.customProducts}\nДневник: ${summary.diaryEntries}\nВода: ${summary.waterEntries}\nВес: ${summary.weightEntries}\nПланы недели: ${summary.weeklyPlans}\nРекомендации Ритма: ${summary.rhythmRecommendations}\nПредпочтения Ритма: ${summary.rhythmPreferences}\nФото профиля не входит в копию.`,
        [
          { text: "Отмена", style: "cancel" },
          {
            text: "Восстановить",
            style: "destructive",
            onPress: async () => {
              try {
                setBusy(true);
                const current = await createLocalBackup();
                const safetyUri = `${FileSystem.cacheDirectory}tochka-rosta-before-restore.json`;
                await FileSystem.writeAsStringAsync(
                  safetyUri,
                  JSON.stringify(current),
                );
                await restoreLocalBackup(value);
                await initialize();
                if (flags.enableHaptics) await safelyRunHaptic("success");
                Alert.alert(
                  "Данные восстановлены",
                  "Повторный импорт той же копии заблокирован. Фото профиля очищено, чтобы не оставлять нерабочий URI.",
                );
              } catch (error) {
                Alert.alert(
                  "Не удалось восстановить",
                  error instanceof Error
                    ? error.message
                    : "Текущие данные не изменены",
                );
              } finally {
                setBusy(false);
              }
            },
          },
        ],
      );
    } catch (error) {
      setBusy(false);
      Alert.alert(
        "Файл не прошёл проверку",
        error instanceof Error ? error.message : "Повреждённый JSON",
      );
    }
  };
  return (
    <TabScreen
      title="Резервная копия данных"
      subtitle="Версионируемый локальный JSON"
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
        <AppText variant="heading">Полная локальная копия</AppText>
        <AppText tone="secondary">
          Профиль, настройки, свои продукты, рецепты, дневник, вода, вес,
          избранное, наборы, планы, покупки, Поток, достижения, история поиска и локальная история Ритма.
        </AppText>
        {lastExport ? (
          <AppText variant="caption" tone="green">
            Последний экспорт: {new Date(lastExport).toLocaleString("ru-RU")}
          </AppText>
        ) : (
          <AppText variant="caption" tone="muted">
            Экспорт ещё не выполнялся
          </AppText>
        )}
      </GlassCard>
      <PrimaryButton
        label={busy ? "Подождите…" : "Экспортировать данные"}
        disabled={busy}
        onPress={exportData}
      />
      <PrimaryButton
        label="Импортировать резервную копию"
        secondary
        disabled={busy}
        onPress={importData}
      />
      <GlassCard variant="compact">
        <AppText variant="heading">Безопасное восстановление</AppText>
        <AppText tone="secondary">
          Формат и версия проверяются до изменения базы. Перед импортом
          создаётся временная копия текущих данных; транзакция не допускает
          частичного восстановления и дубликатов.
        </AppText>
      </GlassCard>
      <GlassCard variant="compact">
        <AppText variant="heading">Фото профиля</AppText>
        <AppText tone="secondary">
          Аватар не включается в JSON. После импорта его нужно выбрать заново —
          так копия не оставляет ссылку на отсутствующий локальный файл.
        </AppText>
      </GlassCard>
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
});
