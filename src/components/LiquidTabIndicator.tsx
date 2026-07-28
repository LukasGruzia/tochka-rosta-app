import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { radii } from '@/theme/tokens';

export function LiquidTabIndicator({position,barWidth,count}:{position:SharedValue<number>;barWidth:number;count:number}) {
  'use no memo';
  const { colors } = useTheme();
  const itemWidth = barWidth / Math.max(1, count);
  const baseWidth = Math.max(46, Math.min(66, itemWidth - 12));
  const restingLeft = (itemWidth - baseWidth) / 2;
  const animated = useAnimatedStyle(() => {
    const current = position.get();
    const distance = Math.abs(current - Math.round(current));
    return { transform: [{ translateX: itemWidth * current }, { scaleX: 1 + distance * 0.32 }, { scaleY: 1 - distance * 0.04 }], opacity: 0.94 + distance * 0.06 };
  });
  return <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.indicator, { left: restingLeft, width: baseWidth, shadowColor: colors.greenPrimary, borderColor: colors.glassBorderStrong }, animated]}>
    <LinearGradient colors={[`${colors.greenBright}36`, `${colors.greenPrimary}72`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, styles.gradient]} />
    <View style={[styles.highlight, { backgroundColor: `${colors.textPrimary}38` }]} />
  </Animated.View>;
}
const styles=StyleSheet.create({indicator:{position:'absolute',top:7,height:48,borderRadius:radii.pill,overflow:'hidden',borderWidth:StyleSheet.hairlineWidth,shadowOpacity:.25,shadowRadius:10,shadowOffset:{width:0,height:4}},gradient:{borderRadius:radii.pill},highlight:{position:'absolute',left:10,right:10,top:3,height:1,borderRadius:1}});
