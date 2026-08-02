import { useRef, useState } from 'react';
import { AccessibilityInfo, Keyboard, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { ChoiceCard } from '@/components/ChoiceCard';
import { OnboardingShell } from '@/components/OnboardingShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { profileLimits, validateProfileDraft, type ProfileValidationErrors } from '@/features/onboarding/onboardingState';
import { useAppStore } from '@/store/appStore';
import type { ActivityLevel, CalculationSex, ProfileDraft } from '@/types/domain';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

const activities: { value: ActivityLevel; title: string; description: string }[] = [
  { value: 'minimal', title: 'Низкая', description: 'Преимущественно сидячий день' },
  { value: 'medium', title: 'Умеренная', description: 'Прогулки и 1–3 тренировки' },
  { value: 'high', title: 'Высокая', description: 'Много движения или 4+ тренировок' },
];

export default function PersonalDataScreen() {
  const { colors } = useTheme();
  const draft = useAppStore((state) => state.draft);
  const saveDraft = useAppStore((state) => state.saveDraft);
  const recordErrors = useAppStore((state) => state.recordOnboardingValidationErrors);
  const [name, setName] = useState(draft.name);
  const [age, setAge] = useState(String(draft.age));
  const [height, setHeight] = useState(String(draft.heightCm));
  const [weight, setWeight] = useState(String(draft.weightKg));
  const [sex, setSex] = useState<CalculationSex>(draft.calculationSex);
  const [activity, setActivity] = useState<ActivityLevel>(draft.activityLevel === 'light' ? 'minimal' : draft.activityLevel === 'veryHigh' ? 'high' : draft.activityLevel);
  const [errors, setErrors] = useState<ProfileValidationErrors>({});
  const [busy, setBusy] = useState(false);
  const heightRef = useRef<TextInput>(null);
  const weightRef = useRef<TextInput>(null);

  const buildDraft = (): ProfileDraft => ({
    ...draft,
    name: name.replace(/\s+/g, ' ').trim(),
    age: Number(age.replace(',', '.')),
    heightCm: Number(height.replace(',', '.')),
    weightKg: Number(weight.replace(',', '.')),
    calculationSex: sex,
    activityLevel: activity,
  });

  const persistValid = () => {
    const candidate = buildDraft();
    if (!Object.keys(validateProfileDraft(candidate)).length) void saveDraft(candidate);
  };

  const next = async () => {
    const candidate = buildDraft();
    const validation = validateProfileDraft(candidate);
    setErrors(validation);
    const count = Object.keys(validation).length;
    if (count) {
      await recordErrors(count);
      AccessibilityInfo.announceForAccessibility('Проверь выделенные значения');
      return;
    }
    Keyboard.dismiss();
    setBusy(true);
    try {
      await saveDraft(candidate, 'preferences');
      router.push('/(onboarding)/preferences');
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingShell showBack fallbackRoute="/(onboarding)/goal" step={{ current: 2, total: 5 }} keyboard title="Настроим твой ориентир" description="Нужны только данные для существующего расчёта. Имя необязательно."
      footer={<PrimaryButton label="Учесть питание" loading={busy} onPress={next} />}>
      <View style={styles.fieldBlock}>
        <AppText variant="caption" tone="secondary">Как к тебе обращаться — необязательно</AppText>
        <TextInput value={name} onChangeText={setName} onBlur={persistValid} returnKeyType="next" onSubmitEditing={() => heightRef.current?.focus()} autoCapitalize="words" placeholder="Имя" placeholderTextColor={colors.textMuted} style={[styles.nameInput, { color: colors.textPrimary, backgroundColor: colors.surfaceStrong, borderColor: colors.glassBorder }]} />
      </View>
      <View style={styles.numericRow}>
        <NumericField label="Возраст" value={age} unit="лет" error={errors.age} onChangeText={setAge} returnKeyType="next" onSubmitEditing={() => heightRef.current?.focus()} onBlur={persistValid} />
        <NumericField inputRef={heightRef} label="Рост" value={height} unit="см" error={errors.heightCm} onChangeText={setHeight} returnKeyType="next" onSubmitEditing={() => weightRef.current?.focus()} onBlur={persistValid} />
        <NumericField inputRef={weightRef} label="Вес" value={weight} unit="кг" error={errors.weightKg} onChangeText={setWeight} returnKeyType="done" onSubmitEditing={Keyboard.dismiss} onBlur={persistValid} />
      </View>
      <AppText variant="heading">Параметр расчёта</AppText>
      <View style={styles.twoColumns}>
        <View style={styles.flex}><ChoiceCard title="Женский" selected={sex === 'female'} onPress={() => { setSex('female'); void saveDraft({ calculationSex: 'female' }); }} /></View>
        <View style={styles.flex}><ChoiceCard title="Мужской" selected={sex === 'male'} onPress={() => { setSex('male'); void saveDraft({ calculationSex: 'male' }); }} /></View>
      </View>
      <AppText variant="heading">Активность</AppText>
      {activities.map((option) => <ChoiceCard key={option.value} title={option.title} description={option.description} selected={activity === option.value} onPress={() => { setActivity(option.value); void saveDraft({ activityLevel: option.value }); }} />)}
      {Number(age) < 18 ? <AppText variant="caption" tone="warning">Для пользователей младше 18 лет ориентир использует только мягкую корректировку. Изменение веса стоит обсуждать со специалистом.</AppText> : null}
      <AppText variant="caption" tone="muted">Допустимо: {profileLimits.age.min}–{profileLimits.age.max} лет · {profileLimits.heightCm.min}–{profileLimits.heightCm.max} см · {profileLimits.weightKg.min}–{profileLimits.weightKg.max} кг</AppText>
    </OnboardingShell>
  );
}

function NumericField({ inputRef, label, value, unit, error, ...props }: TextInputProps & { inputRef?: React.RefObject<TextInput | null>; label: string; value: string; unit: string; error?: string }) {
  const { colors } = useTheme();
  return <View style={styles.numericField}>
    <AppText variant="caption" tone="secondary">{label}</AppText>
    <View style={[styles.numericInputWrap, { backgroundColor: colors.surfaceStrong, borderColor: error ? colors.danger : colors.glassBorder }]}>
      <TextInput ref={inputRef} accessibilityLabel={label} accessibilityHint={`Значение в ${unit}`} value={value} keyboardType="number-pad" selectTextOnFocus style={[styles.numericInput, { color: colors.textPrimary }]} {...props} />
      <AppText variant="caption" tone="muted">{unit}</AppText>
    </View>
    {error ? <AppText accessibilityLiveRegion="polite" variant="caption" tone="warning">{error}</AppText> : null}
  </View>;
}

const styles = StyleSheet.create({
  fieldBlock: { gap: spacing.xs },
  nameInput: { minHeight: 54, borderRadius: radii.md, borderWidth: 1, paddingHorizontal: spacing.md, fontSize: 17 },
  numericRow: { flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' },
  numericField: { flex: 1, minWidth: 0, gap: spacing.xs },
  numericInputWrap: { minHeight: 68, borderRadius: radii.md, borderWidth: 1, paddingHorizontal: spacing.xs, alignItems: 'center', justifyContent: 'center' },
  numericInput: { width: '100%', padding: 0, textAlign: 'center', fontSize: 22, lineHeight: 28, fontWeight: '700', fontVariant: ['tabular-nums'] },
  twoColumns: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
