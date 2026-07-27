import { StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { AppText } from './AppText';
import { colors, radii, spacing } from '@/theme/tokens';

export function FormField({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline, suffix }: {
  label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: KeyboardTypeOptions; multiline?: boolean; suffix?: string;
}) {
  return <View style={styles.block}><AppText variant="caption" tone="secondary">{label}</AppText><View style={[styles.inputWrap, multiline && styles.multiline]}><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.textMuted} keyboardType={keyboardType} multiline={multiline} style={[styles.input, multiline && styles.multilineInput]}/>{suffix ? <AppText variant="caption" tone="muted">{suffix}</AppText> : null}</View></View>;
}
const styles = StyleSheet.create({ block: { gap: spacing.xs }, inputWrap: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.surfaceStrong }, input: { flex: 1, color: colors.textPrimary, fontSize: 16 }, multiline: { minHeight: 100, alignItems: 'flex-start', paddingVertical: spacing.sm }, multilineInput: { minHeight: 76, textAlignVertical: 'top' } });
