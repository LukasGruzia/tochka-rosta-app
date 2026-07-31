import { useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { FilterChip } from '@/components/FilterChip';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TabScreen } from '@/components/TabScreen';
import {
  completeResearchSession,
  exportResearchCsv,
  exportResearchJson,
  recordResearchEvent,
  startResearchSession,
} from '@/database/repositories/researchRepository';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';

const scenarioEvents = [
  ['food_search', 'Использован поиск'],
  ['food_added', 'Добавлен продукт'],
  ['qr_used', 'Использован QR'],
  ['rhythm_used', 'Открыт Ритм'],
  ['recommendation_accepted', 'Принята рекомендация'],
  ['remainder_used', 'Закрыт остаток'],
  ['day_completed', 'Закрыт день'],
  ['back_navigation', 'Возврат назад'],
  ['user_error', 'Возникла ошибка'],
] as const;

export default function ResearchModeScreen() {
  const { colors } = useTheme();
  const [session, setSession] = useState<{ id: number; uuid: string; startedAt: string } | null>(null);
  const [idea, setIdea] = useState(8);
  const [ease, setEase] = useState(8);
  const [flowUnderstood, setFlowUnderstood] = useState(true);
  const [rhythmUseful, setRhythmUseful] = useState(true);
  const [wouldUse, setWouldUse] = useState(true);
  const [unclear, setUnclear] = useState('');
  const [best, setBest] = useState('Закрыть остаток');
  const [difficulties, setDifficulties] = useState('');

  const begin = async () => {
    const next = await startResearchSession();
    setSession(next);
    await recordResearchEvent(next.id, 'scenario_started', 'research', { consent: true });
  };
  const finish = async () => {
    if (!session) return;
    await recordResearchEvent(session.id, 'scenario_completed', 'research', { survey: true });
    await completeResearchSession(session.id, {
      idea,
      ease,
      flowUnderstood,
      rhythmUseful,
      wouldUse,
      unclear,
      best,
      difficulties,
    });
    Alert.alert('Спасибо', 'Ответы сохранены анонимно и только на этом устройстве.');
    setSession(null);
  };
  const exportFiles = async () => {
    try {
      const [csv, json] = await Promise.all([exportResearchCsv(), exportResearchJson()]);
      for (const [type, content, mime] of [
        ['csv', csv, 'text/csv'],
        ['json', JSON.stringify(json, null, 2), 'application/json'],
      ] as const) {
        const uri = `${FileSystem.cacheDirectory}tochka-rosta-research.${type}`;
        await FileSystem.writeAsStringAsync(uri, content);
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: mime });
      }
    } catch (error) {
      Alert.alert('Не удалось экспортировать', error instanceof Error ? error.message : 'Попробуйте ещё раз');
    }
  };
  const log = async (type: string) => {
    if (session) await recordResearchEvent(session.id, type, 'guided_research', { anonymous: true });
  };

  return (
    <TabScreen
      title="Исследовательский режим"
      subtitle="Анонимное локальное тестирование"
      headerRight={(
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Закрыть исследовательский режим"
          style={[styles.close, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <AppText>×</AppText>
        </Pressable>
      )}
    >
      {!session ? (
        <>
          <GlassCard variant="accent">
            <AppText variant="heading">Перед началом</AppText>
            <AppText tone="secondary">
              Режим фиксирует время, переходы, способы добавления и ошибки сценария. Имя,
              фотографии, параметры профиля и точные пищевые данные не записываются.
            </AppText>
          </GlassCard>
          <PrimaryButton label="Начать тестирование" onPress={begin} />
          <PrimaryButton label="Экспортировать CSV и JSON" secondary onPress={exportFiles} />
        </>
      ) : (
        <>
          <GlassCard variant="compact">
            <AppText variant="caption" tone="green">ТЕСТ ИДЁТ</AppText>
            <AppText variant="heading">Отметки сценария</AppText>
            <AppText tone="secondary">
              Нажимайте после выполненного действия. Записывается только тип события.
            </AppText>
            <View style={styles.ratings}>
              {scenarioEvents.map(([type, label]) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  key={type}
                  style={[styles.event, { borderColor: colors.glassBorder }]}
                  onPress={() => void log(type)}
                >
                  <AppText variant="caption" tone="green">+ {label}</AppText>
                </Pressable>
              ))}
            </View>
          </GlassCard>
          <Rating label="Насколько понятна идея приложения?" value={idea} onChange={setIdea} />
          <Rating label="Насколько легко добавить продукт?" value={ease} onChange={setEase} />
          <YesNo label="Понятна ли механика Потока?" value={flowUnderstood} onChange={setFlowUnderstood} />
          <YesNo label="Полезен ли Ритм?" value={rhythmUseful} onChange={setRhythmUseful} />
          <YesNo label="Стали бы вы пользоваться приложением?" value={wouldUse} onChange={setWouldUse} />
          <Field label="Что было непонятно?" value={unclear} onChange={setUnclear} />
          <Field label="Какая функция понравилась больше всего?" value={best} onChange={setBest} />
          <Field label="Где возникли сложности?" value={difficulties} onChange={setDifficulties} />
          <PrimaryButton label="Завершить и сохранить" onPress={finish} />
        </>
      )}
    </TabScreen>
  );
}

function Rating({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <GlassCard variant="compact">
      <AppText style={styles.bold}>{label}</AppText>
      <View style={styles.ratings}>
        {Array.from({ length: 10 }, (_, index) => index + 1).map((item) => (
          <FilterChip key={item} label={String(item)} selected={value === item} onPress={() => onChange(item)} />
        ))}
      </View>
    </GlassCard>
  );
}

function YesNo({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <GlassCard variant="compact">
      <AppText style={styles.bold}>{label}</AppText>
      <View style={styles.ratings}>
        <FilterChip label="Да" selected={value} onPress={() => onChange(true)} />
        <FilterChip label="Нет" selected={!value} onPress={() => onChange(false)} />
      </View>
    </GlassCard>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const { colors } = useTheme();
  return (
    <GlassCard variant="compact">
      <AppText style={styles.bold}>{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        multiline
        style={[styles.input, { color: colors.textPrimary, borderColor: colors.glassBorder, backgroundColor: colors.surface }]}
      />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  ratings: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  event: { minHeight: 44, borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  bold: { fontWeight: '700' },
  input: { minHeight: 72, borderWidth: 1, borderRadius: radii.md, padding: spacing.md, marginTop: spacing.sm, textAlignVertical: 'top' },
});
