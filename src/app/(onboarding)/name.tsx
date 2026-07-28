import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { OnboardingShell } from '@/components/OnboardingShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAppStore } from '@/store/appStore';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

const schema = z.object({ name: z.string().trim().min(2, 'Введи не меньше 2 символов').max(30, 'Не больше 30 символов').regex(/^[A-Za-zА-Яа-яЁё\- ]+$/, 'Используй буквы, пробел или дефис') });
type FormValues = z.infer<typeof schema>;

export default function NameScreen() {
  const { colors } = useTheme();
  const draftName = useAppStore((state) => state.draft.name);
  const saveDraft = useAppStore((state) => state.saveDraft);
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onChange', defaultValues: { name: draftName } });
  const name = useWatch({ control, name: 'name' });
  const submit = handleSubmit(async ({ name: validName }) => { const normalized = validName.replace(/\s+/g, ' ').trim(); await saveDraft({ name: normalized }, 'personal-data'); router.push('/(onboarding)/personal-data'); });
  return (
    <OnboardingShell progress={22} keyboard title="Как тебя зовут?" description="Мы будем обращаться к тебе по имени и сохранять данные только на этом устройстве."
      footer={<PrimaryButton label="Продолжить" disabled={!isValid} onPress={submit} />}>
      <View style={styles.field}>
        <AppText variant="caption" tone="secondary">Имя</AppText>
        <Controller control={control} name="name" render={({ field: { value, onChange, onBlur } }) =>
          <TextInput autoFocus accessibilityLabel="Имя" autoCapitalize="words" autoCorrect={false} returnKeyType="done" value={value} onChangeText={onChange} onBlur={onBlur} onSubmitEditing={() => { if (isValid) void submit(); }} placeholder="Например, Анна" placeholderTextColor={colors.textMuted} style={[styles.input, { borderColor: errors.name ? colors.danger : colors.glassBorder, backgroundColor: colors.surfaceStrong, color: colors.textPrimary }]} />}/>
        {errors.name ? <AppText variant="caption" tone="warning">{errors.name.message}</AppText> : null}
      </View>
      {name.trim().length >= 2 && !errors.name ? <AppText variant="heading" tone="green">Приятно познакомиться, {name.trim()}.</AppText> : null}
    </OnboardingShell>
  );
}
const styles = StyleSheet.create({ field: { gap: spacing.sm }, input: { minHeight: 64, borderRadius: radii.md, borderWidth: 1, fontSize: 22, paddingHorizontal: spacing.md } });
