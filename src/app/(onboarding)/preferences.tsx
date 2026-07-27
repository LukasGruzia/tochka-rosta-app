import { useState } from 'react';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { ChoiceCard } from '@/components/ChoiceCard';
import { GlassCard } from '@/components/GlassCard';
import { OnboardingShell } from '@/components/OnboardingShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { dietOptions, restrictionOptions } from '@/constants/options';
import { useAppStore } from '@/store/appStore';
import type { DietPreference, Restriction } from '@/types/domain';

export default function PreferencesScreen() {
  const draft = useAppStore((state) => state.draft);
  const saveDraft = useAppStore((state) => state.saveDraft);
  const [diet, setDiet] = useState<DietPreference>(draft.dietPreference);
  const [restrictions, setRestrictions] = useState<Restriction[]>(draft.restrictions);
  const toggle = (value: Restriction) => setRestrictions((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  const next = async () => { await saveDraft({ dietPreference: diet, restrictions }, 'calculation'); router.push('/(onboarding)/calculation'); };
  return (
    <OnboardingShell progress={78} title="Что учитывать в рационе?" description="На первом этапе это фильтры профиля — полная медицинская обработка аллергий появится позже."
      footer={<PrimaryButton label="Рассчитать мой день" onPress={next} />}>
      <AppText variant="heading">Тип питания</AppText>
      {dietOptions.map((option) => <ChoiceCard key={option.value} title={option.title} selected={diet === option.value} onPress={() => setDiet(option.value)} />)}
      <AppText variant="heading" style={{ marginTop: 8 }}>Ограничения</AppText>
      {restrictionOptions.map((option) => <ChoiceCard key={option.value} title={option.title} selected={restrictions.includes(option.value)} onPress={() => toggle(option.value)} />)}
      <GlassCard variant="compact"><AppText variant="caption" tone="warning">Всегда проверяй состав и маркировку продукта при наличии аллергии.</AppText></GlassCard>
    </OnboardingShell>
  );
}
