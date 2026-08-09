import { useWindowDimensions } from 'react-native';

// Central place for tablet/responsive decisions. Uses useWindowDimensions (not
// Dimensions.get) so values update on rotation and iPad split-view resizes.

export interface Responsive {
  width: number;
  height: number;
  /** True on iPad-class devices (shortest side ≥ 768pt). */
  isTablet: boolean;
  isLandscape: boolean;
  /** Column count for card grids: 2 on phones, up to 4 on large tablets. */
  gridColumns: number;
  /** Max content width for reading/form screens so they don't stretch edge-to-edge. */
  contentMaxWidth: number | undefined;
}

const TABLET_MIN = 768;

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= TABLET_MIN;
  const isLandscape = width > height;
  const gridColumns = width >= 1100 ? 4 : width >= 700 ? 3 : 2;
  const contentMaxWidth = isTablet ? 720 : undefined;
  return { width, height, isTablet, isLandscape, gridColumns, contentMaxWidth };
}
