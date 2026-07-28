import { memo, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import Animated, { cancelAnimation, Easing, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { useScreenActivity } from '@/hooks/useScreenActivity';
import { beginTrackedAnimation } from '@/performance/memoryEvents';
import { flowFlameConfig, getFlowFlameDimensions, getFlowFlameLevel, shouldAnimateFlowFlame } from '@/services/flowFlameState';
import { useTheme } from '@/theme/ThemeProvider';

const outerPath = 'M70 202C31 202 9 174 15 137c5-32 28-59 48-94 6-11 8-24 6-37 27 25 35 49 32 72 12-10 20-24 23-40 17 30 21 58 15 86-8 48-34 78-69 78Z';
const middlePath = 'M70 190c-27 0-43-20-40-47 3-23 17-42 31-67 5-8 6-17 5-27 19 18 25 35 23 52 9-7 14-17 17-29 12 21 15 42 11 62-6 34-23 56-47 56Z';
const innerPath = 'M70 181c-16 0-27-13-25-30 2-15 11-28 20-44 3-6 4-12 3-18 13 12 17 24 15 35 6-5 10-12 12-20 8 14 10 28 7 42-4 22-16 35-32 35Z';

function FlowFlameComponent({ streak, size = 190, isActive = true }: { streak: number; size?: number; isActive?: boolean }) {
  'use no memo';
  const { colors } = useTheme();
  const { flags } = useFeatureFlags();
  const activity = useScreenActivity();
  const pulse = useSharedValue(0);
  const shine = useSharedValue(0);
  const success = useSharedValue(0);
  const previous = useRef(streak);
  const { width: flameWidth } = getFlowFlameDimensions(size);
  const level = getFlowFlameLevel(streak);
  const config = flowFlameConfig[level];

  useEffect(() => {
    const animate = flags.enableFlowFlameIdleAnimation && activity.canAnimate && shouldAnimateFlowFlame(activity.reducedMotion, isActive);
    cancelAnimation(pulse);
    cancelAnimation(shine);
    const stopTracking = animate ? beginTrackedAnimation('flow_flame_idle') : undefined;
    pulse.set(animate ? withRepeat(withSequence(
      withTiming(1, { duration: config.speed / 2, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: config.speed / 2, easing: Easing.inOut(Easing.sin) }),
    ), -1, false) : 0);
    shine.set(animate ? withRepeat(withTiming(1, { duration: config.speed, easing: Easing.inOut(Easing.quad) }), -1, false) : 0);
    return () => { cancelAnimation(pulse); cancelAnimation(shine); stopTracking?.(); };
  }, [activity.canAnimate, activity.reducedMotion, config.speed, flags.enableFlowFlameIdleAnimation, isActive, pulse, shine]);
  useEffect(() => {
    cancelAnimation(success);
    if (flags.enableFlowFlameSuccessAnimation && activity.isAppActive && isActive && streak > previous.current && !activity.reducedMotion) {
      success.set(withSequence(withTiming(1, { duration: 240 }), withTiming(0, { duration: 900 })));
    }
    previous.current = streak;
    return () => cancelAnimation(success);
  }, [activity.isAppActive, activity.reducedMotion, flags.enableFlowFlameSuccessAnimation, isActive, streak, success]);

  const animated = useAnimatedStyle(() => {
    const pulseValue = pulse.get();
    return {
      transform: [{ translateY: -2 * pulseValue }, { scaleX: config.scale + pulseValue * 0.018 }, { scaleY: config.scale + pulseValue * 0.034 - success.get() * 0.035 }],
      opacity: 0.94 + pulseValue * 0.06,
    };
  });
  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(shine.get(), [0, 1], [size * 0.45, -size * 0.38]) }],
    opacity: 0.08 + success.get() * 0.4,
  }));

  return <View accessible={false} importantForAccessibility="no-hide-descendants" style={[styles.wrap, { width: flameWidth, height: size }]}>
    <View pointerEvents="none" style={[styles.glow, { width: flameWidth * 1.18, height: size * 0.72, borderRadius: size, backgroundColor: colors.greenPrimary, opacity: config.glow * 0.2 }]} />
    <Animated.View style={[styles.flame, animated]}>
      <Svg width={flameWidth} height={size} viewBox="0 0 140 210">
        <Defs>
          <LinearGradient id="outer" x1="0" y1="1" x2="1" y2="0"><Stop offset="0" stopColor={colors.greenDark} /><Stop offset=".52" stopColor={colors.greenPrimary} /><Stop offset="1" stopColor={config.gold ? colors.gold : colors.greenBright} stopOpacity={config.gold || 0.82} /></LinearGradient>
          <RadialGradient id="middle" cx="50%" cy="72%" rx="48%" ry="62%"><Stop offset="0" stopColor={colors.greenBright} /><Stop offset=".58" stopColor={colors.greenPrimary} /><Stop offset="1" stopColor={colors.greenDark} /></RadialGradient>
          <LinearGradient id="inner" x1="0" y1="1" x2="0" y2="0"><Stop offset="0" stopColor={colors.backgroundPrimary} /><Stop offset="1" stopColor={colors.greenBright} /></LinearGradient>
        </Defs>
        <Path d={outerPath} fill="url(#outer)" opacity={level === 'seed' ? 0.62 : 1} />
        <Path d={middlePath} fill="url(#middle)" opacity={streak < 3 ? 0.58 : 0.9} />
        <Path d={innerPath} fill="url(#inner)" opacity={streak < 7 ? 0.65 : 0.94} />
      </Svg>
      <Animated.View pointerEvents="none" style={[styles.shine, { left: flameWidth * 0.39, width: flameWidth * 0.22, height: size * 0.58, backgroundColor: colors.greenBright, borderRadius: size }, shineStyle]} />
    </Animated.View>
  </View>;
}

export const FlowFlame = memo(FlowFlameComponent);

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  flame: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  glow: { position: 'absolute' },
  shine: { position: 'absolute', bottom: 0 },
});
