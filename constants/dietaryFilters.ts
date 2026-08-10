import { Sprout, Leaf, DropletOff, WheatOff, Grape, Moon, LucideIcon } from 'lucide-react-native';
import { DietaryTag } from '@/types';

/**
 * The dietary filter row, shared by Discover and Catalog — the two screens had
 * an identical copy of this list each.
 *
 * These were emoji (🌱🍃🧪🌾🍇🌿), which is design review finding #9. Emoji
 * render in whatever the platform ships, sit outside the app's colour system,
 * and read at whatever weight the vendor chose. The test tube was the worst of
 * it: next to a wine, "🧪 Low Sulfite" looks like a chemistry warning about the
 * bottle rather than a thing a guest might want.
 *
 * The replacements say what the tag means rather than gesturing at its subject:
 * the two exclusions are the thing with a line through it, and biodynamic gets
 * a moon because biodynamic viticulture is farmed on a lunar calendar. Every
 * chip carries its text label, so the icon supports the word rather than
 * standing in for it.
 */
export interface DietaryFilter {
  label: string;
  value: DietaryTag;
  icon: LucideIcon;
}

export const dietaryFilters: DietaryFilter[] = [
  { label: 'Vegan', value: 'vegan', icon: Sprout },
  { label: 'Organic', value: 'organic', icon: Leaf },
  { label: 'Low Sulfite', value: 'low-sulfite', icon: DropletOff },
  { label: 'Gluten-Free', value: 'gluten-free', icon: WheatOff },
  { label: 'Natural', value: 'natural', icon: Grape },
  { label: 'Biodynamic', value: 'biodynamic', icon: Moon },
];
