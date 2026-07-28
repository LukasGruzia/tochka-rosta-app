import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppBackground } from '@/components/AppBackground';
import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/PrimaryButton';
import { spacing } from '@/theme/tokens';

export default function NotFoundScreen() {
  return <AppBackground><View style={styles.root}>
    <AppText variant="title">Этот экран пока недоступен.</AppText>
    <AppText tone="secondary">Проверь ссылку или вернись на главный экран. Локальные данные не изменены.</AppText>
    <PrimaryButton label="Вернуться на главную" onPress={() => router.replace('/(tabs)')} />
  </View></AppBackground>;
}

const styles = StyleSheet.create({ root: { flex: 1, justifyContent: 'center', gap: spacing.md, padding: spacing.lg } });
