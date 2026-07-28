import { useRef, useState, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { safelyRunHaptic, type AppHaptic } from '@/services/haptics';
import { recordUiAction } from '@/services/uiDiagnostics';
import { canRunPressAction, createPressController } from '@/services/pressController';
import { motion } from '@/theme/tokens';

interface AppPressableProps extends Omit<PressableProps, 'children' | 'onPress' | 'style'> {
  children: ReactNode;
  onPress?: () => void | Promise<void>;
  style?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  loading?: boolean;
  haptic?: AppHaptic;
  actionLabel?: string;
  onError?: (error: unknown) => void;
}

export function AppPressable({ children, onPress, style, pressedStyle, disabled, loading = false, haptic = 'none', actionLabel, onError, ...props }: AppPressableProps) {
  'use no memo';
  const scale = useSharedValue(1);
  const [pressController] = useState(createPressController);
  const longPressTriggered = useRef(false);
  const [pressed, setPressed] = useState(false);
  const unavailable = Boolean(disabled || loading);
  const { onLongPress, ...pressableProps } = props;
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const handlePressIn = () => {
    setPressed(true);
    scale.set(withTiming(motion.press.scale, { duration: motion.fast }));
  };
  const handlePressOut = () => {
    setPressed(false);
    scale.set(withSpring(1, motion.spring.snappy));
  };
  const handlePress = async () => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    if (!canRunPressAction({ disabled: Boolean(disabled), loading, hasAction: Boolean(onPress) }) || !onPress || pressController.isRunning()) return;
    const label = actionLabel ?? props.accessibilityLabel ?? 'button';
    recordUiAction('button_pressed', String(label));
    void safelyRunHaptic(haptic);
    await pressController.run(onPress, (error) => {
      recordUiAction('error_occurred', String(label), error instanceof Error ? error.message : 'Unknown press error');
      onError?.(error);
      if (__DEV__) console.error(`[AppPressable] ${String(label)}`, error);
    });
  };
  const handleLongPress: PressableProps['onLongPress'] = (event) => {
    longPressTriggered.current = true;
    onLongPress?.(event);
  };

  return <Animated.View style={[style, animatedStyle, pressed && pressedStyle, unavailable && { opacity: 0.45 }]}>
    <Pressable {...pressableProps} disabled={unavailable} onLongPress={handleLongPress} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={() => { void handlePress(); }} style={{ flex: 1 }}>
      {children}
    </Pressable>
  </Animated.View>;
}
