import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { spacing } from '@/theme/tokens';
import type { RhythmAction, RhythmEmotion } from '../types/rhythm';
import { RhythmCharacter } from './RhythmCharacter';
import { useRhythmOverlay } from './RhythmOverlayProvider';

export function RhythmSuggestionCard({title,message,emotion='thinking',action='presentAdvice',primaryLabel='Посмотреть варианты',onPrimary,secondaryLabel,onSecondary}:{title:string;message:string;emotion?:RhythmEmotion;action?:RhythmAction;primaryLabel?:string;onPrimary:()=>void|Promise<void>;secondaryLabel?:string;onSecondary?:()=>void|Promise<void>}){
  const {width}=useWindowDimensions();const veryNarrow=width<340;const characterSize=width<370?'compact':'medium';
  const{settings}=useRhythmOverlay();
  return <GlassCard variant="accent"><View style={[styles.top,veryNarrow&&styles.narrow]}><RhythmCharacter size={characterSize} mode={settings?.mode} emotion={emotion} action={action}/><View style={styles.copy}><AppText variant="heading" numberOfLines={2}>{title}</AppText><AppText tone="secondary">{message}</AppText></View></View><View style={styles.actions}><PrimaryButton label={primaryLabel} onPress={onPrimary}/>{secondaryLabel&&onSecondary?<PrimaryButton label={secondaryLabel} secondary onPress={onSecondary}/>:null}</View></GlassCard>;
}
const styles=StyleSheet.create({top:{flexDirection:'row',alignItems:'center',gap:spacing.lg},narrow:{flexDirection:'column',alignItems:'center'},copy:{flex:1,minWidth:0,gap:spacing.xs},actions:{gap:spacing.sm,marginTop:spacing.md}});

