import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { AppText } from './AppText';
import { persistAvatar } from '@/services/avatarStorage';
import { radii, sizes } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  name: string;
  uri?: string | null;
  onChange: (uri: string | null) => Promise<void>;
}

export function AvatarPicker({ name, uri, onChange }: Props) {
  const { colors } = useTheme();
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '•';

  const commit = async (sourceUri: string) => {
    try {
      await onChange(await persistAvatar(sourceUri, uri));
    } catch {
      Alert.alert('Не удалось сохранить фото', 'Попробуй выбрать другое изображение.');
    }
  };

  const gallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Нужен доступ к фото', 'Разреши доступ к медиатеке в настройках iPhone.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.86 });
    if (!result.canceled) await commit(result.assets[0].uri);
  };

  const camera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Нужен доступ к камере', 'Разреши доступ к камере в настройках iPhone.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.86 });
    if (!result.canceled) await commit(result.assets[0].uri);
  };

  const choose = () => Alert.alert('Фото профиля', 'Выбери источник', [
    { text: 'Камера', onPress: () => { void camera(); } },
    { text: 'Галерея', onPress: () => { void gallery(); } },
    ...(uri ? [{ text: 'Удалить фото', style: 'destructive' as const, onPress: () => { void onChange(null); } }] : []),
    { text: 'Отмена', style: 'cancel' },
  ]);

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Изменить фото профиля" onPress={choose} style={({ pressed }) => [styles.touch, pressed && styles.pressed]}>
      <View style={[styles.avatar, { backgroundColor: colors.greenGlow, borderColor: colors.glassBorderStrong }]}>
        {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={180} /> : <AppText variant="title" tone="green">{initials}</AppText>}
      </View>
      <View style={[styles.badge, { backgroundColor: colors.greenPrimary, borderColor: colors.backgroundPrimary }]}><AppText style={[styles.plus, { color: colors.backgroundPrimary }]}>+</AppText></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: { width: sizes.avatar + 8, height: sizes.avatar + 8 },
  avatar: { width: sizes.avatar, height: sizes.avatar, borderRadius: sizes.avatar / 2, borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', right: 0, bottom: 4, width: 32, height: 32, borderRadius: radii.pill, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  plus: { fontSize: 21, lineHeight: 23, fontWeight: '800' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
