import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AppText } from './AppText';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

interface Props { label: string; onPress: () => void | Promise<void>; disabled?: boolean; secondary?: boolean; accessibilityLabel?: string; }
export function PrimaryButton({ label, onPress, disabled, secondary, accessibilityLabel }: Props) {
  const { colors } = useTheme();
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await onPress();
  };
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} disabled={disabled} onPress={handlePress}
      style={({ pressed }) => [styles.wrapper, disabled && styles.disabled, pressed && !disabled && styles.pressed]}>
      {secondary ? <View style={[styles.secondary, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}><AppText style={styles.label}>{label}</AppText></View> :
        <LinearGradient colors={[colors.greenBright, colors.greenPrimary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
          <AppText style={[styles.darkLabel, { color: colors.backgroundPrimary }]}>{label}</AppText>
        </LinearGradient>}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  wrapper: { minHeight: 54, borderRadius: radii.md, overflow: 'hidden' }, primary: { minHeight: 54, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  secondary: { minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, borderWidth: 1, borderRadius: radii.md },
  label: { fontWeight: '700' }, darkLabel: { fontWeight: '800' }, disabled: { opacity: 0.4 }, pressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
});
