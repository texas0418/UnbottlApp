import { lightColors } from './theme';

/**
 * The light palette, kept as the default export so the ~200 existing
 * `import Colors from '@/constants/colors'` call sites keep working unchanged.
 *
 * Colour now lives in constants/theme.ts alongside the spacing, radius, type
 * and elevation scales. New code should prefer `useThemeColors()`, which will
 * resolve light or dark once the theme is wired to the device setting.
 */
export default lightColors;
