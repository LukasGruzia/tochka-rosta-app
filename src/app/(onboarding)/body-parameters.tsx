import { useState } from 'react';
import { router } from 'expo-router';
import { NumberStepper } from '@/components/NumberStepper';
import { OnboardingShell } from '@/components/OnboardingShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAppStore } from '@/store/appStore';

export default function BodyParametersScreen() {
  const draft = useAppStore((state) => state.draft);
  const saveDraft = useAppStore((state) => state.saveDraft);
  const [heightCm, setHeight] = useState(draft.heightCm);
  const [weightKg, setWeight] = useState(draft.weightKg);
  const next = async () => { await saveDraft({ heightCm, weightKg }, 'activity'); router.push('/(onboarding)/activity'); };
  return (
    <OnboardingShell progress={44} keyboard title="Расскажи немного о себе." description="Параметры можно будет изменить в профиле в любой момент."
      footer={<PrimaryButton label="Продолжить" onPress={next} />}>
      <NumberStepper label="Рост" value={heightCm} unit="см" min={120} max={230} onChange={setHeight} />
      <NumberStepper label="Вес" value={weightKg} unit="кг" min={35} max={250} onChange={setWeight} />
    </OnboardingShell>
  );
}
