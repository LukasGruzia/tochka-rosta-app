import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { AppPressable } from '@/components/AppPressable';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { radii, spacing } from '@/theme/tokens';
import { rhythmConfig } from '../config/rhythmConfig';
import type { RhythmDecision } from '../types/rhythm';
import { RhythmCharacter } from './RhythmCharacter';

export function RhythmReactionToast({decision,onDismiss,onOpen,animated=true}:{decision:RhythmDecision;onDismiss:()=>void;onOpen?:()=>void;animated?:boolean}){
  useEffect(()=>{const timer=setTimeout(onDismiss,rhythmConfig.toastDurationMs);return()=>clearTimeout(timer);},[decision.templateId,onDismiss]);
  return <Animated.View entering={animated?FadeInDown.duration(260):undefined} exiting={animated?FadeOutDown.duration(180):undefined} style={styles.wrap}>
    <GlassCard variant="elevated" style={styles.card}><View style={styles.row}><RhythmCharacter size="compact" emotion={decision.visual.emotion} action={decision.visual.action} animated={animated}/><AppPressable accessibilityRole="button" accessibilityLabel="Открыть подсказку Ритма" onPress={onOpen} style={styles.copy}><View><AppText variant="heading">Ритм</AppText><AppText tone="secondary">{decision.message}</AppText></View></AppPressable><AppPressable accessibilityRole="button" accessibilityLabel="Закрыть подсказку" onPress={onDismiss} style={styles.close}><AppText tone="muted">×</AppText></AppPressable></View></GlassCard>
  </Animated.View>;
}
const styles=StyleSheet.create({wrap:{width:'100%'},card:{borderRadius:radii.xl},row:{minHeight:82,flexDirection:'row',alignItems:'center',gap:spacing.sm},copy:{flex:1,minHeight:64,justifyContent:'center'},close:{width:36,height:36,alignItems:'center',justifyContent:'center'}});

