import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon, type IconName } from '@/components/AppIcon';
import { colors, radii } from '@/theme/tokens';

const items: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Главная', icon: 'home' }, { name: 'diary', title: 'Дневник', icon: 'diary' },
  { name: 'catalog', title: 'Каталог', icon: 'catalog' }, { name: 'flow', title: 'Поток', icon: 'flow' }, { name: 'profile', title: 'Профиль', icon: 'profile' },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return <Tabs screenListeners={{ tabPress: () => { void Haptics.selectionAsync(); } }} screenOptions={{
    headerShown: false, tabBarActiveTintColor: colors.greenBright, tabBarInactiveTintColor: colors.textMuted,
    tabBarLabelStyle: styles.label, tabBarStyle: [styles.bar, { bottom: Math.max(10, insets.bottom) }],
    tabBarBackground: () => Platform.OS === 'ios' ? <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} /> : <View style={[StyleSheet.absoluteFill, styles.fallback]} />,
  }}>
    {items.map((item) => <Tabs.Screen key={item.name} name={item.name} options={{ title: item.title, tabBarAccessibilityLabel: item.title,
      tabBarIcon: ({ color, focused }) => <View style={[styles.iconWrap, focused && styles.iconActive]}><AppIcon name={item.icon} color={String(color)} size={23}/></View> }} />)}
  </Tabs>;
}
const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 14, right: 14, bottom: 12, height: 74, borderRadius: radii.xl, borderTopWidth: 1, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.surfaceStrong, paddingTop: 8, paddingBottom: 8, overflow: 'hidden' },
  fallback: { backgroundColor: colors.surfaceStrong }, label: { fontSize: 10, fontWeight: '600' }, iconWrap: { width: 36, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, iconActive: { backgroundColor: colors.greenGlow },
});
