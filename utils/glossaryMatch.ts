/**
 * Find glossary terms inside a menu string so the UI can make them tappable.
 *
 * The input is whatever the venue typed — "Cabernet Sauvignon, Merlot" or
 * "Mezcal, Aperol, Lime juice" — so the matching has to be forgiving of
 * punctuation and order, and strict about word boundaries.
 *
 * Three rules that matter, each of which is a bug if you get it wrong:
 *
 *   1. Whole words only. "Rolle" must not light up inside "Rolled", and "gin"
 *      must not light up inside "ginger". This is the one that embarrasses you
 *      in front of a customer.
 *   2. Longest alias wins. "Cabernet Sauvignon" must beat "Cabernet", or the
 *      guest taps a two-word term and gets the definition of one word of it.
 *   3. No overlaps. Every character belongs to at most one match, so the
 *      renderer can walk segments left to right without bookkeeping.
 *
 * Pure and deterministic. No React, no I/O.
 */
import { glossary, GlossaryEntry } from '@/constants/glossary';

export interface GlossaryMatch {
  /** Index of the first character of the match in the source string. */
  start: number;
  /** Index one past the last character. */
  end: number;
  /** The matched text exactly as it appeared, so casing is preserved. */
  text: string;
  entry: GlossaryEntry;
}

/** A run of text, with an entry attached when it is a matched term. */
export interface GlossarySegment {
  text: string;
  entry?: GlossaryEntry;
}

/** Aliases paired with their entry, longest first so rule 2 falls out of order. */
const INDEX: { alias: string; entry: GlossaryEntry }[] = glossary
  .flatMap((entry) => entry.aliases.map((alias) => ({ alias: alias.toLowerCase(), entry })))
  .sort((a, b) => b.alias.length - a.alias.length);

/** A word character for boundary purposes. Hyphens count, so "off-dry" is one word. */
function isWordChar(ch: string | undefined): boolean {
  return ch !== undefined && /[\p{L}\p{N}-]/u.test(ch);
}

export function findGlossaryTerms(text: string): GlossaryMatch[] {
  if (!text) return [];
  const haystack = text.toLowerCase();
  const matches: GlossaryMatch[] = [];
  // Characters already claimed by a longer alias.
  const taken = new Array<boolean>(text.length).fill(false);

  for (const { alias, entry } of INDEX) {
    let from = 0;
    for (;;) {
      const at = haystack.indexOf(alias, from);
      if (at === -1) break;
      const end = at + alias.length;
      from = at + 1;

      // Rule 1: the match must not be embedded in a longer word.
      if (isWordChar(text[at - 1]) || isWordChar(text[end])) continue;
      // Rule 3: skip anything a longer alias already claimed.
      if (taken.slice(at, end).some(Boolean)) continue;

      for (let i = at; i < end; i += 1) taken[i] = true;
      matches.push({ start: at, end, text: text.slice(at, end), entry });
    }
  }

  return matches.sort((a, b) => a.start - b.start);
}

/**
 * Split `text` into consecutive segments, with `entry` set on the matched ones.
 * Concatenating every `text` reproduces the input exactly — the renderer cannot
 * silently drop or duplicate a character.
 */
export function segmentByGlossary(text: string): GlossarySegment[] {
  if (!text) return [];
  const matches = findGlossaryTerms(text);
  if (matches.length === 0) return [{ text }];

  const segments: GlossarySegment[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start > cursor) segments.push({ text: text.slice(cursor, m.start) });
    segments.push({ text: m.text, entry: m.entry });
    cursor = m.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

/** Unique entries mentioned anywhere in the given strings, in glossary order. */
export function entriesFor(...texts: (string | null | undefined)[]): GlossaryEntry[] {
  const seen = new Set<string>();
  const found: GlossaryEntry[] = [];
  for (const t of texts) {
    for (const m of findGlossaryTerms(t ?? '')) {
      if (!seen.has(m.entry.term)) {
        seen.add(m.entry.term);
        found.push(m.entry);
      }
    }
  }
  return found;
}
