import { StyleSheet, View } from 'react-native';
import { useUserProfile } from '@/hooks/useUserProfile';
import { AppPressable } from './AppPressable';
import { AppText } from './AppText';
import { useTheme } from '@/theme/ThemeProvider';
import { sizes, spacing } from '@/theme/tokens';
import { UserAvatar } from './UserAvatar';

export function HomeHeader({ greeting, onProfile }: { greeting: string; onProfile: () => void }) {
  const { colors } = useTheme();
  const { avatarUri, avatarCacheKey, userName } = useUserProfile();
  return <View style={styles.root}>
    <View style={styles.copy}>
      <AppText variant="caption" tone="secondary">{greeting}</AppText>
      <AppText variant="title" numberOfLines={2}>{userName}</AppText>
    </View>
    <AppPressable accessibilityRole="button" accessibilityLabel="Открыть профиль" actionLabel="home_avatar" haptic="selection" onPress={onProfile} style={[styles.avatarButton, { shadowColor: colors.greenPrimary }]}>
      <UserAvatar name={userName} uri={avatarUri} cacheKey={avatarCacheKey} size={sizes.avatar} />
    </AppPressable>
  </View>;
}

const styles = StyleSheet.create({
  root: { minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  avatarButton: { width: sizes.avatar, height: sizes.avatar, borderRadius: sizes.avatar / 2, shadowOpacity: 0.16, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
});
