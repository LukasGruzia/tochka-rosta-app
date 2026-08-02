import { StyleSheet, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';
import { AppBackground } from '@/components/AppBackground';
import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAppStore } from '@/store/appStore';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function OnboardingLayout() {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  return <Stack screenOptions={{ headerShown: false, animation: reducedMotion ? 'fade' : 'slide_from_right', gestureEnabled: true, contentStyle: { backgroundColor: colors.backgroundPrimary } }} />;
}

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  const profile = useAppStore((state) => state.profile);
  return <AppBackground><View style={styles.error}>
    <AppText variant="title">Настройка прервалась</AppText>
    <AppText tone="secondary">Введённый draft сохранён на устройстве. Можно повторить открытие экрана.</AppText>
    <PrimaryButton label="Попробовать снова" onPress={retry} />
    {profile ? <PrimaryButton label="Открыть сохранённый профиль" secondary onPress={() => router.replace('/(tabs)')} /> : null}
    {__DEV__ ? <AppText variant="caption" tone="warning">{error.message}</AppText> : null}
  </View></AppBackground>;
}

const styles = StyleSheet.create({ error: { flex: 1, justifyContent: 'center', gap: spacing.md, padding: spacing.lg } });
