import { useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { AppText } from '@/components/AppText';
import { ChoiceCard } from '@/components/ChoiceCard';
import { FilterChip } from '@/components/FilterChip';
import { FormField } from '@/components/FormField';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TabScreen } from '@/components/TabScreen';
import { getBuildInfo, isInternalBuild } from '@/config/buildInfo';
import { migrations } from '@/database/schema';
import { buildBetaFeedbackReport, type BetaFeedbackDraft } from '@/services/betaTesting';
import { getUiDiagnosticsSnapshot } from '@/services/uiDiagnostics';
import { useAppStore } from '@/store/appStore';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

const initial: BetaFeedbackDraft = { activity: '', unclear: '', screen: '', usabilityRating: 8, designRating: 8, rhythmRating: 8, wouldUse: 'maybe', comment: '' };

export default function BetaFeedbackScreen() {
  const { resolvedMode } = useTheme();
  const performanceMode = useAppStore((state) => state.performanceMode);
  const info = getBuildInfo();
  const [draft, setDraft] = useState(initial);
  if (!isInternalBuild(info)) return <Redirect href="/(tabs)/profile" />;
  const patch = <K extends keyof BetaFeedbackDraft>(key: K, value: BetaFeedbackDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    const report = buildBetaFeedbackReport(draft, { version: info.version, buildNumber: info.buildNumber, route: getUiDiagnosticsSnapshot().currentRoute, theme: resolvedMode, performanceMode, databaseVersion: migrations.at(-1)?.version ?? '—', appVariant: info.appVariant });
    await Share.share({ title: 'Отзыв о Точке Роста Beta', message: JSON.stringify(report, null, 2) });
    Alert.alert('Отчёт подготовлен', 'Он передан только выбранному тобой приложению через системное меню Share.');
  };
  return <TabScreen title="Обратная связь" subtitle="Локальный отчёт тестировщика" fallbackRoute="/beta-center">
    <GlassCard variant="compact"><AppText variant="caption" tone="secondary">Автоматически добавляются только версия, build number, route, тема, режим эффектов, версия базы и app variant.</AppText></GlassCard>
    <FormField label="Что ты делал?" value={draft.activity} onChangeText={(value) => patch('activity', value)} placeholder="Например, проходил первый запуск" multiline />
    <FormField label="Что было непонятно?" value={draft.unclear} onChangeText={(value) => patch('unclear', value)} placeholder="Коротко опиши момент" multiline />
    <FormField label="На каком экране возникла проблема?" value={draft.screen} onChangeText={(value) => patch('screen', value)} placeholder="Например, Личный ориентир" />
    <Rating label="Удобство" value={draft.usabilityRating} onChange={(value) => patch('usabilityRating', value)} />
    <Rating label="Дизайн" value={draft.designRating} onChange={(value) => patch('designRating', value)} />
    <Rating label="Ритм" value={draft.rhythmRating} onChange={(value) => patch('rhythmRating', value)} />
    <AppText variant="heading">Стал бы пользоваться?</AppText>
    <ChoiceCard title="Да" selected={draft.wouldUse === 'yes'} onPress={() => patch('wouldUse', 'yes')} />
    <ChoiceCard title="Возможно" selected={draft.wouldUse === 'maybe'} onPress={() => patch('wouldUse', 'maybe')} />
    <ChoiceCard title="Нет" selected={draft.wouldUse === 'no'} onPress={() => patch('wouldUse', 'no')} />
    <FormField label="Свободный комментарий" value={draft.comment} onChangeText={(value) => patch('comment', value)} placeholder="Что ещё важно знать?" multiline />
    <PrimaryButton label="Поделиться отчётом" onPress={submit} />
    <AppText variant="caption" tone="muted">Имя, вес, возраст, дневник, аллергены и фотографии не прикладываются автоматически.</AppText>
  </TabScreen>;
}

function Rating({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <View style={styles.rating}><AppText variant="heading">{label}: {value}/10</AppText><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{Array.from({ length: 10 }, (_, index) => index + 1).map((rating) => <FilterChip key={rating} label={String(rating)} selected={value === rating} onPress={() => onChange(rating)} />)}</ScrollView></View>;
}

const styles = StyleSheet.create({ rating: { gap: spacing.sm }, chips: { gap: spacing.xs } });
