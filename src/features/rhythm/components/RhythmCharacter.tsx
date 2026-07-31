import { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { AppIcon } from '@/components/AppIcon';
import { useScreenActivity } from '@/hooks/useScreenActivity';
import { useTheme } from '@/theme/ThemeProvider';
import { resolveRhythmAsset, rhythmAssets } from '../config/rhythmAssets';
import { recordRhythmAssetDiagnostics } from '../services/assetDiagnostics';
import type { RhythmAction, RhythmEmotion, RhythmSize } from '../types/rhythm';

const dimensions:Record<RhythmSize,number>={small:48,compact:76,medium:104,large:156,hero:228};

function RhythmCharacterComponent({emotion='idle',action='none',size='medium',animated=true,label='Ритм — помощник в Потоке'}:{emotion?:RhythmEmotion;action?:RhythmAction;size?:RhythmSize;animated?:boolean;label?:string}){
  'use no memo';const activity=useScreenActivity();const{colors}=useTheme();const value=dimensions[size];const breathe=useSharedValue(0);const react=useSharedValue(0);const canAnimate=animated&&activity.canAnimate;const resolved=useMemo(()=>resolveRhythmAsset(emotion,size),[emotion,size]);const[errorStage,setErrorStage]=useState<0|1|2>(0);
  const emergency=rhythmAssets.idle.compact!;const visibleAsset=useMemo(()=>errorStage===0?resolved:errorStage===1?{...emergency,requestedKey:resolved.requestedKey,requestedEmotion:emotion,requestedSize:'compact' as const,fallbackUsed:true}:null,[emergency,emotion,errorStage,resolved]);
  useEffect(()=>{setErrorStage(0);},[resolved.key,resolved.requestedKey]);
  useEffect(()=>{cancelAnimation(breathe);breathe.set(canAnimate?withRepeat(withSequence(withTiming(1,{duration:1800,easing:Easing.inOut(Easing.sin)}),withTiming(0,{duration:1800,easing:Easing.inOut(Easing.sin)})),-1,false):0);return()=>cancelAnimation(breathe);},[breathe,canAnimate]);
  useEffect(()=>{cancelAnimation(react);react.set(canAnimate&&action!=='none'?withSequence(withTiming(1,{duration:220}),withTiming(0,{duration:520})):0);return()=>cancelAnimation(react);},[action,canAnimate,react]);
  useEffect(()=>{if(!visibleAsset)return;recordRhythmAssetDiagnostics({emotion,assetKey:visibleAsset.key,requestedKey:resolved.requestedKey,displaySize:size,fileName:visibleAsset.fileName,pixelSize:`${visibleAsset.width}×${visibleAsset.height}`,fileBytes:visibleAsset.bytes,fallbackUsed:visibleAsset.fallbackUsed||errorStage>0,loadError:errorStage>0?'Primary asset failed to load':null,performanceMode:activity.performanceMode});},[activity.performanceMode,emotion,errorStage,resolved.requestedKey,size,visibleAsset]);
  const style=useAnimatedStyle(()=>({transform:[{translateY:-2*breathe.get()-2*react.get()},{rotateZ:`${(breathe.get()-.5)*.35+react.get()*.5}deg`},{scaleX:1-breathe.get()*.005+react.get()*.012},{scaleY:1+breathe.get()*.012+react.get()*.012}]}));
  return <View accessible accessibilityRole="image" accessibilityLabel={label} style={{width:value,height:value*1.12,alignItems:'center',justifyContent:'center'}}><Animated.View style={[styles.full,style]}>{visibleAsset?<Image source={visibleAsset.source} contentFit="contain" transition={80} cachePolicy="memory-disk" recyclingKey={visibleAsset.key} onError={()=>{if(__DEV__)console.warn(`[RhythmCharacter] Failed to load ${visibleAsset.fileName}`);setErrorStage(stage=>stage===0?1:2);}} style={styles.full}/>:<View style={[styles.icon,{backgroundColor:colors.greenGlow}]}><AppIcon name="flow" size={Math.max(28,value*.48)} color={colors.greenBright}/></View>}</Animated.View></View>;
}
export const RhythmCharacter=memo(RhythmCharacterComponent);
const styles=StyleSheet.create({full:{width:'100%',height:'100%',alignItems:'center',justifyContent:'center'},icon:{width:'82%',height:'82%',borderRadius:999,alignItems:'center',justifyContent:'center'}});
