import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import {
Image } from 'expo-image';
import {
  Users,
  Building2,
  User,
  Bell,
  Shield,
  HelpCircle,
  FileText,
  ChevronRight,
  LogOut,
  Moon,
  Globe,
  Heart,
  Wine,
  BarChart3,
  Plus,
  QrCode,
  FileSpreadsheet,
  ScanBarcode,
  Package,
  Settings,
  Bookmark,
  Star,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import {
useRestaurant } from '@/contexts/RestaurantContext';
import {
useAuth } from '@/contexts/AuthContext';
import {
useWishlist } from '@/contexts/WishlistContext';
import {
useNotifications } from '@/contexts/NotificationsContext';
import {
useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const { restaurant, needsSetup } = useRestaurant();
  const { user, logout, userType } = useAuth();
  const { wishlistCount } = useWishlist();
  const { preferences, unreadCount, updatePreferences } = useNotifications();
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => logout()
        },
      ]
    );
  };

  const handleManagementOption = (route: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as any);
  };

  const preferencesItems = [
    { 
      icon: Moon, 
      label: 'Dark Mode', 
      description: 'Switch to dark theme',
      toggle: true,
      value: darkMode,
      onToggle: setDarkMode,
    },
    { 
      icon: Bell, 
      label: 'Notifications', 
      description: unreadCount > 0 ? `${unreadCount} unread` : 'Push notifications',
      chevron: true,
      route: '/notifications',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { 
      icon: Globe, 
      label: 'Language', 
      description: 'English',
      chevron: true,
    },
  ];

  const accountItems = [
    { icon: User, label: 'Profile', description: 'Edit your profile', chevron: true, route: '/login' },
    { icon: Heart, label: 'Favorites', description: 'Your saved items', chevron: true },
    { 
      icon: Bookmark, 
      label: 'Wishlist', 
      description: `${wishlistCount} items to try`, 
      chevron: true,
      route: '/wishlist',
      badge: wishlistCount > 0 ? wishlistCount : undefined,
    },
    { icon: Star, label: 'Taste Preferences', description: 'Update your preferences', chevron: true },
  ];

  const managementItems = [
    { 
      icon: Plus, 
      label: 'Add Beverage', 
      description: 'Add wines, beers, cocktails', 
      route: '/beverage/add',
      color: Colors.primary,
    },
    { 
      icon: Package, 
      label: 'Inventory', 
      description: 'Manage stock & availability', 
      route: '/(tabs)/catalog',
      color: '#3B82F6',
    },
    { 
      icon: QrCode, 
      label: 'QR Menu', 
      description: 'Generate customer QR codes', 
      route: '/qr-menu',
      color: Colors.secondary,
    },
    { 
      icon: FileSpreadsheet, 
      label: 'Import CSV', 
      description: 'Bulk import from spreadsheet', 
      route: '/csv-import',
      color: '#10B981',
    },
    { 
      icon: ScanBarcode, 
      label: 'Scan Labels', 
      description: 'Scan wine/beer labels to add', 
      route: '/wine-scanner',
      color: '#8B5CF6',
    },
    { 
      icon: BarChart3, 
      label: 'Analytics', 
      description: 'View menu performance', 
      route: '/qr-menu',
      color: '#F59E0B',
    },
    { 
      icon: Building2, 
      label: 'Restaurant Details', 
      description: 'Update restaurant info', 
      route: '/qr-menu',
      color: '#EC4899',
    },
    { 
      icon: Zap, 
      label: 'Subscription', 
      description: 'Manage your plan', 
      route: '/pricing', 
      color: '#F59E0B', 
    },
    { 
      icon: Users, 
      label: 'Team', 
      description: 'Manage staff access', 
      route: '/staff-management', 
      color: '#06B6D4', 
    },
  ];

  const supportItems = [
    { icon: HelpCircle, label: 'Help & Support', description: 'Get help', chevron: true },
    { icon: FileText, label: 'Terms of Service', description: 'Legal information', chevron: true },
    { icon: Shield, label: 'Privacy Policy', description: 'Your data & privacy', chevron: true },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.profileSection} onPress={() => !user && router.push('/login')}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            <User size={32} color={Colors.primary} />
          </View>
        </View>
        <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'Sign in to sync your data'}</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.menuCard}>
          {preferencesItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => (item as any).route && router.push((item as any).route)}
                disabled={!!(item as any).toggle}
              >
                <View style={[styles.menuIcon, { backgroundColor: Colors.primary + '12' }]}>
                  <item.icon size={18} color={Colors.primary} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuDescription}>{item.description}</Text>
                </View>
                {(item as any).badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{(item as any).badge}</Text>
                  </View>
                )}
                {(item as any).toggle && (item as any).onToggle ? (
                  <Switch
                    value={(item as any).value}
                    onValueChange={(item as any).onToggle}
                    trackColor={{ false: Colors.border, true: Colors.primary + '60' }}
                    thumbColor={(item as any).value ? Colors.primary : Colors.surface}
                  />
                ) : (item as any).chevron ? (
                  <ChevronRight size={18} color={Colors.textMuted} />
                ) : null}
              </TouchableOpacity>
              {index < preferencesItems.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuCard}>
          {accountItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => (item as any).route && router.push((item as any).route)}
              >
                <View style={[styles.menuIcon, { backgroundColor: Colors.secondary + '15' }]}>
                  <item.icon size={18} color={Colors.secondary} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuDescription}>{item.description}</Text>
                </View>
                {(item as any).badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{(item as any).badge}</Text>
                  </View>
                )}
                {item.chevron && <ChevronRight size={18} color={Colors.textMuted} />}
              </TouchableOpacity>
              {index < accountItems.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {userType === 'restaurant_owner' && (<View style={styles.section}>
        {needsSetup && (
          <TouchableOpacity style={styles.setupBanner} onPress={() => router.push('/restaurant-setup')}>
            <Building2 size={24} color={Colors.primary} />
            <View style={styles.setupBannerContent}>
              <Text style={styles.setupBannerTitle}>Set Up Your Restaurant</Text>
              <Text style={styles.setupBannerDesc}>Create your restaurant to start managing inventory</Text>
            </View>
            <ChevronRight size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}
        {restaurant?.is_founding_member && restaurant?.founding_member_expires_at && (
          <View style={styles.founderBadge}>
            <View style={styles.founderBadgeIcon}>
              <Star size={20} color="#F59E0B" fill="#F59E0B" />
            </View>
            <View style={styles.founderBadgeContent}>
              <Text style={styles.founderBadgeTitle}>Founding Member #{restaurant.founding_member_number}</Text>
              <Text style={styles.founderBadgeDesc}>
                Pro features free until {new Date(restaurant.founding_member_expires_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
        <View style={styles.managementHeader}>
          <View style={styles.managementTitleRow}>
            <Settings size={16} color={Colors.textMuted} />
            <Text style={styles.sectionTitle}>Restaurant Management</Text>
          </View>
          <Text style={styles.managementSubtitle}>For owners & managers only</Text>
        </View>
        <View style={styles.managementGrid}>
          {managementItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.managementCard}
              onPress={() => handleManagementOption(item.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.managementIcon, { backgroundColor: item.color + '15' }]}>
                <item.icon size={22} color={item.color} />
              </View>
              <Text style={styles.managementLabel}>{item.label}</Text>
              <Text style={styles.managementDesc} numberOfLines={1}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>)}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.menuCard}>
          {supportItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.menuItem}>
                <View style={[styles.menuIcon, { backgroundColor: Colors.textMuted + '15' }]}>
                  <item.icon size={18} color={Colors.textMuted} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuDescription}>{item.description}</Text>
                </View>
                {item.chevron && <ChevronRight size={18} color={Colors.textMuted} />}
              </TouchableOpacity>
              {index < supportItems.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={18} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Unbottl v1.0.0</Text>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  menuDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 64,
  },
  managementHeader: {
    marginBottom: 12,
  },
  managementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  managementSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    marginLeft: 22,
  },
  managementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  managementCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  managementIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  managementLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  managementDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error + '10',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 20,
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
  },
  setupBannerContent: {
    flex: 1,
    marginLeft: 12,
  },
  setupBannerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  setupBannerDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  founderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F59E0B' + '40',
  },
  founderBadgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  founderBadgeContent: {
    flex: 1,
    marginLeft: 12,
  },
  founderBadgeTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#B45309',
  },
  founderBadgeDesc: {
    fontSize: 13,
    color: '#92400E',
    marginTop: 2,
  },
  bottomPadding: {
    height: 30,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
