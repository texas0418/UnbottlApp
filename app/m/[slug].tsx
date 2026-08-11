import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * The address a QR code actually points at: `/m/<slug>`.
 *
 * The menu itself lives at `/customer-menu?r=<slug>`, which is fine as an
 * in-app route and wrong as something printed on a table tent. This is the
 * short, public-looking URL, and it exists on both platforms — so scanning
 * with the app installed opens the app, and scanning without it opens the web
 * build, from the same link.
 *
 * A redirect rather than a copy of the screen: one menu implementation, and no
 * risk of the two drifting apart.
 */
export default function MenuBySlug() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  if (!slug) return <Redirect href="/" />;
  return <Redirect href={{ pathname: '/customer-menu', params: { r: slug } }} />;
}
