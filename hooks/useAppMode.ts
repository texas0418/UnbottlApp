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

  // A restaurant account always resolves to business mode.
  const accountForcesBusiness =
    isAuthenticated && (userType === 'restaurant_owner' || userType === 'staff');

  // Resolution order:
  //  1. Restaurant account → business (their account type wins).
  //  2. An explicit local choice (Welcome pick or "switch mode") → that choice.
  //  3. Any other signed-in user → consumer (never show them the role picker).
  //  4. Guest with no choice yet → null → send to Welcome.
  const mode: AppMode | null = accountForcesBusiness
    ? 'business'
    : storedMode
    ? storedMode
    : isAuthenticated
    ? 'consumer'
    : null;

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
    // Consumers can freely switch modes; a restaurant account is locked to business.
    isModeLocked: accountForcesBusiness,
    isLoading: isLoading || authLoading,
  };
}
