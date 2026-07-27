import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { ChoiceCard } from '@/components/ChoiceCard';
import { NumberStepper } from '@/components/NumberStepper';
import { OnboardingShell } from '@/components/OnboardingShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { AppText } from '@/components/AppText';
import { useAppStore } from '@/store/appStore';
import type { CalculationSex } from '@/types/domain';
import { spacing } from '@/theme/tokens';

export default function PersonalDataScreen() {
  const draft = useAppStore((state) => state.draft);
  const saveDraft = useAppStore((state) => state.saveDraft);
  const [sex, setSex] = useState<CalculationSex>(draft.calculationSex);
  const [age, setAge] = useState(draft.age);
  const next = async () => { await saveDraft({ calculationSex: sex, age }, 'body-parameters'); router.push('/(onboarding)/body-parameters'); };
  return (
    <OnboardingShell progress={33} title="Личные данные" description="Эти данные нужны только для ориентировочного расчёта энергозатрат. Информация не отправляется на сервер."
      footer={<PrimaryButton label="Продолжить" onPress={next} />}>
      <View style={{ gap: spacing.sm }}><ChoiceCard title="Женский" selected={sex === 'female'} onPress={() => setSex('female')} /><ChoiceCard title="Мужской" selected={sex === 'male'} onPress={() => setSex('male')} /></View>
      <NumberStepper label="Возраст" value={age} unit="лет" min={16} max={80} onChange={setAge} />
      {age < 18 ? <AppText variant="caption" tone="warning">Расчёт является демонстрационным. Изменение веса в подростковом возрасте рекомендуется обсуждать со специалистом.</AppText> : null}
    </OnboardingShell>
  );
}
