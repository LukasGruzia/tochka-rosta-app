import { Alert, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { FilterChip } from '@/components/FilterChip';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TabScreen } from '@/components/TabScreen';
import { RhythmCharacter } from '@/features/rhythm/components/RhythmCharacter';
import { useRhythmOverlay } from '@/features/rhythm/components/RhythmOverlayProvider';
import {
  clearRhythmHintHistory,
  resetRhythmPreferences,
} from '@/features/rhythm/repositories/rhythmRepository';
import type { RhythmMode } from '@/features/rhythm/types/rhythm';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const modes: { value: RhythmMode; label: string; description: string }[] = [
  { value: 'active', label: 'Активный', description: 'Больше уместных инициативных подсказок.' },
  { value: 'balanced', label: 'Баланс', description: 'Редкие подсказки после важных действий.' },
  { value: 'quiet', label: 'Тихий', description: 'Только важные ответы и подсказки по запросу.' },
  { value: 'off', label: 'Выкл.', description: 'Ритм остаётся в Потоке без сообщений.' },
];

export default function RhythmSettingsScreen() {
  const { settings, updateSettings } = useRhythmOverlay();
  const { colors } = useTheme();
  if (!settings) {
    return (
      <TabScreen title="Настройки Ритма">
        <AppText tone="secondary">Загружаем локальные настройки…</AppText>
      </TabScreen>
    );
  }
  const patch = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) =>
    updateSettings({ ...settings, [key]: value });
  return (
    <TabScreen title="Настройки Ритма" subtitle="Помощник работает только на устройстве">
      <GlassCard variant="accent">
        <View style={styles.hero}>
          <RhythmCharacter size="medium" emotion="happy" action="wave" />
          <View style={styles.grow}>
            <AppText variant="heading">Ритм</AppText>
            <AppText tone="secondary">
              Энергия, забота и рост — без облачного AI и медицинских обещаний.
            </AppText>
          </View>
        </View>
      </GlassCard>
      <GlassCard>
        <SettingRow
          label="Помощник включён"
          value={settings.enabled}
          onChange={(value) => void updateSettings({
            ...settings,
            enabled: value,
            mode: value && settings.mode === 'off' ? 'balanced' : settings.mode,
          })}
          color={colors.greenPrimary}
        />
        <AppText variant="heading">Режим общения</AppText>
        <View style={styles.chips}>
          {modes.map((mode) => (
            <FilterChip
              key={mode.value}
              label={mode.label}
              selected={settings.mode === mode.value}
              onPress={() => void updateSettings({
                ...settings,
                mode: mode.value,
                enabled: mode.value !== 'off',
              })}
            />
          ))}
        </View>
        <AppText tone="secondary">
          {modes.find((mode) => mode.value === settings.mode)?.description}
        </AppText>
      </GlassCard>
      <GlassCard>
        <AppText variant="heading">Содержание подсказок</AppText>
        <SettingRow label="Реакции после еды" value={settings.reactionsEnabled} onChange={(value) => void patch('reactionsEnabled', value)} color={colors.greenPrimary} />
        <SettingRow label="Рекомендации" value={settings.recommendationsEnabled} onChange={(value) => void patch('recommendationsEnabled', value)} color={colors.greenPrimary} />
        <SettingRow label="Учитывать бюджет" value={settings.budgetEnabled} onChange={(value) => void patch('budgetEnabled', value)} color={colors.greenPrimary} />
        <SettingRow label="Учитывать историю выбора" value={settings.historyEnabled} onChange={(value) => void patch('historyEnabled', value)} color={colors.greenPrimary} />
      </GlassCard>
      <GlassCard>
        <AppText variant="heading">Интерфейс</AppText>
        <SettingRow label="Подсказки на других экранах" value={settings.showOnOtherScreens} onChange={(value) => void patch('showOnOtherScreens', value)} color={colors.greenPrimary} />
        <SettingRow label="Анимации персонажа" value={settings.animationsEnabled} onChange={(value) => void patch('animationsEnabled', value)} color={colors.greenPrimary} />
        <SettingRow label="Тактильный отклик" value={settings.hapticsEnabled} onChange={(value) => void patch('hapticsEnabled', value)} color={colors.greenPrimary} />
        <SettingRow label="Звуки интерфейса" value={settings.interfaceSoundsEnabled} onChange={(value) => void patch('interfaceSoundsEnabled', value)} color={colors.greenPrimary} />
        <AppText variant="caption" tone="muted">
          Звуки выключены по умолчанию. Приложение не воспроизводит их без этого разрешения.
        </AppText>
      </GlassCard>
      <GlassCard>
        <AppText variant="heading">Знакомство и обучение</AppText>
        <AppText tone="secondary">
          Можно снова открыть короткое знакомство на экране Потока.
        </AppText>
        <PrimaryButton
          label="Показать знакомство снова"
          secondary
          onPress={async () => {
            await patch('onboardingCompleted', false);
            router.replace('/(tabs)/flow');
          }}
        />
      </GlassCard>
      <GlassCard>
        <AppText variant="heading">Локальная история Ритма</AppText>
        <AppText tone="secondary">
          Эти действия не затрагивают профиль, дневник, продукты, SQLite или Поток.
        </AppText>
        <PrimaryButton
          label="Сбросить предпочтения"
          secondary
          onPress={() => Alert.alert(
            'Сбросить предпочтения Ритма?',
            'Будут забыты только оценки выбранных и отклонённых продуктов.',
            [
              { text: 'Отмена', style: 'cancel' },
              { text: 'Сбросить', style: 'destructive', onPress: () => void resetRhythmPreferences().then(() => Alert.alert('Готово', 'Предпочтения Ритма очищены.')) },
            ],
          )}
        />
        <PrimaryButton
          label="Очистить историю подсказок"
          secondary
          onPress={() => Alert.alert(
            'Очистить историю подсказок?',
            'Настройки и предпочтения останутся без изменений.',
            [
              { text: 'Отмена', style: 'cancel' },
              { text: 'Очистить', style: 'destructive', onPress: () => void clearRhythmHintHistory().then(() => Alert.alert('Готово', 'История подсказок очищена.')) },
            ],
          )}
        />
      </GlassCard>
      <PrimaryButton label="Готово" onPress={() => router.back()} />
    </TabScreen>
  );
}

function SettingRow({ label, value, onChange, color }: { label: string; value: boolean; onChange: (value: boolean) => void; color: string }) {
  return (
    <View style={styles.row}>
      <AppText style={styles.grow}>{label}</AppText>
      <Switch
        accessibilityLabel={label}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: color }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grow: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.md },
  row: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
