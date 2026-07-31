import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { spacing } from '@/theme/tokens';
import type { RhythmAction, RhythmEmotion } from '../types/rhythm';
import { RhythmCharacter } from './RhythmCharacter';

export function RhythmSuggestionCard({title,message,emotion='thinking',action='presentAdvice',primaryLabel='Посмотреть варианты',onPrimary,secondaryLabel,onSecondary}:{title:string;message:string;emotion?:RhythmEmotion;action?:RhythmAction;primaryLabel?:string;onPrimary:()=>void|Promise<void>;secondaryLabel?:string;onSecondary?:()=>void|Promise<void>}){
  return <GlassCard variant="accent"><View style={styles.top}><RhythmCharacter size="medium" emotion={emotion} action={action} preferIllustration={false}/><View style={styles.copy}><AppText variant="heading">{title}</AppText><AppText tone="secondary">{message}</AppText></View></View><View style={styles.actions}><PrimaryButton label={primaryLabel} onPress={onPrimary}/>{secondaryLabel&&onSecondary?<PrimaryButton label={secondaryLabel} secondary onPress={onSecondary}/>:null}</View></GlassCard>;
}
const styles=StyleSheet.create({top:{flexDirection:'row',alignItems:'center',gap:spacing.md},copy:{flex:1,gap:spacing.xs},actions:{gap:spacing.sm,marginTop:spacing.md}});

