/**
 * Where a venue's public menu lives.
 *
 * One place, because this string ends up printed on table tents. It was
 * hardcoded in app/qr-menu.tsx as `unbottl.app` — a domain that does not
 * resolve — so every QR generated before 2026-08-11 pointed at nothing.
 */

/** The public site. Guests land here; the app is optional. */
export const MENU_HOST = 'https://unbottl.com';

/** A guest-facing menu URL for a venue's slug or id. */
export function menuUrlFor(slugOrId: string): string {
  return `${MENU_HOST}/m/${slugOrId}`;
}
