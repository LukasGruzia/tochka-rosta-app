import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TabScreen } from '@/components/TabScreen';
import { createLocalBackup, restoreLocalBackup } from '@/database/repositories/dataRepository';
import { useAppStore } from '@/store/appStore';
import { colors, radii } from '@/theme/tokens';

export default function DataManagementScreen() { const initialize = useAppStore((state) => state.initialize); const [busy, setBusy] = useState(false);
  const exportData = async () => { try { setBusy(true); const backup = await createLocalBackup(); const uri = `${FileSystem.cacheDirectory}tochka-rosta-backup-${backup.createdAt.slice(0, 10)}.json`; await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup, null, 2), { encoding: FileSystem.EncodingType.UTF8 }); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Сохранить резервную копию' }); else Alert.alert('Файл готов', uri); } catch (error) { Alert.alert('Не удалось создать копию', error instanceof Error ? error.message : 'Попробуй ещё раз'); } finally { setBusy(false); } };
  const importData = async () => { const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true }); if (result.canceled) return; Alert.alert('Восстановить данные?', 'Текущие локальные данные будут заменены содержимым выбранной копии.', [{ text: 'Отмена', style: 'cancel' }, { text: 'Восстановить', style: 'destructive', onPress: async () => { try { setBusy(true); const text = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 }); await restoreLocalBackup(JSON.parse(text)); await initialize(); Alert.alert('Готово', 'Локальные данные восстановлены.'); } catch (error) { Alert.alert('Не удалось восстановить', error instanceof Error ? error.message : 'Проверь файл'); } finally { setBusy(false); } } }]); };
  return <TabScreen title="Данные и резервная копия" subtitle="Полностью локальное хранение" headerRight={<Pressable style={styles.close} onPress={() => router.back()}><AppText>×</AppText></Pressable>}><GlassCard variant="accent"><AppText variant="heading">Резервная копия</AppText><AppText tone="secondary">Экспорт включает профиль, дневник, Поток, свои продукты, рецепты, планы и локальный каталог. Файл можно сохранить в iCloud Drive или «Файлы».</AppText></GlassCard><PrimaryButton label={busy ? 'Подождите…' : 'Экспортировать JSON'} disabled={busy} onPress={exportData}/><PrimaryButton label="Восстановить из JSON" secondary disabled={busy} onPress={importData}/><GlassCard variant="compact"><AppText variant="heading">Конфиденциальность</AppText><AppText tone="secondary">Приложение не создаёт аккаунт и не синхронизирует данные с сервером. Передача происходит только через выбранное тобой системное меню.</AppText></GlassCard><AppText variant="caption" tone="muted">Импорт принимает только резервную копию формата «Точка Роста» v1. Перед восстановлением рекомендуется сохранить текущую копию.</AppText></TabScreen>;
}
const styles = StyleSheet.create({ close: { width: 42, height: 42, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }, });
