import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';

const AGE_VERIFIED_KEY = '@unbottl_age_verified';

export function useAgeVerification() {
  const { isAuthenticated, isAgeVerified: authAgeVerified } = useAuth();
  const [localAgeVerified, setLocalAgeVerified] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check AsyncStorage for guest verification
  useEffect(() => {
    const checkStorage = async () => {
      try {
        const stored = await AsyncStorage.getItem(AGE_VERIFIED_KEY);
        setLocalAgeVerified(stored === 'true');
      } catch (error) {
        console.error('Error reading age verification:', error);
        setLocalAgeVerified(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkStorage();
  }, []);

  // Age is verified if:
  // - Authenticated user has verified via their profile (authAgeVerified), OR
  // - Local AsyncStorage says verified (works for guests and as a fallback)
  const isAgeVerified = authAgeVerified || localAgeVerified === true;

  const confirmAge = useCallback(async () => {
    try {
      await AsyncStorage.setItem(AGE_VERIFIED_KEY, 'true');
      setLocalAgeVerified(true);
    } catch (error) {
      console.error('Error storing age verification:', error);
    }
  }, []);

  const denyAge = useCallback(() => {
    // Don't store anything — they can try again next session
    setLocalAgeVerified(false);
  }, []);

  return {
    isAgeVerified,
    isLoading,
    confirmAge,
    denyAge,
  };
}
