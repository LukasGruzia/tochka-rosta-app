import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon, type IconName } from '@/components/AppIcon';
import { radii, sizes } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

const items: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Главная', icon: 'home' }, { name: 'diary', title: 'Дневник', icon: 'diary' },
  { name: 'catalog', title: 'Каталог', icon: 'catalog' }, { name: 'flow', title: 'Поток', icon: 'flow' }, { name: 'profile', title: 'Профиль', icon: 'profile' },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const safeBottom = Math.max(insets.bottom, 6);
  return <Tabs screenListeners={{ tabPress: () => { void Haptics.selectionAsync(); } }} screenOptions={{
    headerShown: false, tabBarActiveTintColor: colors.greenBright, tabBarInactiveTintColor: colors.textMuted,
    tabBarLabelStyle: styles.label,
    tabBarStyle: [styles.bar, { bottom: safeBottom, height: sizes.tabBarBase + safeBottom, paddingBottom: safeBottom, borderColor: colors.glassBorder, backgroundColor: colors.surfaceStrong }],
    tabBarBackground: () => Platform.OS === 'ios'
      ? <BlurView intensity={32} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surfaceStrong }]} />,
  }}>
    {items.map((item) => <Tabs.Screen key={item.name} name={item.name} options={{ title: item.title, tabBarAccessibilityLabel: item.title,
      tabBarIcon: ({ color, focused }) => <View style={[styles.iconWrap, focused && { backgroundColor: colors.greenGlow }]}><AppIcon name={item.icon} color={String(color)} size={23}/></View> }} />)}
  </Tabs>;
}
const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 10, right: 10, borderRadius: radii.xl, borderTopWidth: 1, borderWidth: 1, paddingTop: 7, overflow: 'hidden' },
  label: { fontSize: 10, fontWeight: '600' }, iconWrap: { width: 36, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
