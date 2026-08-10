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
  /** Venue's own accent colour as #RRGGBB. Null means fall back to Unbottl's. */
  brandColor: string | null;
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
 * Fetch a restaurant's public menu by id (QR codes encode `.../m/<restaurant.id>`).
 *
 * Reads from two curated, read-only views — `public_menu_restaurants` and
 * `public_menu_beverages` — that expose only menu-appropriate columns of ACTIVE
 * items to anonymous guests, without leaking private fields (owner contact,
 * cost/margins). See db/public-menu-access.sql for the migration that creates
 * them. Until that migration is applied the queries error and this returns
 * `null`, so the UI shows a graceful "menu unavailable" state.
 */
interface PublicRestaurantRow {
  id: string;
  name: string;
  logo_url?: string | null;
  cover_image_url?: string | null;
  brand_color?: string | null;
  cuisine_type?: string | null;
}

/**
 * Read the venue row, preferring the branding columns.
 *
 * db/venue-branding.sql widens `public_menu_restaurants` to carry logo, cover,
 * brand colour and cuisine. Until that migration is applied those columns don't
 * exist and PostgREST rejects the whole select — which would take the guest menu
 * down. So we ask for the wide row and fall back to the original id + name,
 * letting an un-migrated project keep working with Unbottl's default styling.
 */
async function fetchPublicRestaurantRow(id: string): Promise<PublicRestaurantRow | null> {
  const wide = await supabase
    .from('public_menu_restaurants')
    .select('id, name, logo_url, cover_image_url, brand_color, cuisine_type')
    .eq('id', id)
    .limit(1)
    .maybeSingle();

  if (!wide.error) return (wide.data as PublicRestaurantRow) ?? null;

  const { data } = await supabase
    .from('public_menu_restaurants')
    .select('id, name')
    .eq('id', id)
    .limit(1)
    .maybeSingle();

  return (data as PublicRestaurantRow) ?? null;
}

export async function fetchPublicMenu(slugOrId: string): Promise<PublicMenu | null> {
  const id = parseMenuSlug(slugOrId) ?? slugOrId;
  if (!id) return null;

  const restaurantRow = await fetchPublicRestaurantRow(id);
  if (!restaurantRow) return null;

  const { data: bevRows } = await supabase
    .from('public_menu_beverages')
    .select('*')
    .eq('restaurant_id', restaurantRow.id);

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
      logoUrl: restaurantRow.logo_url ?? null,
      coverImageUrl: restaurantRow.cover_image_url ?? null,
      brandColor: restaurantRow.brand_color ?? null,
      cuisineType: restaurantRow.cuisine_type ?? null,
      // Not exposed by the view — nothing renders them, so they stay private.
      description: null,
      city: null,
    },
    wines,
    beers,
    spirits,
    cocktails,
    nonAlcoholic,
    itemCount: rows.length,
  };
}
