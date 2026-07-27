import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppBackground } from '@/components/AppBackground';
import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAppStore } from '@/store/appStore';
import { spacing } from '@/theme/tokens';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const initialize = useAppStore((state) => state.initialize);
  useEffect(() => { void initialize().finally(() => SplashScreen.hideAsync()); }, [initialize]);
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#061009' }, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="edit-profile" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </SafeAreaProvider>
  );
}

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <AppBackground>
      <View style={styles.error}>
        <AppText variant="title">Что-то пошло не так</AppText>
        <AppText tone="secondary">{error.message}</AppText>
        <PrimaryButton label="Попробовать снова" onPress={retry} />
      </View>
    </AppBackground>
  );
}
const styles = StyleSheet.create({ error: { flex: 1, justifyContent: 'center', gap: spacing.lg, padding: spacing.lg } });
