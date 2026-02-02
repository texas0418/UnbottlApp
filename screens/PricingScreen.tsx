// screens/PricingScreen.tsx
// Add to your UnbottlApp project

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../hooks/useSubscription';
import { STRIPE_CONFIG } from '../config/stripe-config';

interface PricingScreenProps {
  restaurantId: string;
  onClose?: () => void;
}

export default function PricingScreen({ restaurantId, onClose }: PricingScreenProps) {
  const { subscription, limits, loading, openCheckout } = useSubscription(restaurantId);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [addonLocations, setAddonLocations] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const currentPlan = subscription?.plan_type || 'free';

  const handleUpgrade = async (planKey: 'starter' | 'pro' | 'business') => {
    setCheckoutLoading(true);
    try {
      await openCheckout(planKey, planKey === 'business' ? addonLocations : 0);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#722F37" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Choose Your Plan</Text>
        <Text style={styles.subtitle}>
          Unlock unlimited beverages and locations
        </Text>
      </View>

      {/* Current Usage */}
      {limits && (
        <View style={styles.usageCard}>
          <Text style={styles.usageTitle}>Current Usage</Text>
          <View style={styles.usageRow}>
            <Text style={styles.usageLabel}>Beverages:</Text>
            <Text style={styles.usageValue}>
              {limits.currentBeverages} / {limits.beverageLimit === Infinity ? '∞' : limits.beverageLimit}
            </Text>
          </View>
          <View style={styles.usageRow}>
            <Text style={styles.usageLabel}>Locations:</Text>
            <Text style={styles.usageValue}>
              {limits.currentLocations} / {limits.locationLimit}
            </Text>
          </View>
        </View>
      )}

      {/* Plans */}
      {Object.entries(STRIPE_CONFIG.plans).map(([key, plan]) => {
        const isCurrentPlan = currentPlan === key;
        const isSelected = selectedPlan === key;
        const isPaid = 'priceId' in plan;

        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.planCard,
              isCurrentPlan && styles.currentPlanCard,
              isSelected && styles.selectedPlanCard,
            ]}
            onPress={() => isPaid && setSelectedPlan(key)}
            disabled={!isPaid || isCurrentPlan}
          >
            {/* Plan Header */}
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              {isCurrentPlan && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Current</Text>
                </View>
              )}
            </View>

            {/* Price */}
            <View style={styles.priceRow}>
              <Text style={styles.price}>
                ${plan.price}
              </Text>
              {plan.price > 0 && <Text style={styles.priceInterval}>/month</Text>}
            </View>

            {/* Features */}
            <View style={styles.features}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Addon Locations (Business only) */}
            {key === 'business' && isSelected && (
              <View style={styles.addonSection}>
                <Text style={styles.addonTitle}>Additional Locations</Text>
                <View style={styles.addonControls}>
                  <TouchableOpacity
                    style={styles.addonButton}
                    onPress={() => setAddonLocations(Math.max(0, addonLocations - 1))}
                  >
                    <Ionicons name="remove" size={20} color="#722F37" />
                  </TouchableOpacity>
                  <Text style={styles.addonCount}>{addonLocations}</Text>
                  <TouchableOpacity
                    style={styles.addonButton}
                    onPress={() => setAddonLocations(addonLocations + 1)}
                  >
                    <Ionicons name="add" size={20} color="#722F37" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.addonPrice}>
                  +${(addonLocations * 9.99).toFixed(2)}/month
                </Text>
              </View>
            )}

            {/* Upgrade Button */}
            {isPaid && !isCurrentPlan && (
              <TouchableOpacity
                style={[styles.upgradeButton, isSelected && styles.upgradeButtonActive]}
                onPress={() => handleUpgrade(key as 'starter' | 'pro' | 'business')}
                disabled={checkoutLoading}
              >
                {checkoutLoading && isSelected ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.upgradeButtonText}>
                    {isSelected ? 'Upgrade Now' : 'Select'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        );
      })}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          All plans include a 14-day free trial. Cancel anytime.
        </Text>
        <Text style={styles.footerText}>
          Questions? Contact support@unbottl.com
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  usageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  usageLabel: {
    fontSize: 14,
    color: '#666',
  },
  usageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentPlanCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
  },
  selectedPlanCard: {
    borderColor: '#722F37',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  currentBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#722F37',
  },
  priceInterval: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  features: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  addonSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  addonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  addonControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addonButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#722F37',
  },
  addonCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 24,
  },
  addonPrice: {
    fontSize: 14,
    color: '#722F37',
    textAlign: 'center',
    fontWeight: '600',
  },
  upgradeButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeButtonActive: {
    backgroundColor: '#722F37',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
});
