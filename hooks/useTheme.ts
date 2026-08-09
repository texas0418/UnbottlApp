import { lightColors, darkColors, theme, type ThemeColors } from '@/constants/theme';

/**
 * Resolved colours for the current appearance.
 *
 * Today this always returns the light palette — the app has never had a dark
 * theme and flipping it on is its own piece of work, since a lot of screens
 * hardcode colours that bypass the palette entirely. This hook is the seam that
 * change plugs into: once it reads useColorScheme(), anything already calling
 * it follows the device automatically.
 *
 * New screens should use this instead of importing Colors directly.
 */
export function useThemeColors(): ThemeColors {
  return lightColors;
}

/** Spacing, radius, type and elevation scales. Appearance-independent. */
export function useTheme() {
  return theme;
}

export { lightColors, darkColors };
export type { ThemeColors };
