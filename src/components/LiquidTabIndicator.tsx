import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { radii } from '@/theme/tokens';

export function LiquidTabIndicator({position,barWidth,count}:{position:SharedValue<number>;barWidth:number;count:number}){const{colors}=useTheme();const animated=useAnimatedStyle(()=>{const itemWidth=barWidth/Math.max(1,count);const base=Math.max(46,Math.min(66,itemWidth-12));const distance=Math.abs(position.value-Math.round(position.value));const width=base+distance*28;return{left:itemWidth*position.value+(itemWidth-width)/2,width,transform:[{scaleY:1-distance*.08}]};});return <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.indicator,{shadowColor:colors.greenPrimary},animated]}><LinearGradient colors={[colors.greenGlow,colors.greenPrimary+'70']} start={{x:0,y:0}} end={{x:1,y:1}} style={[StyleSheet.absoluteFill,styles.gradient]}/></Animated.View>;}
const styles=StyleSheet.create({indicator:{position:'absolute',top:6,height:43,borderRadius:radii.pill,overflow:'hidden',shadowOpacity:.34,shadowRadius:14,shadowOffset:{width:0,height:5}},gradient:{borderRadius:radii.pill}});
