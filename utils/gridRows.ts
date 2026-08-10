/**
 * Pad a grid's data so the last row is full.
 *
 * FlatList's `numColumns` does not backfill. Every grid in the app gives its
 * card wrapper `flex: 1`, so 4 items in a 3-column grid leaves the fourth
 * stretched across the entire width — a card three times the size of its
 * neighbours, which is the most obvious part of the ragged grid in #6.
 * Appending inert spacers keeps the last real card the width of every other.
 *
 * Pure and generic: no React, no knowledge of what an item is.
 */

const SPACER = '__grid_spacer__';

export interface GridSpacer {
  readonly __spacer: typeof SPACER;
  /** Stable within a render, so keyExtractor has something to return. */
  readonly key: string;
}

export function isGridSpacer(item: unknown): item is GridSpacer {
  return (
    typeof item === 'object' &&
    item !== null &&
    (item as GridSpacer).__spacer === SPACER
  );
}

/**
 * Returns `items` with enough spacers appended to reach a whole number of rows.
 *
 * An empty list is returned untouched — padding it would push FlatList's
 * `ListEmptyComponent` off the screen behind a row of invisible cards.
 */
export function padGridRow<T>(items: readonly T[], columns: number): (T | GridSpacer)[] {
  const padded: (T | GridSpacer)[] = [...items];
  if (columns < 2 || items.length === 0) return padded;

  const remainder = items.length % columns;
  if (remainder === 0) return padded;

  for (let i = remainder; i < columns; i += 1) {
    padded.push({ __spacer: SPACER, key: `${SPACER}-${i}` });
  }
  return padded;
}
