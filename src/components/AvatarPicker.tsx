import { Alert, StyleSheet, View } from 'react-native';
import { useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { AppText } from './AppText';
import { AppPressable } from './AppPressable';
import { UserAvatar } from './UserAvatar';
import { deleteStoredAvatar, persistAvatar } from '@/services/avatarStorage';
import { radii, sizes } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  name: string;
  uri?: string | null;
  cacheKey?: string;
  size?: number;
  onChange: (uri: string | null) => Promise<void>;
}

export function AvatarPicker({ name, uri, cacheKey, size = 100, onChange }: Props) {
  const { colors } = useTheme();
  const [saving, setSaving] = useState(false);
  const touchStyle = useMemo(() => ({ width: size + 12, height: size + 12 }), [size]);

  const commit = async (sourceUri: string) => {
    let nextUri: string | null = null;
    try {
      setSaving(true);
      nextUri = await persistAvatar(sourceUri);
      await onChange(nextUri);
    } catch {
      if (nextUri) await deleteStoredAvatar(nextUri);
      Alert.alert('Не удалось сохранить фото', 'Попробуй выбрать другое изображение.');
    } finally {
      setSaving(false);
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

  const remove = async () => {
    try {
      setSaving(true);
      await onChange(null);
    } catch {
      Alert.alert('Не удалось удалить фото', 'Текущее фото осталось без изменений.');
    } finally {
      setSaving(false);
    }
  };

  const choose = () => Alert.alert('Фото профиля', 'Выбери источник', [
    { text: 'Камера', onPress: () => { void camera(); } },
    { text: 'Галерея', onPress: () => { void gallery(); } },
    ...(uri ? [{ text: 'Удалить фото', style: 'destructive' as const, onPress: () => { void remove(); } }] : []),
    { text: 'Отмена', style: 'cancel' },
  ]);

  return (
    <AppPressable accessibilityRole="button" accessibilityLabel="Изменить фото профиля" haptic="light" loading={saving} onPress={choose} style={[styles.touch, touchStyle]} pressedStyle={styles.pressed}>
      <View style={[styles.halo, { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2, backgroundColor: colors.greenGlow, shadowColor: colors.greenPrimary }]}>
        <UserAvatar name={name} uri={uri} cacheKey={cacheKey} size={size} borderWidth={2} />
      </View>
      <View style={[styles.badge, { backgroundColor: colors.greenPrimary, borderColor: colors.backgroundPrimary }]}><AppText style={[styles.plus, { color: colors.backgroundPrimary }]}>{saving ? '·' : '+'}</AppText></View>
    </AppPressable>
  );
}

const styles = StyleSheet.create({
  touch: { minWidth: sizes.touch, minHeight: sizes.touch },
  halo: { padding: 4, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  badge: { position: 'absolute', right: 0, bottom: 0, width: sizes.touch, height: sizes.touch, borderRadius: radii.pill, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  plus: { fontSize: 22, lineHeight: 24, fontWeight: '800' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
