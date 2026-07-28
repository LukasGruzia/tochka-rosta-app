import { darkColors } from './colors';
import { glass } from './glass';
import { motion, animations } from './motion';
import { radii } from './radii';
import { shadows } from './shadows';
import { sizes } from './sizes';
import { spacing } from './spacing';
import { typography } from './typography';

export { darkColors, lightColors, type ThemeColors } from './colors';
export { glass } from './glass';
export { motion, animations } from './motion';
export { radii } from './radii';
export { shadows } from './shadows';
export { sizes } from './sizes';
export { spacing } from './spacing';
export { typography } from './typography';
export { themes } from './themes';

export const colors = darkColors;
export const theme = { colors, spacing, radii, typography, shadows, glass, animations, motion, sizes } as const;
