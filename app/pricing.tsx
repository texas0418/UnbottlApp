import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  X,
  Check,
  Star,
  Building2,
  MapPin,
  Wine,
  Users,
  BarChart3,
  Zap,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 19.99,
    priceId: 'price_1SwFoa05hN1XfEY0xq4lxyjN',
    description: 'Perfect for small bars & cafes',
    color: '#3B82F6',
    features: [
      { icon: MapPin, text: '1 location' },
      { icon: Wine, text: 'Unlimited beverages' },
      { icon: Users, text: 'Up to 3 team members' },
      { icon: BarChart3, text: 'Basic analytics' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 39.99,
    priceId: 'price_1SwFqA05hN1XfEY0n0o6EEvt',
    description: 'For growing restaurants',
    color: Colors.primary,
    popular: true,
    features: [
      { icon: MapPin, text: 'Up to 5 locations' },
      { icon: Wine, text: 'Unlimited beverages' },
      { icon: Users, text: 'Unlimited team members' },
      { icon: BarChart3, text: 'Advanced analytics' },
      { icon: Zap, text: 'Priority support' },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 69.99,
    priceId: 'price_1SwFqc05hN1XfEY0M0qMlRje',
    description: 'For restaurant groups',
    color: '#8B5CF6',
    features: [
      { icon: MapPin, text: '10 locations (+$9.99/extra)' },
      { icon: Wine, text: 'Unlimited beverages' },
      { icon: Users, text: 'Unlimited team members' },
      { icon: BarChart3, text: 'Enterprise analytics' },
      { icon: Zap, text: 'Dedicated support' },
      { icon: Building2, text: 'Multi-brand support' },
    ],
  },
];

export default function PricingScreen() {
  const router = useRouter();
  const { restaurant } = useRestaurant();
  const [loading, setLoading] = useState<string | null>(null);

  const isFoundingMember = restaurant?.is_founding_member &&
    restaurant?.founding_member_expires_at &&
    new Date(restaurant.founding_member_expires_at) > new Date();

  const daysRemaining = restaurant?.founding_member_expires_at
    ? Math.ceil((new Date(restaurant.founding_member_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleSelectPlan = async (plan: typeof PLANS[0]) => {
    if (!restaurant) {
      Alert.alert('Error', 'Please set up your restaurant first');
      return;
    }

    setLoading(plan.id);

    try {
      console.log("Calling checkout with:", JSON.stringify({
        restaurant_id: restaurant.id,
        plan: plan.id,
        restaurant_name: restaurant.name
      }));

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          restaurant_id: restaurant.id,
          plan: plan.id,
          addon_locations: 0,
        },
      });

      if (error) {
        console.log("Function error:", error);
        console.log("Function error context:", JSON.stringify(error.context));
        throw error;
      }

      if (data?.url) {
        await Linking.openURL(data.url);
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      const errorMsg = err?.context?.body
        ? JSON.parse(err.context.body)?.error
        : err.message;
      Alert.alert('Error', errorMsg || 'Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  return (
    <AuthGuard requiredUserType="restaurant_owner">
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Choose Your Plan</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {isFoundingMember && (
            <View style={styles.founderBanner}>
              <Star size={20} color="#F59E0B" fill="#F59E0B" />
              <View style={styles.founderBannerContent}>
                <Text style={styles.founderBannerTitle}>
                  Founding Member #{restaurant?.founding_member_number}
                </Text>
                <Text style={styles.founderBannerDesc}>
                  You have Pro features free for {daysRemaining} more days
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.subtitle}>
            {isFoundingMember
              ? 'Lock in your rate before your founding period ends'
              : 'Select a plan to unlock all features'}
          </Text>

          {PLANS.map((plan) => (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                plan.popular && styles.planCardPopular,
                { borderColor: plan.color + '40' },
              ]}
            >
              {plan.popular && (
                <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                  <Text style={styles.popularBadgeText}>Most Popular</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                <Text style={styles.planDescription}>{plan.description}</Text>
              </View>

              <View style={styles.priceContainer}>
                <Text style={styles.priceSymbol}>$</Text>
                <Text style={styles.priceAmount}>{plan.price.toFixed(0)}</Text>
                <Text style={styles.pricePeriod}>/month</Text>
              </View>

              <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <View style={[styles.featureIcon, { backgroundColor: plan.color + '15' }]}>
                      <feature.icon size={14} color={plan.color} />
                    </View>
                    <Text style={styles.featureText}>{feature.text}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.selectButton,
                  { backgroundColor: plan.popular ? plan.color : 'transparent' },
                  { borderColor: plan.color },
                ]}
                onPress={() => handleSelectPlan(plan)}
                disabled={loading !== null}
              >
                {loading === plan.id ? (
                  <ActivityIndicator color={plan.popular ? '#fff' : plan.color} />
                ) : (
                  <Text style={[
                    styles.selectButtonText,
                    { color: plan.popular ? '#fff' : plan.color },
                  ]}>
                    {isFoundingMember ? 'Subscribe Now' : 'Get Started'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.guaranteeContainer}>
            <Check size={20} color={Colors.success} />
            <Text style={styles.guaranteeText}>
              14-day free trial • Cancel anytime • No hidden fees
            </Text>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  closeButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: '600', color: Colors.text },
  placeholder: { width: 32 },
  content: { flex: 1 },
  scrollContent: { padding: 20 },
  founderBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', borderRadius: 12, padding: 16, marginBottom: 16 },
  founderBannerContent: { marginLeft: 12, flex: 1 },
  founderBannerTitle: { fontSize: 15, fontWeight: '600', color: '#B45309' },
  founderBannerDesc: { fontSize: 13, color: '#92400E', marginTop: 2 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  planCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 2, shadowColor: Colors.cardShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 4 },
  planCardPopular: { transform: [{ scale: 1.02 }] },
  popularBadge: { position: 'absolute', top: -12, right: 20, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  popularBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  planHeader: { marginBottom: 16 },
  planName: { fontSize: 24, fontWeight: '700' },
  planDescription: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  priceContainer: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 20 },
  priceSymbol: { fontSize: 20, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  priceAmount: { fontSize: 48, fontWeight: '700', color: Colors.text, lineHeight: 52 },
  pricePeriod: { fontSize: 16, color: Colors.textSecondary, marginBottom: 10, marginLeft: 4 },
  featuresContainer: { marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureIcon: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  featureText: { fontSize: 15, color: Colors.text },
  selectButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 2 },
  selectButtonText: { fontSize: 16, fontWeight: '600' },
  guaranteeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: 8 },
  guaranteeText: { fontSize: 13, color: Colors.textSecondary },
  bottomPadding: { height: 40 },
});
