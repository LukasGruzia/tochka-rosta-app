import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { AppIcon } from './AppIcon';
import { AppPressable } from './AppPressable';
import { useTheme } from '@/theme/ThemeProvider';
import { radii } from '@/theme/tokens';

function fallbackForPath(pathname: string) {
  if (/^\/(product|recipe|food-search|scanner)/.test(pathname)) return '/(tabs)/catalog';
  if (/^\/(edit-profile|analytics|appearance|data-|developer|performance|research|jury)/.test(pathname)) return '/(tabs)/profile';
  if (/^\/(rhythm|remainder-match)/.test(pathname)) return '/(tabs)/flow';
  if (/^\/(day-balance|meal-|nutrition-budget|water-tracker|shopping-list|my-week|weight-progress|personal-insights)/.test(pathname)) return '/(tabs)/diary';
  return '/(tabs)';
}

export function AppBackButton({ fallbackRoute, style, iconColor }: { fallbackRoute?: string; style?: StyleProp<ViewStyle>; iconColor?: string }) {
  const pathname = usePathname();
  const { colors } = useTheme();
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace((fallbackRoute ?? fallbackForPath(pathname)) as never);
  };
  return <AppPressable accessibilityRole="button" accessibilityLabel="Назад" accessibilityHint="Вернуться на предыдущий экран" hitSlop={8} haptic="selection" onPress={goBack} style={[styles.button, { backgroundColor: colors.surfaceStrong, borderColor: colors.glassBorder }, style]}>
    <View style={styles.icon}><AppIcon name="arrow" size={22} color={iconColor ?? colors.textPrimary} /></View>
  </AppPressable>;
}

const styles = StyleSheet.create({ button: { width: 44, height: 44, borderRadius: radii.pill, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' }, icon: { flex: 1, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '180deg' }] } });
