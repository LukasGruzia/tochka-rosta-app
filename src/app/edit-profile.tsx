import { useState } from 'react';
import { router } from 'expo-router';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { ChoiceCard } from '@/components/ChoiceCard';
import { NumberStepper } from '@/components/NumberStepper';
import { OnboardingShell } from '@/components/OnboardingShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { activityOptions, dietOptions, goalOptions, restrictionOptions } from '@/constants/options';
import { useAppStore } from '@/store/appStore';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { ProfileDraft, Restriction } from '@/types/domain';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const profile = useAppStore((state) => state.profile);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const [draft, setDraft] = useState<ProfileDraft>(profile ?? { name: '', age: 30, calculationSex: 'male', heightCm: 175, weightKg: 70, activityLevel: 'medium', goal: 'balance', dietPreference: 'all', restrictions: [] });
  const [saving, setSaving] = useState(false);
  const patch = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const toggle = (value: Restriction) => patch('restrictions', draft.restrictions.includes(value) ? draft.restrictions.filter((item) => item !== value) : [...draft.restrictions, value]);
  const save = async () => {
    const name = draft.name.replace(/\s+/g, ' ').trim();
    if (name.length < 2 || name.length > 30) { Alert.alert('Проверь имя', 'Имя должно содержать от 2 до 30 символов.'); return; }
    try { setSaving(true); await updateProfile({ ...draft, name }); router.back(); }
    catch { setSaving(false); Alert.alert('Ошибка', 'Не удалось сохранить изменения.'); }
  };
  return <OnboardingShell keyboard eyebrow="Локальное редактирование" title="Изменить данные" description="После сохранения дневная норма обновится автоматически."
    footer={<View style={styles.actions}><PrimaryButton label={saving ? 'Сохраняем…' : 'Сохранить изменения'} disabled={saving} onPress={save}/><PrimaryButton label="Отмена" secondary onPress={() => router.back()}/></View>}>
    <View style={styles.field}><AppText variant="caption" tone="secondary">Имя</AppText><TextInput value={draft.name} onChangeText={(value) => patch('name', value)} style={[styles.input, { borderColor: colors.glassBorder, backgroundColor: colors.surfaceStrong, color: colors.textPrimary }]} accessibilityLabel="Имя" /></View>
    <AppText variant="heading">Пол для расчёта</AppText><ChoiceCard title="Женский" selected={draft.calculationSex === 'female'} onPress={() => patch('calculationSex', 'female')}/><ChoiceCard title="Мужской" selected={draft.calculationSex === 'male'} onPress={() => patch('calculationSex', 'male')}/>
    <NumberStepper label="Возраст" value={draft.age} unit="лет" min={16} max={80} onChange={(value) => patch('age', value)}/>
    <NumberStepper label="Рост" value={draft.heightCm} unit="см" min={120} max={230} onChange={(value) => patch('heightCm', value)}/>
    <NumberStepper label="Вес" value={draft.weightKg} unit="кг" min={35} max={250} onChange={(value) => patch('weightKg', value)}/>
    <AppText variant="heading">Активность</AppText>{activityOptions.map((item) => <ChoiceCard key={item.value} title={item.title} selected={draft.activityLevel === item.value} onPress={() => patch('activityLevel', item.value)}/>)}
    <AppText variant="heading">Цель</AppText>{goalOptions.map((item) => <ChoiceCard key={item.value} title={item.title} selected={draft.goal === item.value} onPress={() => patch('goal', item.value)}/>)}
    <AppText variant="heading">Тип питания</AppText>{dietOptions.map((item) => <ChoiceCard key={item.value} title={item.title} selected={draft.dietPreference === item.value} onPress={() => patch('dietPreference', item.value)}/>)}
    <AppText variant="heading">Ограничения</AppText>{restrictionOptions.map((item) => <ChoiceCard key={item.value} title={item.title} selected={draft.restrictions.includes(item.value)} onPress={() => toggle(item.value)}/>)}
  </OnboardingShell>;
}
const styles = StyleSheet.create({ actions: { gap: spacing.sm }, field: { gap: spacing.sm }, input: { minHeight: 58, borderRadius: radii.md, borderWidth: 1, fontSize: 20, paddingHorizontal: spacing.md } });
