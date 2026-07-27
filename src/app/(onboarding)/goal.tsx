import { useState } from 'react';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { ChoiceCard } from '@/components/ChoiceCard';
import { OnboardingShell } from '@/components/OnboardingShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { goalOptions } from '@/constants/options';
import { useAppStore } from '@/store/appStore';
import type { Goal } from '@/types/domain';

export default function GoalScreen() {
  const draft = useAppStore((state) => state.draft);
  const saveDraft = useAppStore((state) => state.saveDraft);
  const [goal, setGoal] = useState<Goal>(draft.goal);
  const next = async () => { await saveDraft({ goal }, 'preferences'); router.push('/(onboarding)/preferences'); };
  return (
    <OnboardingShell progress={67} title="К чему ты стремишься?" description="Мы используем мягкую корректировку — без экстремального дефицита или профицита."
      footer={<PrimaryButton label="Продолжить" onPress={next} />}>
      {goalOptions.map((option) => <ChoiceCard key={option.value} title={option.title} description={option.description} selected={goal === option.value} onPress={() => setGoal(option.value)} />)}
      {draft.age < 18 ? <AppText variant="caption" tone="warning">Для пользователей младше 18 лет корректировка ограничена 5%. Обсуди изменение веса со специалистом.</AppText> : null}
    </OnboardingShell>
  );
}
