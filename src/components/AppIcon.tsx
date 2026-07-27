import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '@/theme/tokens';

export type IconName = 'home' | 'diary' | 'catalog' | 'flow' | 'profile' | 'qr' | 'check';
export function AppIcon({ name, color = colors.textMuted, size = 24 }: { name: IconName; color?: string; size?: number }) {
  if (name === 'home') return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M3 11.2 12 4l9 7.2V21h-6v-6H9v6H3z" fill="none" stroke={color} strokeWidth={1.9} strokeLinejoin="round" /></Svg>;
  if (name === 'diary') return <Svg width={size} height={size} viewBox="0 0 24 24"><Rect x="5" y="3" width="14" height="18" rx="3" fill="none" stroke={color} strokeWidth={1.9}/><Path d="M9 8h6M9 12h6M9 16h4" stroke={color} strokeWidth={1.9} strokeLinecap="round"/></Svg>;
  if (name === 'catalog') return <Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx="8" cy="8" r="3" fill="none" stroke={color} strokeWidth={1.9}/><Circle cx="16" cy="8" r="3" fill="none" stroke={color} strokeWidth={1.9}/><Circle cx="8" cy="16" r="3" fill="none" stroke={color} strokeWidth={1.9}/><Circle cx="16" cy="16" r="3" fill="none" stroke={color} strokeWidth={1.9}/></Svg>;
  if (name === 'flow') return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M12 22c4.5 0 8-3.3 8-7.8 0-3.9-2.4-7.5-6.2-11.2.1 3-1.1 5.1-3.4 6.8.1-2.1-.7-3.7-2.2-4.9C5.5 8.2 4 11.2 4 14.3 4 18.7 7.5 22 12 22Z" fill="none" stroke={color} strokeWidth={1.9} strokeLinejoin="round"/><Path d="M9.2 16.2c0 1.6 1.2 2.8 2.8 2.8s2.8-1.2 2.8-2.8c0-1.4-.9-2.7-2.3-4.1-.1 1.1-.6 1.9-1.5 2.5-.1-.8-.4-1.4-1-1.9-.5 1-.8 2.2-.8 3.5Z" fill={color}/></Svg>;
  if (name === 'profile') return <Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx="12" cy="8" r="4" fill="none" stroke={color} strokeWidth={1.9}/><Path d="M4.5 21c.7-4 3.3-6 7.5-6s6.8 2 7.5 6" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round"/></Svg>;
  if (name === 'qr') return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round"/><Rect x="8" y="8" width="8" height="8" rx="1" fill="none" stroke={color} strokeWidth={1.5}/></Svg>;
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="m5 12 4.2 4.2L19 6.5" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}
