import { useCallback, useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { Redirect, router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TabScreen } from '@/components/TabScreen';
import { clearDiaryForDevelopment, clearFlowForDevelopment, clearV3DemoData, createDemoV3Data, createTestStreak, inspectDevelopmentDatabase, recalculateAllDiaryAggregates, reseedForDevelopment } from '@/database/repositories/developerRepository';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';

export default function DeveloperScreen() {
  const initialize = useAppStore((state) => state.initialize); const setAvatar = useAppStore((state) => state.setAvatar); const { colors, mode, setMode } = useTheme(); const [inspection, setInspection] = useState<Awaited<ReturnType<typeof inspectDevelopmentDatabase>> | null>(null); const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => setInspection(await inspectDevelopmentDatabase()), []); useEffect(() => { if (__DEV__) void refresh(); }, [refresh]); if (!__DEV__) return <Redirect href="/(tabs)/profile" />;
  const run = async (label: string, action: () => Promise<void>) => { try { setBusy(true); await action(); await initialize(); await refresh(); Alert.alert('Готово', label); } catch (error) { Alert.alert('Ошибка', error instanceof Error ? error.message : 'Операция не выполнена'); } finally { setBusy(false); } };
  const confirm = (title: string, action: () => Promise<void>) => Alert.alert(title, 'Изменятся только локальные тестовые данные.', [{ text: 'Отмена', style: 'cancel' }, { text: 'Продолжить', style: 'destructive', onPress: () => { void run(title, action); } }]);
  return <TabScreen title="Диагностика" subtitle="Только development-сборка" headerRight={<Pressable style={[styles.close, { backgroundColor: colors.surface }]} onPress={() => router.back()}><AppText>×</AppText></Pressable>}>
    <GlassCard><AppText variant="heading">Среда</AppText><AppText tone="secondary">Приложение: {Constants.expoConfig?.version ?? '—'} · Expo SDK {Constants.expoConfig?.sdkVersion ?? '54'}</AppText><AppText tone="secondary">SQLite v{inspection?.version ?? '—'} · {inspection ? `${(inspection.databaseBytes / 1024 / 1024).toFixed(1)} МБ` : '—'}</AppText><AppText tone="secondary">Продукты {inspection?.products ?? '—'} · дневник {inspection?.entries ?? '—'} · коды {inspection?.coded ?? '—'}</AppText><AppText tone={inspection?.duplicateCodes ? 'warning' : 'green'}>Дубли кодов: {inspection?.duplicateCodes ?? '—'}</AppText></GlassCard>
    <GlassCard><AppText variant="heading">Данные APP v0.3</AppText><AppText tone="secondary">Вес {inspection?.weights ?? '—'} · вода {inspection?.water ?? '—'} · наборы {inspection?.templates ?? '—'} · поиски {inspection?.searches ?? '—'}</AppText><PrimaryButton label="Создать демо v0.3" secondary disabled={busy} onPress={() => run('Демо-данные v0.3 созданы', createDemoV3Data)} /><PrimaryButton label="Очистить демо v0.3" secondary disabled={busy} onPress={() => confirm('Очистить демо v0.3?', clearV3DemoData)} /></GlassCard>
    <GlassCard><AppText variant="heading">Тема</AppText><AppText tone="secondary">Текущий режим: {mode}</AppText><View style={styles.row}>{([['system', 'Система'], ['dark', 'Тёмная'], ['light', 'Светлая']] as const).map(([value, label]) => <View key={value} style={styles.flex}><PrimaryButton label={label} secondary={mode !== value} disabled={busy} onPress={() => { void setMode(value); }} /></View>)}</View></GlassCard>
    <GlassCard><AppText variant="heading">Тестовый Поток</AppText><View style={[styles.row, styles.wrap]}>{([3, 7, 14, 30] as const).map((days) => <View key={days} style={styles.half}><PrimaryButton label={`${days} дней`} secondary disabled={busy} onPress={() => run(`Создана серия ${days} дней`, () => createTestStreak(days))} /></View>)}</View><PrimaryButton label="Очистить только Поток" secondary disabled={busy} onPress={() => confirm('Очистить Поток?', clearFlowForDevelopment)} /></GlassCard>
    <GlassCard><AppText variant="heading">База и агрегаты</AppText><PrimaryButton label="Пересчитать агрегаты" secondary disabled={busy} onPress={() => run('Агрегаты пересчитаны', recalculateAllDiaryAggregates)} /><PrimaryButton label="Повторить seed" secondary disabled={busy} onPress={() => run('Seed выполнен', reseedForDevelopment)} /><PrimaryButton label="Очистить дневник" secondary disabled={busy} onPress={() => confirm('Очистить дневник?', clearDiaryForDevelopment)} /></GlassCard>
    <GlassCard><AppText variant="heading">Проверка интерфейса</AppText><PrimaryButton label="Очистить аватар" secondary disabled={busy} onPress={() => confirm('Очистить аватар?', () => setAvatar(null))} /><PrimaryButton label="Открыть универсальный поиск" secondary disabled={busy} onPress={() => router.push('/food-search')} /><PrimaryButton label="Открыть прогресс веса" secondary disabled={busy} onPress={() => router.push('/weight-progress')} /><PrimaryButton label="Открыть трекер воды" secondary disabled={busy} onPress={() => router.push('/water-tracker')} /><AppText variant="caption" tone="muted">После очистки демо-данных эти экраны позволяют проверить empty states и возврат по навигации.</AppText></GlassCard>
    <AppText variant="caption" tone="muted">Экран недоступен в production. Все действия локальны и не отправляют данные в сеть.</AppText>
  </TabScreen>;
}

const styles = StyleSheet.create({ close: { width: 42, height: 42, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' }, row: { flexDirection: 'row', gap: spacing.xs }, wrap: { flexWrap: 'wrap' }, flex: { flex: 1 }, half: { flexBasis: '46%', flexGrow: 1 } });
