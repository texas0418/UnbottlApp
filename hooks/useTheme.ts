import { useColorScheme } from 'react-native';
import { lightColors, darkColors, theme, type ThemeColors } from '@/constants/theme';

/**
 * Colours resolved for the device's appearance setting.
 *
 * Only surfaces that opt in by calling this follow the system; screens that
 * still `import Colors from '@/constants/colors'` stay light. That is
 * deliberate — a half-converted app looks worse than a consistently light one,
 * so screens move over deliberately rather than all at once.
 */
export function useThemeColors(): ThemeColors {
  return useColorScheme() === 'dark' ? darkColors : lightColors;
}

/** True when the device is in dark appearance. */
export function useIsDark(): boolean {
  return useColorScheme() === 'dark';
}

/** Spacing, radius, type and elevation scales. Appearance-independent. */
export function useTheme() {
  return theme;
}

export { lightColors, darkColors };
export type { ThemeColors };
