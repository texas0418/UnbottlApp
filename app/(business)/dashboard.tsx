import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Plus,
  QrCode,
  FileSpreadsheet,
  ScanBarcode,
  Package,
  CheckCircle2,
  Building2,
  ChevronRight,
  Star,
  BarChart3,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useWines } from '@/contexts/WineContext';
import { useBeverages } from '@/contexts/BeverageContext';
import BusinessAuthPrompt from '@/components/BusinessAuthPrompt';

export default function DashboardScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { restaurant, needsSetup } = useRestaurant();
  const { wines } = useWines();
  const { beers, spirits, cocktails, nonAlcoholic } = useBeverages();

  const go = (route: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as any);
  };

  if (!isAuthenticated) {
    return <BusinessAuthPrompt />;
  }

  const allItems = [...wines, ...beers, ...spirits, ...cocktails, ...nonAlcoholic];
  const totalItems = allItems.length;
  const inStock = allItems.filter((i: any) => i.inStock ?? i.in_stock ?? true).length;
  const categoriesUsed = [wines, beers, spirits, cocktails, nonAlcoholic].filter(
    (list) => list.length > 0
  ).length;

  const quickActions = [
    { icon: Plus, label: 'Add Beverage', route: '/beverage/add', color: Colors.primary },
    { icon: QrCode, label: 'QR Menu', route: '/qr-menu', color: Colors.secondary },
    { icon: FileSpreadsheet, label: 'Import CSV', route: '/csv-import', color: '#10B981' },
    { icon: ScanBarcode, label: 'Scan Labels', route: '/wine-scanner', color: '#8B5CF6' },
  ];

  const manageItems = [
    { icon: Building2, label: 'Restaurant Details', desc: 'Name, hours, location', route: '/restaurant-setup' },
    { icon: BarChart3, label: 'Full Analytics', desc: 'Views, popular items, trends', route: '/analytics' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.restaurantName}>
            {restaurant?.name || user?.name || 'Your Restaurant'}
          </Text>
        </View>

        {/* Setup banner */}
        {needsSetup && (
          <TouchableOpacity style={styles.setupBanner} onPress={() => go('/restaurant-setup')}>
            <Building2 size={24} color={Colors.primary} />
            <View style={styles.setupBannerContent}>
              <Text style={styles.setupBannerTitle}>Finish setting up your restaurant</Text>
              <Text style={styles.setupBannerDesc}>
                Add your details so you can publish a QR menu
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {/* Founding member badge */}
        {restaurant?.is_founding_member && restaurant?.founding_member_expires_at && (
          <View style={styles.founderBadge}>
            <View style={styles.founderIcon}>
              <Star size={20} color="#F59E0B" fill="#F59E0B" />
            </View>
            <View style={styles.founderContent}>
              <Text style={styles.founderTitle}>
                Founding Member #{restaurant.founding_member_number}
              </Text>
              <Text style={styles.founderDesc}>
                Pro features free until{' '}
                {new Date(restaurant.founding_member_expires_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Package size={20} color={Colors.primary} />
            <Text style={styles.statValue}>{totalItems}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.statCard}>
            <CheckCircle2 size={20} color={Colors.success} />
            <Text style={styles.statValue}>{inStock}</Text>
            <Text style={styles.statLabel}>In stock</Text>
          </View>
          <View style={styles.statCard}>
            <BarChart3 size={20} color={Colors.secondary} />
            <Text style={styles.statValue}>{categoriesUsed}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              onPress={() => go(action.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                <action.icon size={24} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Manage */}
        <Text style={styles.sectionTitle}>Manage</Text>
        <View style={styles.manageCard}>
          {manageItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.manageItem} onPress={() => go(item.route)}>
                <View style={styles.manageIcon}>
                  <item.icon size={18} color={Colors.primary} />
                </View>
                <View style={styles.manageContent}>
                  <Text style={styles.manageLabel}>{item.label}</Text>
                  <Text style={styles.manageDesc}>{item.desc}</Text>
                </View>
                <ChevronRight size={18} color={Colors.textMuted} />
              </TouchableOpacity>
              {index < manageItems.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },
  header: { marginBottom: 20 },
  greeting: { fontSize: 14, color: Colors.textSecondary, marginBottom: 2 },
  restaurantName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  setupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '12',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
    gap: 12,
  },
  setupBannerContent: { flex: 1 },
  setupBannerTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.primary },
  setupBannerDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  founderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F59E0B40',
    gap: 12,
  },
  founderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  founderContent: { flex: 1 },
  founderTitle: { fontSize: 16, fontWeight: '600' as const, color: '#B45309' },
  founderDesc: { fontSize: 13, color: '#92400E', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  manageCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  manageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  manageIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageContent: { flex: 1 },
  manageLabel: { fontSize: 15, fontWeight: '500' as const, color: Colors.text },
  manageDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 1 },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginLeft: 64 },
});
