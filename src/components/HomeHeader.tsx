import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { AppPressable } from './AppPressable';
import { AppText } from './AppText';
import { useTheme } from '@/theme/ThemeProvider';
import { getProfileInitials } from '@/services/profileIdentity';
import { sizes, spacing } from '@/theme/tokens';

export function HomeHeader({ greeting, name, avatarUri, onProfile }: { greeting: string; name: string; avatarUri?: string | null; onProfile: () => void }) {
  const { colors } = useTheme();
  const initials = getProfileInitials(name);
  return <View style={styles.root}>
    <View style={styles.copy}>
      <AppText variant="caption" tone="secondary">{greeting}</AppText>
      <AppText variant="title" numberOfLines={2}>{name}</AppText>
    </View>
    <AppPressable accessibilityRole="button" accessibilityLabel="Открыть профиль" actionLabel="home_avatar" haptic="selection" onPress={onProfile} style={[styles.avatar, { borderColor: colors.glassBorderStrong, backgroundColor: colors.surfaceAccent }]}>
      {avatarUri ? <Image source={{ uri: avatarUri }} contentFit="cover" style={StyleSheet.absoluteFill} /> : <AppText tone="green" style={styles.initials}>{initials}</AppText>}
    </AppPressable>
  </View>;
}

const styles = StyleSheet.create({
  root: { minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  avatar: { width: sizes.avatar, height: sizes.avatar, borderRadius: sizes.avatar / 2, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: '800', letterSpacing: 0.3 },
});
