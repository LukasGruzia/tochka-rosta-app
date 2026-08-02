import { useState } from 'react';
import { router } from 'expo-router';
import { ChoiceCard } from '@/components/ChoiceCard';
import { OnboardingShell } from '@/components/OnboardingShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { goalOptions } from '@/constants/options';
import { useAppStore } from '@/store/appStore';
import type { Goal } from '@/types/domain';

const goalIcons: Record<Goal, string> = { balance: '◎', loss: '↘', gain: '↗', regular: '◷' };

export default function GoalScreen() {
  const persistedGoal = useAppStore((state) => state.onboardingState.selectedGoal);
  const saveDraft = useAppStore((state) => state.saveDraft);
  const [goal, setGoal] = useState<Goal | null>(persistedGoal);
  const [busy, setBusy] = useState(false);

  const select = (value: Goal) => {
    setGoal(value);
    void saveDraft({ goal: value });
  };

  const next = async () => {
    if (!goal) return;
    setBusy(true);
    try {
      await saveDraft({ goal }, 'profile');
      router.push('/(onboarding)/personal-data');
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingShell showBack fallbackRoute="/(onboarding)/welcome" step={{ current: 1, total: 5 }} title="Что для тебя сейчас важнее?" description="Выбор можно изменить позже в профиле."
      footer={<PrimaryButton label="Продолжить к параметрам" loading={busy} disabled={!goal} onPress={next} />}>
      {goalOptions.map((option) => <ChoiceCard key={option.value} icon={goalIcons[option.value]} title={option.title} description={option.description} selected={goal === option.value} onPress={() => select(option.value)} />)}
    </OnboardingShell>
  );
}
