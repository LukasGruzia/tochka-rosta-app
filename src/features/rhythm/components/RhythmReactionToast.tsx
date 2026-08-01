import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { AppPressable } from '@/components/AppPressable';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { radii, spacing } from '@/theme/tokens';
import { rhythmConfig } from '../config/rhythmConfig';
import { getRhythmModeConfig } from '../config/rhythmModes';
import { safelyRunHaptic } from '@/services/haptics';
import type { RhythmDecision, RhythmMode } from '../types/rhythm';
import { RhythmCharacter } from './RhythmCharacter';

export function RhythmReactionToast({decision,mode,onDismiss,onOpen,hapticsEnabled,animated=true}:{decision:RhythmDecision;mode:RhythmMode;onDismiss:()=>void;onOpen?:()=>void;hapticsEnabled:boolean;animated?:boolean}){
  const modeConfig=getRhythmModeConfig(mode);
  useEffect(()=>{const timer=setTimeout(onDismiss,Math.max(rhythmConfig.toastDurationMs,modeConfig.reactionDurationMs+2200));return()=>clearTimeout(timer);},[decision.templateId,modeConfig.reactionDurationMs,onDismiss]);
  useEffect(()=>{if(hapticsEnabled&&modeConfig.hapticsEnabled)void safelyRunHaptic(decision.priority>=85?'success':'light');},[decision.templateId,decision.priority,hapticsEnabled,modeConfig.hapticsEnabled]);
  return <Animated.View entering={animated?FadeInDown.duration(260):undefined} exiting={animated?FadeOutDown.duration(180):undefined} style={styles.wrap}>
    <GlassCard variant="elevated" style={styles.card}><View style={styles.row}><RhythmCharacter size="compact" emotion={decision.visual.emotion} action={decision.visual.action} mode={mode} animated={animated}/><AppPressable accessibilityRole="button" accessibilityLabel="Открыть подсказку Ритма" onPress={onOpen} style={styles.copy}><View><AppText variant="heading">Ритм</AppText><AppText tone="secondary">{decision.message}</AppText></View></AppPressable><AppPressable accessibilityRole="button" accessibilityLabel="Закрыть подсказку" onPress={onDismiss} style={styles.close}><AppText tone="muted">×</AppText></AppPressable></View></GlassCard>
  </Animated.View>;
}
const styles=StyleSheet.create({wrap:{width:'100%'},card:{borderRadius:radii.xl},row:{minHeight:82,flexDirection:'row',alignItems:'center',gap:spacing.sm},copy:{flex:1,minHeight:64,justifyContent:'center'},close:{width:36,height:36,alignItems:'center',justifyContent:'center'}});

