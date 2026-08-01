import { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { useScreenActivity } from '@/hooks/useScreenActivity';
import { useTheme } from '@/theme/ThemeProvider';
import { resolveRhythmAsset, rhythmAssets } from '../config/rhythmAssets';
import { blinkIntervals, getRhythmModeConfig, resolveRhythmAction } from '../config/rhythmModes';
import { recordRhythmAssetDiagnostics, recordRhythmRuntimeDiagnostics } from '../services/assetDiagnostics';
import { useRenderTracker } from '@/performance/renderTracker';
import type { RhythmAction, RhythmEmotion, RhythmMode, RhythmSize } from '../types/rhythm';

const dimensions: Record<RhythmSize, number> = { small: 48, compact: 76, medium: 104, large: 156, hero: 228 };
let blinkTimer: ReturnType<typeof setTimeout> | null = null;
let blinkOwner = 0;
let fpsOwner = 0;
let fpsFrame: number | null = null;

function startGlobalBlinkLoop(onBlink: () => void, minimumMs: number, maximumMs: number) {
  const owner = ++blinkOwner;
  if (blinkTimer) clearTimeout(blinkTimer);
  recordRhythmRuntimeDiagnostics({ activeBlinkTimers: 1 });
  const schedule = () => {
    blinkTimer = setTimeout(() => {
      if (owner !== blinkOwner) return;
      onBlink();
      schedule();
    }, minimumMs + Math.round(Math.random() * (maximumMs - minimumMs)));
  };
  schedule();
  return () => {
    if (owner !== blinkOwner) return;
    blinkOwner += 1;
    if (blinkTimer) clearTimeout(blinkTimer);
    blinkTimer = null;
    recordRhythmRuntimeDiagnostics({ activeBlinkTimers: 0 });
  };
}

function startGlobalFpsSampler() {
  const owner = ++fpsOwner;
  let frames = 0;
  let started = Date.now();
  const sample = () => {
    if (owner !== fpsOwner) return;
    frames += 1;
    const elapsed = Date.now() - started;
    if (elapsed >= 1000) {
      recordRhythmRuntimeDiagnostics({ approximateFps: Math.round(frames * 1000 / elapsed) });
      frames = 0; started = Date.now();
    }
    fpsFrame = requestAnimationFrame(sample);
  };
  fpsFrame = requestAnimationFrame(sample);
  return () => { if (owner !== fpsOwner) return; fpsOwner += 1; if (fpsFrame != null) cancelAnimationFrame(fpsFrame); fpsFrame = null; };
}

function RhythmCharacterComponent({ emotion = 'idle', action = 'none', mode = 'balanced', size = 'medium', animated = true, label = 'Ритм — помощник в Потоке' }: { emotion?: RhythmEmotion; action?: RhythmAction; mode?: RhythmMode; size?: RhythmSize; animated?: boolean; label?: string }) {
  'use no memo';
  useRenderTracker('RhythmCharacter');
  const activity = useScreenActivity();
  const { colors } = useTheme();
  const value = dimensions[size];
  const breathe = useSharedValue(0);
  const reaction = useSharedValue(0);
  const blink = useSharedValue(0);
  const faceCrossfade = useSharedValue(1);
  const canAnimate = animated && activity.canAnimate;
  const modeConfig = getRhythmModeConfig(mode);
  const modeAction = resolveRhythmAction(mode,action);
  const motionScale = modeConfig.bodyMotion === 'expressive' ? 1 : modeConfig.bodyMotion === 'soft' ? 0.52 : 0.12;
  const [blinkMinimum, blinkMaximum] = blinkIntervals[modeConfig.blinkFrequency];
  const resolved = useMemo(() => resolveRhythmAsset(emotion, size), [emotion, size]);
  const [errorStage, setErrorStage] = useState<0 | 1 | 2>(0);
  const emergency = rhythmAssets.idle.compact!;
  const visibleAsset = useMemo(() => errorStage === 0 ? resolved : errorStage === 1 ? { ...emergency, requestedKey: resolved.requestedKey, requestedEmotion: emotion, requestedSize: 'compact' as const, fallbackUsed: true } : null, [emergency, emotion, errorStage, resolved]);

  useEffect(() => { setErrorStage(0); }, [resolved.key, resolved.requestedKey]);
  useEffect(() => {
    cancelAnimation(breathe);
    breathe.set(canAnimate ? withRepeat(withSequence(withTiming(1, { duration: 1800 + (3-modeConfig.animationIntensity)*360, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1800 + (3-modeConfig.animationIntensity)*360, easing: Easing.inOut(Easing.sin) })), -1, false) : 0);
    return () => cancelAnimation(breathe);
  }, [breathe, canAnimate, modeConfig.animationIntensity]);
  useEffect(() => {
    cancelAnimation(reaction);
    reaction.set(canAnimate && modeAction !== 'none' ? withSequence(withTiming(1, { duration: Math.min(260,modeConfig.reactionDurationMs*.28), easing: Easing.out(Easing.cubic) }), withTiming(0, { duration: modeConfig.reactionDurationMs*.72, easing: Easing.inOut(Easing.sin) })) : 0);
    return () => cancelAnimation(reaction);
  }, [canAnimate, modeAction, modeConfig.reactionDurationMs, reaction]);
  useEffect(() => {
    cancelAnimation(faceCrossfade);
    faceCrossfade.set(canAnimate ? 0.45 : 1);
    faceCrossfade.set(canAnimate ? withTiming(1, { duration: 180 }) : 1);
    return () => cancelAnimation(faceCrossfade);
  }, [canAnimate, emotion, faceCrossfade, modeAction]);
  useEffect(() => {
    cancelAnimation(blink);
    blink.set(emotion === 'sleeping' ? 1 : 0);
    if (!canAnimate || emotion === 'sleeping') return () => cancelAnimation(blink);
    const stop = startGlobalBlinkLoop(() => blink.set(withSequence(withTiming(1, { duration: 70 }), withTiming(0, { duration: 110 }))),blinkMinimum,blinkMaximum);
    return () => { stop(); cancelAnimation(blink); blink.set(0); };
  }, [blink, blinkMaximum, blinkMinimum, canAnimate, emotion]);
  useEffect(() => {
    const pausedReason = canAnimate ? null : !animated ? 'animation disabled by caller' : !activity.isAppActive ? 'app background' : !activity.isFocused ? 'screen blur' : activity.reducedMotion ? 'reduced motion' : `performance mode: ${activity.performanceMode}`;
    recordRhythmRuntimeDiagnostics({ animationPausedReason: pausedReason, ...(canAnimate ? {} : { approximateFps: null }) });
    if (!canAnimate || !__DEV__) return;
    return startGlobalFpsSampler();
  }, [activity.isAppActive, activity.isFocused, activity.performanceMode, activity.reducedMotion, animated, canAnimate]);
  useEffect(() => {
    if (!visibleAsset) return;
    recordRhythmAssetDiagnostics({ emotion, assetKey: visibleAsset.key, requestedKey: resolved.requestedKey, displaySize: size, fileName: visibleAsset.fileName, pixelSize: `${visibleAsset.width}×${visibleAsset.height}`, fileBytes: visibleAsset.bytes, fallbackUsed: visibleAsset.fallbackUsed || errorStage > 0, loadError: errorStage > 0 ? 'Primary asset failed to load' : null, performanceMode: activity.performanceMode });
  }, [activity.performanceMode, emotion, errorStage, resolved.requestedKey, size, visibleAsset]);

  const bodyStyle = useAnimatedStyle(() => {
    const breathing = breathe.get();
    const reacting = reaction.get();
    const jump=modeAction==='smallJump'?7:3;
    const turn=modeAction==='wave'?1.1:(modeAction==='lookAtCard'||modeAction==='point')?0.7:modeAction==='run'?1.2:0.45;
    return { transform: [{ translateY: motionScale*(-2 * breathing - jump * reacting) }, { rotateZ: `${motionScale*((breathing - 0.5) * 0.35 + reacting * turn)}deg` }, { scaleX: 1 + motionScale*(-breathing * 0.005 + reacting * 0.012) }, { scaleY: 1 + motionScale*(breathing * 0.012 + reacting * 0.022) }] };
  });
  const eyelidStyle = useAnimatedStyle(() => ({ opacity: Math.max(emotion === 'sleeping' ? 1 : 0, blink.get()), transform: [{ scaleY: 0.18 + blink.get() * 0.82 }] }));
  const faceStyle = useAnimatedStyle(() => ({ opacity: faceCrossfade.get() }));

  return <View accessible accessibilityRole="image" accessibilityLabel={`${label}. Состояние: ${emotion}, действие: ${modeAction}.`} style={{ width: value, height: value * 1.12, alignItems: 'center', justifyContent: 'center' }}>
    <View pointerEvents="none" style={[styles.glow,{width:value*.76,height:value*.76,borderRadius:value,backgroundColor:colors.greenPrimary,opacity:.04+modeConfig.glowIntensity*.12,shadowColor:colors.greenPrimary,shadowOpacity:modeConfig.glowIntensity*.55,shadowRadius:8+modeConfig.glowIntensity*18}]} />
    <Animated.View style={[styles.full, bodyStyle]}>
      {visibleAsset ? <Image source={visibleAsset.source} contentFit="contain" transition={80} cachePolicy="memory-disk" recyclingKey={visibleAsset.key} onError={() => { if (__DEV__) console.warn(`[RhythmCharacter] Failed to load ${visibleAsset.fileName}`); setErrorStage((stage) => stage === 0 ? 1 : 2); }} style={styles.full} /> : <View style={[styles.icon, { backgroundColor: colors.greenGlow }]}><AppIcon name="flow" size={Math.max(28, value * 0.48)} color={colors.greenBright} /></View>}
      {visibleAsset ? <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, faceStyle]}>
        <Animated.View style={[styles.eyelid, styles.leftEyelid, eyelidStyle]} />
        <Animated.View style={[styles.eyelid, styles.rightEyelid, eyelidStyle]} />
        {emotion === 'surprised' ? <View style={styles.surprisedMouth} /> : null}
        {emotion === 'caring' || emotion === 'supportive' ? <View style={[styles.faceBadge, { backgroundColor: colors.greenGlow }]}><AppText tone="green" style={styles.badgeText}>♥</AppText></View> : null}
        {emotion === 'thinking' ? <View style={[styles.thoughtDot, { backgroundColor: colors.textPrimary }]} /> : null}
        {emotion === 'food' || modeAction === 'holdFood' ? <AppText style={styles.food}>◡</AppText> : null}
        {emotion === 'celebrating' || modeAction === 'celebrate' ? <AppText style={styles.sparkle}>✦</AppText> : null}
        {emotion === 'sleeping' || modeAction === 'rest' ? <AppText tone="secondary" style={styles.sleep}>z</AppText> : null}
      </Animated.View> : null}
    </Animated.View>
  </View>;
}

export const RhythmCharacter = memo(RhythmCharacterComponent);
const styles = StyleSheet.create({
  glow: { position: 'absolute', elevation: 0 },
  full: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  icon: { width: '82%', height: '82%', borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  eyelid: { position: 'absolute', top: '47.5%', width: '14%', height: '9%', borderRadius: 999, backgroundColor: '#18C96D', borderBottomWidth: 1.5, borderBottomColor: '#08723C' },
  leftEyelid: { left: '33.2%' }, rightEyelid: { left: '52.8%' },
  surprisedMouth: { position: 'absolute', left: '47.2%', top: '60.2%', width: '6%', aspectRatio: 0.8, borderRadius: 999, backgroundColor: '#075B37' },
  faceBadge: { position: 'absolute', right: '17%', top: '63%', width: '17%', aspectRatio: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 12, lineHeight: 14 }, thoughtDot: { position: 'absolute', right: '18%', top: '29%', width: '5%', aspectRatio: 1, borderRadius: 999, opacity: 0.72 },
  sparkle: { position: 'absolute', right: '14%', top: '26%', color: '#FFE27A', fontSize: 22, textShadowColor: '#36E695', textShadowRadius: 8 },
  sleep: { position: 'absolute', right: '15%', top: '30%', fontSize: 18, fontWeight: '800' },
  food: { position: 'absolute', right: '10%', bottom: '12%', color: '#FFE9A6', fontSize: 24, fontWeight: '900' },
});
