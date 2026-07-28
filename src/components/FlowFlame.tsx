import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import Animated, { Easing, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { flowFlameConfig, getFlowFlameLevel, shouldAnimateFlowFlame } from '@/services/flowFlameState';
import { useTheme } from '@/theme/ThemeProvider';

export function FlowFlame({ streak, size = 190, isActive = true }: { streak: number; size?: number; isActive?: boolean }) {
  'use no memo';
  const { colors } = useTheme();
  const { flags } = useFeatureFlags();
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);
  const shine = useSharedValue(0);
  const success = useSharedValue(0);
  const previous = useRef(streak);
  const level = getFlowFlameLevel(streak);
  const config = flowFlameConfig[level];

  useEffect(() => {
    const animate = flags.enableFlowFlameAnimation && shouldAnimateFlowFlame(reduced, isActive);
    pulse.set(animate ? withRepeat(withSequence(
      withTiming(1, { duration: config.speed / 2, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: config.speed / 2, easing: Easing.inOut(Easing.sin) }),
    ), -1, false) : 0);
    shine.set(animate ? withRepeat(withTiming(1, { duration: config.speed, easing: Easing.inOut(Easing.quad) }), -1, false) : 0);
  }, [config.speed, flags.enableFlowFlameAnimation, isActive, pulse, reduced, shine]);
  useEffect(() => {
    if (flags.enableFlowFlameAnimation && streak > previous.current && !reduced) {
      success.set(withSequence(withTiming(1, { duration: 240 }), withTiming(0, { duration: 900 })));
    }
    previous.current = streak;
  }, [flags.enableFlowFlameAnimation, reduced, streak, success]);

  const animated = useAnimatedStyle(() => {
    const pulseValue = pulse.get();
    return {
      transform: [{ translateY: -2 * pulseValue }, { scale: config.scale + pulseValue * 0.025 - success.get() * 0.04 }],
      opacity: 0.94 + pulseValue * 0.06,
    };
  });
  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(shine.get(), [0, 1], [size * 0.45, -size * 0.38]) }],
    opacity: 0.08 + success.get() * 0.4,
  }));

  return <View accessible={false} importantForAccessibility="no-hide-descendants" style={[styles.wrap, { width: size, height: size }]}>
    <View pointerEvents="none" style={[styles.glow, { width: size * 0.78, height: size * 0.78, borderRadius: size, backgroundColor: colors.greenPrimary, opacity: config.glow * 0.22 }]} />
    <Animated.View style={[styles.flame, animated]}>
      <Svg width={size} height={size} viewBox="0 0 180 180">
        <Defs>
          <LinearGradient id="outer" x1="0" y1="1" x2="1" y2="0"><Stop offset="0" stopColor={colors.greenDark} /><Stop offset=".52" stopColor={colors.greenPrimary} /><Stop offset="1" stopColor={config.gold ? colors.gold : colors.greenBright} stopOpacity={config.gold || 0.82} /></LinearGradient>
          <RadialGradient id="middle" cx="50%" cy="72%" rx="48%" ry="62%"><Stop offset="0" stopColor={colors.greenBright} /><Stop offset=".58" stopColor={colors.greenPrimary} /><Stop offset="1" stopColor={colors.greenDark} /></RadialGradient>
          <LinearGradient id="inner" x1="0" y1="1" x2="0" y2="0"><Stop offset="0" stopColor={colors.backgroundPrimary} /><Stop offset="1" stopColor={colors.greenBright} /></LinearGradient>
        </Defs>
        <Path d="M91 168c-43 0-69-28-65-70 3-31 22-56 49-86-1 24 9 39 27 51 2-20 11-36 28-49 22 30 30 56 25 84-6 42-32 70-64 70Z" fill="url(#outer)" opacity={level === 'seed' ? 0.62 : 1} />
        <Path d="M91 158c-29 0-48-20-45-49 2-21 14-39 33-59 0 17 7 27 19 35 1-14 7-25 18-34 16 21 21 39 18 58-4 29-22 49-43 49Z" fill="url(#middle)" opacity={streak < 3 ? 0.58 : 0.9} />
        <Path d="M91 150c-17 0-29-12-28-29 1-13 8-24 21-38 0 11 4 18 12 24 1-8 5-16 12-22 10 13 13 25 11 37-3 17-14 28-28 28Z" fill="url(#inner)" opacity={streak < 7 ? 0.65 : 0.94} />
      </Svg>
      <Animated.View pointerEvents="none" style={[styles.shine, { left: size * 0.39, width: size * 0.22, height: size * 0.7, backgroundColor: colors.greenBright, borderRadius: size }, shineStyle]} />
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  flame: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  glow: { position: 'absolute' },
  shine: { position: 'absolute', bottom: 0 },
});
