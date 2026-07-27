import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { TabScreen } from '@/components/TabScreen';
import { getLocalDataSummary } from '@/database/repositories/dataRepository';
import { colors, radii } from '@/theme/tokens';

export default function DeveloperScreen() { const [summary, setSummary] = useState<Awaited<ReturnType<typeof getLocalDataSummary>> | null>(null); useEffect(() => { void getLocalDataSummary().then(setSummary); }, []); return <TabScreen title="Диагностика" subtitle="Локальное состояние приложения" headerRight={<Pressable style={styles.close} onPress={() => router.back()}><AppText>×</AppText></Pressable>}><GlassCard><AppText variant="heading">Среда</AppText><AppText tone="secondary">Приложение: {Constants.expoConfig?.version ?? '—'}</AppText><AppText tone="secondary">Expo SDK: {Constants.expoConfig?.sdkVersion ?? '54'}</AppText><AppText tone="secondary">Runtime: {Constants.executionEnvironment}</AppText></GlassCard><GlassCard><AppText variant="heading">SQLite v2</AppText><AppText tone="secondary">Продукты: {summary?.products ?? '—'}</AppText><AppText tone="secondary">Записи дневника: {summary?.diary ?? '—'}</AppText><AppText tone="secondary">Рецепты: {summary?.recipes ?? '—'}</AppText><AppText tone="secondary">Сканирования: {summary?.scans ?? '—'}</AppText></GlassCard><GlassCard><AppText variant="heading">Источники</AppText>{summary?.sources.map((source) => <AppText key={source.source_type} tone="secondary">{source.source_type}: {source.count}</AppText>)}</GlassCard><AppText variant="caption" tone="muted">Экран только для диагностики. Он не отправляет данные и не изменяет базу.</AppText></TabScreen>; }
const styles = StyleSheet.create({ close: { width: 42, height: 42, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }, });
