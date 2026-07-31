import type { PropsWithChildren } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/PrimaryButton';
import { radii, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { RhythmCharacter } from './RhythmCharacter';

export function RhythmCenterSheet({visible,title='Центр Ритма',onClose,children}:PropsWithChildren<{visible:boolean;title?:string;onClose:()=>void}>){const{colors}=useTheme();return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><Pressable style={[styles.scrim,{backgroundColor:colors.blackScrim}]} onPress={onClose}/><View style={[styles.sheet,{backgroundColor:colors.surfaceSolid,borderColor:colors.glassBorderStrong}]}><View style={[styles.handle,{backgroundColor:colors.textMuted}]}/><ScrollView contentContainerStyle={styles.content}><View style={styles.header}><RhythmCharacter size="medium" emotion="thinking" action="presentAdvice" preferIllustration={false}/><View style={styles.title}><AppText variant="title">{title}</AppText><AppText tone="secondary">Локальные подсказки на основе твоих данных</AppText></View></View>{children}<PrimaryButton label="Закрыть" secondary onPress={onClose}/></ScrollView></View></Modal>;}
const styles=StyleSheet.create({scrim:{...StyleSheet.absoluteFillObject},sheet:{position:'absolute',left:0,right:0,bottom:0,maxHeight:'86%',borderTopLeftRadius:radii.xl,borderTopRightRadius:radii.xl,borderWidth:1},handle:{alignSelf:'center',width:42,height:5,borderRadius:radii.pill,marginTop:spacing.sm},content:{padding:spacing.lg,paddingBottom:42,gap:spacing.lg},header:{flexDirection:'row',alignItems:'center',gap:spacing.md},title:{flex:1,gap:spacing.xs}});

