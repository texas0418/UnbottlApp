import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';

/**
 * Uploads for the pictures a venue puts on its own menu.
 *
 * Paths are `<restaurant_id>/...`, which is not cosmetic: the storage policies
 * in db/venue-media-bucket.sql read the first path segment and refuse a write
 * anywhere outside the caller's own venue. Build a path any other way and the
 * upload is denied.
 */

const BUCKET = 'venue-media';

/** Widest edge, in pixels, after resizing. */
const MAX_EDGE = {
  /** Shown small, in a header. */
  logo: 512,
  /** Full-bleed behind a menu heading. */
  cover: 1600,
  /** A card in a grid, at most half an iPad wide. */
  beverage: 1200,
} as const;

export type MediaKind = keyof typeof MAX_EDGE;

export interface UploadResult {
  /** Public URL to store on the row. */
  url: string;
  /** Path inside the bucket, for a later delete. */
  path: string;
}

/**
 * Resize and re-encode before upload.
 *
 * A modern phone photo is 3–6MB and 4000px wide. Sending that raw would blow
 * the bucket's 5MB limit on the larger ones, cost a venue's data allowance on
 * a hotel wifi, and then be scaled to a 400px card anyway. HEIC becomes JPEG
 * here too, since not every surface that renders these handles HEIC.
 */
async function prepare(uri: string, kind: MediaKind): Promise<{ blob: Blob; ext: string }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_EDGE[kind] } }],
    { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG },
  );
  const response = await fetch(result.uri);
  return { blob: await response.blob(), ext: 'jpg' };
}

async function upload(restaurantId: string, path: string, uri: string, kind: MediaKind) {
  const { blob, ext } = await prepare(uri, kind);
  const fullPath = `${restaurantId}/${path}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(fullPath, blob, {
    contentType: 'image/jpeg',
    // Replace rather than accumulate: a venue changing its logo four times
    // should leave one object behind, not four.
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fullPath);
  // The public URL is stable across replacements, so a cached copy would go
  // stale on the guest's device. The timestamp busts it without changing the
  // stored object.
  return { url: `${data.publicUrl}?v=${Date.now()}`, path: fullPath };
}

export function uploadVenueLogo(restaurantId: string, uri: string): Promise<UploadResult> {
  return upload(restaurantId, 'logo', uri, 'logo');
}

export function uploadVenueCover(restaurantId: string, uri: string): Promise<UploadResult> {
  return upload(restaurantId, 'cover', uri, 'cover');
}

/**
 * @param beverageId a saved beverage's id. New drinks have to be saved first —
 *   there is no id to key the path on before that.
 */
export function uploadBeveragePhoto(
  restaurantId: string,
  beverageId: string,
  uri: string,
): Promise<UploadResult> {
  return upload(restaurantId, `beverages/${beverageId}`, uri, 'beverage');
}

/** Best-effort tidy-up. A failure here must not fail the caller's save. */
export async function removeVenueMedia(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}
