import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useScreenActivity } from '@/hooks/useScreenActivity';
import { useTheme } from '@/theme/ThemeProvider';
import { rhythmAssets } from '../config/rhythmAssets';
import type { RhythmAction, RhythmEmotion, RhythmSize } from '../types/rhythm';

const dimensions:Record<RhythmSize,number>={small:42,compact:62,medium:96,large:156,hero:228};
const flame='M60 8C72 27 73 43 66 58C79 49 85 37 87 24C105 45 113 71 105 97C99 121 82 135 59 135C31 135 13 117 14 91C15 69 29 52 40 35C47 24 50 15 48 5C53 9 57 14 60 20C62 16 62 12 60 8Z';

function VectorRhythm({emotion,action,size}:{emotion:RhythmEmotion;action:RhythmAction;size:number}){
  const {colors}=useTheme();const sleeping=emotion==='sleeping'||action==='rest';const blinking=action==='blink';const surprised=emotion==='surprised';const happy=['happy','motivated','celebrating'].includes(emotion);
  const leftArm=action==='stretch'||action==='celebrate'?'M25 87C13 73 10 58 16 46':action==='wave'?'M25 87C12 76 7 63 11 55':action==='run'?'M25 88C13 84 7 75 8 66':'M24 88C13 92 8 102 10 111';
  const rightArm=action==='stretch'||action==='celebrate'?'M95 84C107 70 110 56 104 44':action==='point'?'M95 84C108 74 112 61 108 53':action==='run'?'M96 88C108 94 113 103 111 112':'M96 88C108 91 113 101 111 110';
  return <Svg width={size} height={size*1.12} viewBox="0 0 120 150" accessible={false}>
    <Defs><LinearGradient id="rhBody" x1="0" y1="1" x2="1" y2="0"><Stop offset="0" stopColor={colors.greenDeep}/><Stop offset=".52" stopColor={colors.greenPrimary}/><Stop offset="1" stopColor={colors.greenBright}/></LinearGradient></Defs>
    <Path d={leftArm} stroke={colors.greenPrimary} strokeWidth="12" strokeLinecap="round" fill="none"/><Path d={rightArm} stroke={colors.greenPrimary} strokeWidth="12" strokeLinecap="round" fill="none"/>
    <Path d={flame} fill="url(#rhBody)"/><Path d="M55 30C62 41 60 51 54 61C67 53 72 45 73 34C82 49 84 65 78 77C71 88 57 91 45 84C31 75 34 61 41 50C48 40 51 34 50 27Z" fill={colors.greenBright} opacity=".34"/>
    {sleeping||blinking?<G><Path d="M34 85Q43 91 51 85" stroke={colors.backgroundPrimary} strokeWidth="3.5" strokeLinecap="round" fill="none"/><Path d="M69 85Q78 91 86 85" stroke={colors.backgroundPrimary} strokeWidth="3.5" strokeLinecap="round" fill="none"/></G>:<G><Ellipse cx="43" cy="84" rx={surprised?11:10} ry={surprised?13:11} fill="#F5FFF7"/><Ellipse cx="77" cy="84" rx={surprised?11:10} ry={surprised?13:11} fill="#F5FFF7"/><Circle cx="44" cy="86" r="7" fill="#07321F"/><Circle cx="76" cy="86" r="7" fill="#07321F"/><Circle cx="46" cy="82" r="2.2" fill="#FFFFFF"/><Circle cx="78" cy="82" r="2.2" fill="#FFFFFF"/></G>}
    <Path d={surprised?'M56 105Q60 101 64 105Q60 112 56 105Z':happy?'M51 102Q60 113 69 102':'M53 104Q60 110 67 104'} stroke="#07502E" strokeWidth="3" strokeLinecap="round" fill={surprised?'#07502E':'none'}/>
    <Path d={action==='run'?'M46 131L36 143':'M43 133V142'} stroke={colors.greenPrimary} strokeWidth="12" strokeLinecap="round"/><Path d={action==='run'?'M75 132L85 142':'M77 133V142'} stroke={colors.greenPrimary} strokeWidth="12" strokeLinecap="round"/>
    {action==='holdFood'?<G><Ellipse cx="60" cy="112" rx="20" ry="8" fill={colors.surfaceSolid}/><Circle cx="52" cy="107" r="4" fill={colors.warning}/><Circle cx="61" cy="106" r="4" fill={colors.greenBright}/><Circle cx="69" cy="108" r="4" fill={colors.danger}/></G>:null}
    {action==='presentAdvice'?<G><Circle cx="105" cy="70" r="7" fill={colors.greenGlow} stroke={colors.greenBright} strokeWidth="1.5"/><Path d="M105 66V70M105 74V74.2" stroke={colors.greenBright} strokeWidth="2" strokeLinecap="round"/></G>:null}
  </Svg>;
}

function RhythmCharacterComponent({emotion='idle',action='none',size='medium',animated=true,preferIllustration=true,label='Ритм — помощник в Потоке'}:{emotion?:RhythmEmotion;action?:RhythmAction;size?:RhythmSize;animated?:boolean;preferIllustration?:boolean;label?:string}){
  'use no memo';const activity=useScreenActivity();const value=dimensions[size];const breathe=useSharedValue(0);const react=useSharedValue(0);const canAnimate=animated&&activity.canAnimate;
  useEffect(()=>{cancelAnimation(breathe);breathe.set(canAnimate?withRepeat(withSequence(withTiming(1,{duration:1700,easing:Easing.inOut(Easing.sin)}),withTiming(0,{duration:1700,easing:Easing.inOut(Easing.sin)})),-1,false):0);return()=>cancelAnimation(breathe);},[breathe,canAnimate]);
  useEffect(()=>{cancelAnimation(react);react.set(canAnimate&&action!=='none'?withSequence(withTiming(1,{duration:220}),withTiming(0,{duration:520})):0);return()=>cancelAnimation(react);},[action,canAnimate,react]);
  const style=useAnimatedStyle(()=>({transform:[{translateY:-2*breathe.get()-3*react.get()},{scale:1+breathe.get()*.018+react.get()*.035}]}));
  const raster=preferIllustration&&emotion==='idle'&&(size==='hero'||size==='large');
  return <View accessible accessibilityRole="image" accessibilityLabel={label} style={{width:value,height:value*1.12,alignItems:'center',justifyContent:'center'}}><Animated.View style={[styles.full,style]}>{raster?<Image source={rhythmAssets.idleHero} contentFit="contain" transition={120} cachePolicy="memory-disk" style={styles.full}/>:<VectorRhythm emotion={emotion} action={action} size={value}/>}</Animated.View></View>;
}
export const RhythmCharacter=memo(RhythmCharacterComponent);
const styles=StyleSheet.create({full:{width:'100%',height:'100%',alignItems:'center',justifyContent:'center'}});

