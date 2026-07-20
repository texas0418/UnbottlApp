import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';

export type AppMode = 'consumer' | 'business';

const APP_MODE_KEY = '@unbottl_app_mode';

/**
 * Controls which of the two experiences the app shows.
 *
 * Priority:
 *  1. If the signed-in user is a restaurant owner/staff, they are always in
 *     business mode (their account type wins).
 *  2. Otherwise, use the locally-chosen mode (from the Welcome screen or a
 *     manual "switch mode" action). This lets guests pick an experience
 *     without an account.
 *  3. If nothing has been chosen yet, `mode` is null → callers should send
 *     the user to the Welcome / role-selection screen.
 */
export function useAppMode() {
  const { isAuthenticated, userType, isLoading: authLoading } = useAuth();
  const [storedMode, setStoredMode] = useState<AppMode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load the locally-persisted choice once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const value = await AsyncStorage.getItem(APP_MODE_KEY);
        if (!cancelled) {
          setStoredMode(value === 'business' || value === 'consumer' ? value : null);
        }
      } catch (error) {
        console.error('Error reading app mode:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isRestaurantAccount =
    isAuthenticated && (userType === 'restaurant_owner' || userType === 'staff');

  // Resolution order (this drives the launch entry gate):
  //  1. A restaurant account ALWAYS starts on the business side on a fresh
  //     launch, regardless of any stored choice. In-session they can still
  //     switch to guest mode (that navigates directly and doesn't re-run the
  //     gate); the next cold start simply resets them to business.
  //  2. Otherwise an explicit local choice (Welcome pick or a manual "switch")
  //     wins, so guests and consumer accounts can move between experiences and
  //     have it persist.
  //  3. A signed-in consumer with no explicit choice → consumer.
  //  4. Guest with no choice yet → null → send to Welcome.
  const mode: AppMode | null = isRestaurantAccount
    ? 'business'
    : storedMode ?? (isAuthenticated ? 'consumer' : null);

  const setMode = useCallback(async (next: AppMode) => {
    try {
      await AsyncStorage.setItem(APP_MODE_KEY, next);
    } catch (error) {
      console.error('Error saving app mode:', error);
    }
    setStoredMode(next);
  }, []);

  const clearMode = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(APP_MODE_KEY);
    } catch (error) {
      console.error('Error clearing app mode:', error);
    }
    setStoredMode(null);
  }, []);

  return {
    mode,
    setMode,
    clearMode,
    // True when the signed-in account is a restaurant/staff account. Anyone can
    // switch experiences freely; this is exposed only for copy/context.
    isRestaurantAccount,
    isLoading: isLoading || authLoading,
  };
}
