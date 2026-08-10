/**
 * Ground and ink for a card's media area when a drink has no photograph.
 *
 * The previous treatment painted the drink's type colour at 8% alpha and drew
 * the category glyph in that same colour at full strength. That reads fine for
 * a red (#722F37) and fails completely for the pale types: a white wine
 * (#F5E6C8), a sparkling (#F7E7CE), a pilsner (#FFD700) all gave a near-white
 * glyph on a near-white ground. That is the "blank white box" in #6.
 *
 * Here the ground is a fixed, honest tint of the type colour and the ink is
 * pushed away from the ground — darker on a light ground, lighter on a dark one
 * — until it clears 3:1, the WCAG floor for a graphical object. Every type
 * colour in mocks/wines.ts and mocks/beverages.ts passes.
 *
 * Pure and deterministic: same inputs, same hex out. No React, no theme import,
 * so it can be exercised directly.
 */

export interface CardSwatch {
  /** Fill for the media area. */
  ground: string;
  /** Glyph colour, guaranteed >= MIN_CONTRAST against `ground`. */
  ink: string;
}

/** How much of the type colour shows through the ground. */
const GROUND_TINT = 0.14;
/** WCAG 2.1 SC 1.4.11 floor for a non-text graphical object. */
const MIN_CONTRAST = 3;
/** Fraction of the remaining distance to travel per darkening step. */
const STEP = 0.12;
const MAX_STEPS = 16;
/** Above this relative luminance the ground counts as light, so ink goes dark. */
const LIGHT_GROUND = 0.45;

type Rgb = readonly [number, number, number];

const BLACK: Rgb = [0, 0, 0];
const WHITE: Rgb = [255, 255, 255];
/** Used when a caller hands us something that isn't a colour we can read. */
const FALLBACK: Rgb = [114, 47, 55]; // Colors.primary

function parseHex(value: string): Rgb | null {
  const hex = value.trim().replace(/^#/, '');
  if (hex.length === 3) {
    const [r, g, b] = hex.split('');
    return parseHex(`${r}${r}${g}${g}${b}${b}`);
  }
  if (hex.length !== 6 || !/^[0-9a-f]{6}$/i.test(hex)) return null;
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

function toHex(rgb: Rgb): string {
  return `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

/** `t` of `b` blended into `a`. */
function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/** WCAG relative luminance. */
function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: Rgb | string, b: Rgb | string): number {
  const ra = typeof a === 'string' ? parseHex(a) ?? FALLBACK : a;
  const rb = typeof b === 'string' ? parseHex(b) ?? FALLBACK : b;
  const la = luminance(ra);
  const lb = luminance(rb);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * @param typeColor the drink's type colour, e.g. wineTypeColors.white
 * @param surface   the card background the ground sits on
 */
export function cardSwatch(typeColor: string, surface: string): CardSwatch {
  const base = parseHex(typeColor) ?? FALLBACK;
  const ground = mix(parseHex(surface) ?? WHITE, base, GROUND_TINT);

  const towards = luminance(ground) > LIGHT_GROUND ? BLACK : WHITE;
  let ink = base;
  for (let i = 0; i < MAX_STEPS && contrastRatio(ink, ground) < MIN_CONTRAST; i += 1) {
    ink = mix(ink, towards, STEP);
  }
  // Stepping converges for every colour we ship, but never hand back something
  // illegible if a venue's palette ever feeds in an edge case.
  if (contrastRatio(ink, ground) < MIN_CONTRAST) ink = towards;

  return { ground: toHex(ground), ink: toHex(ink) };
}
