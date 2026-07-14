import React from 'react';
import { Redirect } from 'expo-router';

/**
 * The "Scan" tab is presented as an elevated center button in the tab bar
 * (see app/(tabs)/_layout.tsx) that opens the menu scanner directly. This
 * screen is never shown in normal use; if the route is reached directly we
 * simply fall back to Discover.
 */
export default function MenuTabFallback() {
  return <Redirect href="/(tabs)/(home)" />;
}
