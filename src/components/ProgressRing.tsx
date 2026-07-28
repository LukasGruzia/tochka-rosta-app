import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { AppText } from './AppText';
import { useTheme } from '@/theme/ThemeProvider';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
interface Props { progress: number; size?: number; value: string; label: string; }
export function ProgressRing({ progress, size = 190, value, label }: Props) {
  'use no memo';
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const radius = (size - 18) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProgress = useSharedValue(0);
  useEffect(() => { animatedProgress.set(reducedMotion ? progress : withTiming(progress, { duration: 700 })); }, [animatedProgress, progress, reducedMotion]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - Math.min(1, Math.max(0, animatedProgress.get()))) }));
  return (
    <View style={[styles.wrap, { width: size, height: size }]} accessibilityLabel={`${value}, ${label}`}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.greenDark} strokeWidth={10} fill="none" />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={radius} stroke={colors.greenBright} strokeWidth={10} fill="none"
          strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} animatedProps={animatedProps} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      <AppText variant="display" style={styles.value}>{value}</AppText>
      <AppText variant="caption" tone="secondary">{label}</AppText>
    </View>
  );
}
const styles = StyleSheet.create({ wrap: { alignItems: 'center', justifyContent: 'center' }, value: { fontSize: 34 } });
