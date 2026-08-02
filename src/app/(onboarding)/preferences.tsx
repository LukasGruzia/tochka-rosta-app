import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { ChoiceCard } from '@/components/ChoiceCard';
import { OnboardingShell } from '@/components/OnboardingShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { dietOptions, restrictionOptions } from '@/constants/options';
import { useAppStore } from '@/store/appStore';
import type { DietPreference, Restriction } from '@/types/domain';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function PreferencesScreen() {
  const { colors } = useTheme();
  const draft = useAppStore((state) => state.draft);
  const saveDraft = useAppStore((state) => state.saveDraft);
  const [diet, setDiet] = useState<DietPreference>(draft.dietPreference);
  const [restrictions, setRestrictions] = useState<Restriction[]>(draft.restrictions);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const chooseDiet = (value: DietPreference) => {
    setDiet(value);
    void saveDraft({ dietPreference: value });
  };
  const toggle = (value: Restriction) => {
    const next = restrictions.includes(value) ? restrictions.filter((item) => item !== value) : [...restrictions, value];
    setRestrictions(next);
    void saveDraft({ restrictions: next });
  };
  const next = async () => {
    setBusy(true);
    try {
      await saveDraft({ dietPreference: diet, restrictions }, 'result');
      router.push('/(onboarding)/calculation');
    } finally {
      setBusy(false);
    }
  };

  return <>
    <OnboardingShell showBack fallbackRoute="/(onboarding)/personal-data" step={{ current: 3, total: 5 }} title="Что учитывать в питании?" description="Быстрый выбор сейчас, подробности можно настроить позже."
      footer={<View style={styles.actions}>
        <PrimaryButton label="Получить личный ориентир" loading={busy} onPress={next} />
        <Pressable accessibilityRole="button" accessibilityLabel="Настроить ограничения позже" onPress={next} hitSlop={8} style={styles.later}><AppText tone="secondary">Настроить позже</AppText></Pressable>
      </View>}>
      <AppText variant="heading">Предпочтения</AppText>
      {dietOptions.map((option) => <ChoiceCard key={option.value} title={option.title} selected={diet === option.value} onPress={() => chooseDiet(option.value)} />)}
      <AppText variant="heading" style={styles.section}>Ограничения</AppText>
      <ChoiceCard title="Без ограничений" description="Самый быстрый вариант" selected={!restrictions.length} onPress={() => { setRestrictions([]); void saveDraft({ restrictions: [] }); }} />
      <ChoiceCard title="Аллергии или исключения" description={restrictions.length ? `Выбрано: ${restrictions.length}` : 'Указать продукты, которые важно исключить'} selected={Boolean(restrictions.length)} onPress={() => setDetailsVisible(true)} />
      <AppText variant="caption" tone="secondary">Разрешения камеры, фотографий и уведомлений сейчас не запрашиваются.</AppText>
    </OnboardingShell>

    <Modal visible={detailsVisible} transparent animationType="slide" onRequestClose={() => setDetailsVisible(false)}>
      <Pressable accessibilityLabel="Закрыть ограничения" style={[styles.scrim, { backgroundColor: colors.blackScrim }]} onPress={() => setDetailsVisible(false)} />
      <View style={[styles.sheet, { backgroundColor: colors.surfaceSolid, borderColor: colors.glassBorderStrong }]}>
        <View style={[styles.handle, { backgroundColor: colors.textMuted }]} />
        <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          <View style={styles.sheetHeader}><AppText variant="title">Что исключить?</AppText><AppText tone="secondary">Эти отметки считаются строгими ограничениями для рекомендаций.</AppText></View>
          {restrictionOptions.map((option) => <ChoiceCard key={option.value} title={option.title} selected={restrictions.includes(option.value)} onPress={() => toggle(option.value)} />)}
          <AppText variant="caption" tone="warning">При аллергии всегда проверяй состав и маркировку продукта.</AppText>
          <PrimaryButton label="Сохранить ограничения" onPress={() => setDetailsVisible(false)} />
        </ScrollView>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm }, later: { minHeight: 44, alignItems: 'center', justifyContent: 'center' }, section: { marginTop: spacing.sm },
  scrim: { ...StyleSheet.absoluteFillObject }, sheet: { maxHeight: '82%', position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, borderWidth: 1 },
  handle: { alignSelf: 'center', width: 42, height: 5, borderRadius: radii.pill, marginTop: spacing.sm }, sheetContent: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md }, sheetHeader: { gap: spacing.xs, marginBottom: spacing.xs },
});
