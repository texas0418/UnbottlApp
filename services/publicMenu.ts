import { supabase } from '@/services/supabase';
import {
  SupabaseBeverage,
  toWine,
  toBeer,
  toSpirit,
  toCocktail,
  toNonAlcoholic,
} from '@/contexts/BeverageContext';
import { Wine, Beer, Spirit, Cocktail, NonAlcoholicBeverage } from '@/types';

export interface PublicRestaurant {
  id: string;
  name: string;
  description: string | null;
  cuisineType: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  city: string | null;
}

export interface PublicMenu {
  restaurant: PublicRestaurant;
  wines: Wine[];
  beers: Beer[];
  spirits: Spirit[];
  cocktails: Cocktail[];
  nonAlcoholic: NonAlcoholicBeverage[];
  itemCount: number;
}

/**
 * A QR code encodes `https://unbottl.app/m/<slug>`. `<slug>` is either a
 * restaurant's `menu_slug` or its raw id. Given the scanned value (a full URL
 * or a bare slug), return just the slug/id.
 */
export function parseMenuSlug(scanned: string): string | null {
  if (!scanned) return null;
  const trimmed = scanned.trim();
  // Full URL form: pull the segment after "/m/".
  const match = trimmed.match(/\/m\/([^/?#\s]+)/i);
  if (match?.[1]) return decodeURIComponent(match[1]);
  // Bare slug/id (no slashes) — accept as-is.
  if (!/[\s/]/.test(trimmed)) return trimmed;
  return null;
}

/**
 * Fetch a restaurant's public menu by slug or id.
 *
 * NOTE: This requires row-level-security policies that permit anonymous SELECT
 * on `restaurants` and `beverages` (scoped to active menus). Until those
 * policies exist the queries return empty/permission errors, which surface to
 * the caller as `null` — the UI then shows an appropriate empty state.
 */
export async function fetchPublicMenu(slugOrId: string): Promise<PublicMenu | null> {
  const slug = parseMenuSlug(slugOrId) ?? slugOrId;
  if (!slug) return null;

  // Resolve the restaurant. Try menu_slug first, then fall back to id so both
  // slug- and id-based QR codes work.
  let restaurantRow: any = null;

  const bySlug = await supabase
    .from('restaurants')
    .select('id, name, description, cuisine_type, logo_url, cover_image_url, city, menu_slug')
    .eq('menu_slug', slug)
    .limit(1)
    .maybeSingle();

  if (bySlug.data) {
    restaurantRow = bySlug.data;
  } else {
    // menu_slug may not exist as a column, or no match — try by id.
    const byId = await supabase
      .from('restaurants')
      .select('id, name, description, cuisine_type, logo_url, cover_image_url, city')
      .eq('id', slug)
      .limit(1)
      .maybeSingle();
    restaurantRow = byId.data;
  }

  if (!restaurantRow) return null;

  const { data: bevRows } = await supabase
    .from('beverages')
    .select('*')
    .eq('restaurant_id', restaurantRow.id)
    .eq('is_active', true);

  const rows: SupabaseBeverage[] = (bevRows as SupabaseBeverage[]) || [];
  const rowsIn = (category: string) => rows.filter((r) => r.category === category);

  const wines = rowsIn('wine').map(toWine);
  const beers = rowsIn('beer').map(toBeer);
  const spirits = rowsIn('spirit').map(toSpirit);
  const cocktails = rowsIn('cocktail').map(toCocktail);
  const nonAlcoholic = rowsIn('non-alcoholic').map(toNonAlcoholic);

  return {
    restaurant: {
      id: restaurantRow.id,
      name: restaurantRow.name,
      description: restaurantRow.description ?? null,
      cuisineType: restaurantRow.cuisine_type ?? null,
      logoUrl: restaurantRow.logo_url ?? null,
      coverImageUrl: restaurantRow.cover_image_url ?? null,
      city: restaurantRow.city ?? null,
    },
    wines,
    beers,
    spirits,
    cocktails,
    nonAlcoholic,
    itemCount: rows.length,
  };
}
