import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { flowFlameConfig, getFlowFlameLevel, shouldAnimateFlowFlame } from '@/services/flowFlameState';
import { useTheme } from '@/theme/ThemeProvider';

export function FlowFlame({ streak, size = 150 }: { streak: number; size?: number }) {
  const { colors } = useTheme(); const reducedMotion = useReducedMotion(); const pulse = useSharedValue(0); const level = getFlowFlameLevel(streak); const config = flowFlameConfig[level];
  useEffect(() => { pulse.value = shouldAnimateFlowFlame(reducedMotion) ? withRepeat(withSequence(withTiming(1, { duration: config.speed / 2, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: config.speed / 2, easing: Easing.inOut(Easing.sin) })), -1, false) : 0; }, [config.speed, pulse, reducedMotion]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: -2 * pulse.value }, { scale: config.scale + pulse.value * 0.035 }], opacity: 0.94 + pulse.value * 0.06 }));
  return <View accessibilityLabel={`Поток: серия ${streak} дней, уровень ${level}`} style={[styles.wrap, { width: size, height: size }]}><View pointerEvents="none" style={[styles.glow, { width: size * 0.82, height: size * 0.82, borderRadius: size, backgroundColor: colors.greenPrimary, opacity: config.glow * 0.28 }]} /><Animated.View style={[styles.flame, animated]}><Svg width={size} height={size} viewBox="0 0 160 160"><Defs><LinearGradient id="outer" x1="0" y1="1" x2="1" y2="0"><Stop offset="0" stopColor={colors.greenPrimary} /><Stop offset="0.6" stopColor={colors.greenBright} /><Stop offset="1" stopColor={colors.gold} /></LinearGradient><LinearGradient id="inner" x1="0" y1="1" x2="0" y2="0"><Stop offset="0" stopColor={colors.backgroundPrimary} /><Stop offset="1" stopColor={colors.greenBright} /></LinearGradient></Defs><Path d="M82 148c-37 0-61-25-58-61 2-28 19-49 44-75 0 21 8 33 24 43 1-17 9-31 24-42 20 26 27 48 23 73-5 36-28 62-57 62Z" fill="url(#outer)" /><Path d="M82 139c-18 0-31-13-30-31 1-14 9-26 23-41 0 12 4 20 13 27 1-9 5-17 13-24 10 14 14 27 11 40-3 18-15 29-30 29Z" fill="url(#inner)" opacity={0.9} />{level === 'legendary' ? <Path d="M35 60 29 49m101 12 7-12M81 19V6" stroke={colors.gold} strokeWidth={4} strokeLinecap="round" /> : null}</Svg></Animated.View></View>;
}

const styles = StyleSheet.create({ wrap: { alignItems: 'center', justifyContent: 'center' }, flame: { ...StyleSheet.absoluteFillObject }, glow: { position: 'absolute' } });
