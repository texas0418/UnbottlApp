/**
 * Design tokens.
 *
 * The scales below are derived from what the app already does, not imposed on
 * it — every step was chosen so migrating an existing style is usually a ±1px
 * change rather than a redesign. See the frequency counts in each section.
 *
 * Colour is defined twice, light and dark, behind the same semantic names.
 * Nothing reads `darkColors` yet; wiring useColorScheme is a separate change.
 */

// ─── Spacing ────────────────────────────────────────────────────────────────
// Observed: 16 (52 uses), 20 (22), 12 (16), 24 (13), 14 (12), 4, 8, 32, 40.
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

// ─── Radius ─────────────────────────────────────────────────────────────────
// Observed: 12 (95), 16 (63), 10 (47), 20 (42), 14 (31), 8 (19), 4 (12).
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
} as const;

// ─── Type scale ─────────────────────────────────────────────────────────────
// 21 distinct sizes are in use today, 8px through 48px, with no scale. The
// steps below sit on the app's existing rhythm — it leans on odd sizes, and
// 13 and 15 are the two most common of all — so most migrations move a size by
// at most a point:
//   xs   ← 10, 11        sm  ← 12, 13        base ← 14, 15
//   md   ← 16, 17        lg  ← 18, 20        xl   ← 22, 24
//   xxl  ← 26, 28, 32+
export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
} as const;

// ─── Families ───────────────────────────────────────────────────────────────
// Two roles, one bundled family.
//
// `display` is EB Garamond — a wine list is a piece of fine printing, and the
// archetypal book face reads that way where the system serif does not. Its
// old-style figures suit menu prices. Used for venue names, section headings,
// drink names and prices.
//
// `ui` stays the platform font deliberately. San Francisco and Roboto are built
// for interface chrome at small sizes, and bundling a second family to replace
// them would cost weight for no gain a guest would notice.
//
// Weights are separate faces here, not a numeric fontWeight — on Android a
// fontWeight against a custom family silently falls back to the system font.
export const fontFamily = {
  display: 'EBGaramond_400Regular',
  displayMedium: 'EBGaramond_500Medium',
  displaySemibold: 'EBGaramond_600SemiBold',
  displayBold: 'EBGaramond_700Bold',
  ui: undefined as string | undefined,
} as const;

// Observed weights: 600 (221), 700 (85), 500 (78). '400' appears once.
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/** Line heights that keep prose readable and headings tight. */
export const lineHeight = {
  xs: 16,
  sm: 18,
  base: 21,
  md: 23,
  lg: 26,
  xl: 30,
  xxl: 36,
} as const;

// ─── Elevation ──────────────────────────────────────────────────────────────
// 36 files hand-roll their own shadow. Observed clusters: radius 8 + elevation 2
// (by far the most common), radius 12 + elevation 4, radius 4 for subtle lifts.
// `color` is left to the caller so light and dark can shadow differently.
export const elevation = {
  none: {
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  sm: {
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  md: {
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  lg: {
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
} as const;

// ─── Cards ──────────────────────────────────────────────────────────────────
// Grid cards have to line up across a row, and a row can mix a wine with a
// beer. These are the two numbers that have to agree between WineCard and
// BeverageCard for that to happen.
export const card = {
  /**
   * Shape of the media area. Previously a fixed height — 160 on WineCard, 140
   * on BeverageCard — which put a 20pt step in every mixed row, and letterboxed
   * badly on iPad where a 4-column card is ~300pt wide. An aspect ratio scales
   * with the column and is the same on both cards.
   */
  mediaAspectRatio: 4 / 3,
  /**
   * Ceiling on the media area. The ratio alone is right on a phone, where a
   * 2-column card is ~170pt wide, but on a 3-column iPad the card is ~415pt and
   * 4:3 gives a 310pt image — only two rows of drinks fit on screen. Every card
   * in a row is the same width, so they all clamp to the same height and the
   * row stays flush either way.
   */
  mediaMaxHeight: 200,
  /** Lines of drink name reserved on every card, needed or not. */
  titleLines: 2,
} as const;

// ─── Colour ─────────────────────────────────────────────────────────────────

export const lightColors = {
  primary: '#722F37',
  primaryLight: '#8B4049',
  primaryDark: '#5A252C',
  secondary: '#C9A962',
  secondaryLight: '#D4BC82',
  accent: '#2D2D2D',
  background: '#FAF8F5',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6B6B6B',
  // Note: 2.53:1 against `background` — below the 3:1 floor. Deliberately left
  // as-is so this change stays a pure token extraction; darkening it far enough
  // to pass collapses it into textSecondary, so the muted/secondary hierarchy
  // needs rethinking rather than a nudge. Tracked with the accessibility work.
  textMuted: '#9E9E9E',
  border: '#E8E4E0',
  borderLight: '#F0EDE9',
  success: '#4A7C59',
  error: '#C73E3E',
  warning: '#D4A84B',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
  cardShadow: 'rgba(114, 47, 55, 0.08)',
  wineRed: '#722F37',
  wineWhite: '#F5E6C8',
  wineRose: '#E8B4B8',
  wineSparkling: '#F7E7CE',
  wineDessert: '#D4A574',
} as const;

/**
 * Dark values, tuned rather than inverted.
 *
 * The grounds keep the warm bias of the light theme (#FAF8F5 is warm, so the
 * dark ground is a warm near-black, not a blue-grey). The wine red is lifted
 * well above its light value — #722F37 on a dark ground is nearly invisible —
 * and the gold is softened so it doesn't glare.
 */
export type ThemeColors = { [K in keyof typeof lightColors]: string };

export const darkColors: ThemeColors = {
  primary: '#C4707C',
  primaryLight: '#D48D97',
  primaryDark: '#A85463',
  secondary: '#D4BC82',
  secondaryLight: '#E2D0A4',
  accent: '#E8E4E0',
  background: '#141110',
  surface: '#1D1918',
  surfaceElevated: '#262120',
  text: '#F5F1EC',
  textSecondary: '#B3AAA2',
  textMuted: '#8A817A',
  border: '#332C29',
  borderLight: '#28221F',
  success: '#79B08A',
  error: '#E97B7B',
  warning: '#E0BC72',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.65)',
  cardShadow: 'rgba(0, 0, 0, 0.45)',
  wineRed: '#C4707C',
  wineWhite: '#EBDCB8',
  wineRose: '#E0A8AC',
  wineSparkling: '#E8D6BC',
  wineDessert: '#C9A074',
};

export const theme = {
  spacing,
  fontFamily,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
  elevation,
  card,
} as const;
