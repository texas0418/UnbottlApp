// hooks/useSubscription.ts
// Add to your UnbottlApp project

import { useState, useEffect, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { supabase } from '../lib/supabase';
import { STRIPE_CONFIG } from '../config/stripe-config';

export interface Subscription {
  id: string;
  restaurant_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_type: 'free' | 'starter' | 'pro' | 'business';
  location_limit: number;
  addon_locations: number;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export interface SubscriptionLimits {
  beverageLimit: number;
  locationLimit: number;
  currentBeverages: number;
  currentLocations: number;
  canAddBeverage: boolean;
  canAddLocation: boolean;
  planType: string;
  isActive: boolean;
}

export function useSubscription(restaurantId: string | null) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [limits, setLimits] = useState<SubscriptionLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'active')
        .single();

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      // Get counts
      const [beverageCount, locationCount] = await Promise.all([
        supabase
          .from('beverages')
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', restaurantId),
        supabase
          .from('locations')
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', restaurantId)
          .eq('is_active', true),
      ]);

      const currentBeverages = beverageCount.count || 0;
      const currentLocations = locationCount.count || 0;

      // Determine limits based on plan
      const planType = subData?.plan_type || 'free';
      const plan = STRIPE_CONFIG.plans[planType as keyof typeof STRIPE_CONFIG.plans];
      
      let locationLimit = 1;
      if (subData) {
        locationLimit = subData.location_limit + (subData.addon_locations || 0);
      }

      const beverageLimit = plan?.beverageLimit || 50;

      setSubscription(subData || {
        id: '',
        restaurant_id: restaurantId,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        plan_type: 'free',
        location_limit: 1,
        addon_locations: 0,
        status: 'active',
        current_period_end: null,
        cancel_at_period_end: false,
      });

      setLimits({
        beverageLimit,
        locationLimit,
        currentBeverages,
        currentLocations,
        canAddBeverage: currentBeverages < beverageLimit,
        canAddLocation: currentLocations < locationLimit,
        planType,
        isActive: subData?.status === 'active' || planType === 'free',
      });

    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel('subscription_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, fetchSubscription]);

  const openCheckout = async (planKey: 'starter' | 'pro' | 'business', addonLocations = 0) => {
    if (!restaurantId) {
      Alert.alert('Error', 'No restaurant selected');
      return;
    }

    try {
      // Call your backend to create a Stripe Checkout session
      const response = await fetch('YOUR_BACKEND_URL/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          plan: planKey,
          addon_locations: addonLocations,
        }),
      });

      const { url, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Open Stripe Checkout in browser
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open checkout page');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      Alert.alert('Error', err.message || 'Failed to start checkout');
    }
  };

  const openCustomerPortal = async () => {
    if (!subscription?.stripe_customer_id) {
      Alert.alert('Error', 'No active subscription found');
      return;
    }

    try {
      const response = await fetch('YOUR_BACKEND_URL/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: subscription.stripe_customer_id,
        }),
      });

      const { url, error } = await response.json();

      if (error) throw new Error(error);

      await Linking.openURL(url);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to open billing portal');
    }
  };

  return {
    subscription,
    limits,
    loading,
    error,
    refetch: fetchSubscription,
    openCheckout,
    openCustomerPortal,
  };
}

// Hook to check before adding items
export function useCanAdd(restaurantId: string | null) {
  const { limits, loading } = useSubscription(restaurantId);

  const checkCanAddBeverage = useCallback(() => {
    if (loading || !limits) return true; // Allow during loading
    
    if (!limits.canAddBeverage) {
      Alert.alert(
        'Limit Reached',
        `You've reached your limit of ${limits.beverageLimit} beverages. Upgrade your plan to add more.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => {/* Navigate to upgrade screen */} },
        ]
      );
      return false;
    }
    return true;
  }, [limits, loading]);

  const checkCanAddLocation = useCallback(() => {
    if (loading || !limits) return true;
    
    if (!limits.canAddLocation) {
      Alert.alert(
        'Location Limit Reached',
        `You've reached your limit of ${limits.locationLimit} locations. Upgrade your plan to add more.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => {/* Navigate to upgrade screen */} },
        ]
      );
      return false;
    }
    return true;
  }, [limits, loading]);

  return {
    checkCanAddBeverage,
    checkCanAddLocation,
    limits,
    loading,
  };
}
