import { useState } from 'react';
import { router } from 'expo-router';
import { ChoiceCard } from '@/components/ChoiceCard';
import { OnboardingShell } from '@/components/OnboardingShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { activityOptions } from '@/constants/options';
import { useAppStore } from '@/store/appStore';
import type { ActivityLevel } from '@/types/domain';

export default function ActivityScreen() {
  const draft = useAppStore((state) => state.draft);
  const saveDraft = useAppStore((state) => state.saveDraft);
  const [activity, setActivity] = useState<ActivityLevel>(draft.activityLevel);
  const next = async () => { await saveDraft({ activityLevel: activity }, 'goal'); router.push('/(onboarding)/goal'); };
  return (
    <OnboardingShell progress={56} title="Как проходит твоя неделя?" description="Выбери вариант, который лучше всего описывает обычную неделю."
      footer={<PrimaryButton label="Продолжить" onPress={next} />}>
      {activityOptions.map((option) => <ChoiceCard key={option.value} title={option.title} description={option.description} selected={activity === option.value} onPress={() => setActivity(option.value)} />)}
    </OnboardingShell>
  );
}
