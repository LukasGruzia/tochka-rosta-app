import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { getProfileInitials } from '@/services/profileIdentity';
import { useTheme } from '@/theme/ThemeProvider';
import { motion } from '@/theme/tokens';
import { AppText } from './AppText';

interface UserAvatarProps {
  name: string;
  uri?: string | null;
  cacheKey?: string;
  size: number;
  borderWidth?: number;
  transition?: number;
}

export function UserAvatar({ name, uri, cacheKey, size, borderWidth = 1, transition = motion.avatarFade }: UserAvatarProps) {
  const { colors } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const initials = getProfileInitials(name);

  useEffect(() => setImageFailed(false), [cacheKey, uri]);

  return <View style={[styles.avatar, {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth,
    borderColor: colors.glassBorderStrong,
    backgroundColor: colors.surfaceAccent,
  }]}>
    <AppText tone="green" style={[styles.initials, { fontSize: Math.max(15, Math.round(size * 0.3)), lineHeight: Math.round(size * 0.36) }]}>{initials}</AppText>
    {uri && !imageFailed ? <Image
      source={{ uri, cacheKey: cacheKey ?? uri }}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={transition}
      style={StyleSheet.absoluteFillObject}
      onError={(event) => {
        setImageFailed(true);
        if (__DEV__) console.warn('[UserAvatar] avatar_uri недоступен', uri, event.error);
      }}
    /> : null}
  </View>;
}

const styles = StyleSheet.create({
  avatar: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: '800', letterSpacing: 0.3 },
});
