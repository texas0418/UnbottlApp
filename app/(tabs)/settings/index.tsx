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
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
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
  MessageSquarePlus,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useAppMode } from '@/hooks/useAppMode';
import { useRouter } from 'expo-router';

const PRIVACY_POLICY_URL = 'https://unbottl.com/privacy-policy.html';
const TERMS_OF_SERVICE_URL = 'https://unbottl.com/terms-of-service.html';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout, userType, deleteAccount } = useAuth();
  const { wishlistCount } = useWishlist();
  const { unreadCount } = useNotifications();
  const { setMode } = useAppMode();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleSwitchToRestaurant = () => {
    Alert.alert(
      'Switch to Restaurant Mode',
      'Manage a beverage program? Switch to the restaurant dashboard to manage inventory, QR menus, and analytics.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            await setMode('business');
            router.replace('/(business)/dashboard');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    const accountType = userType === 'restaurant_owner' ? 'restaurant owner' : 'consumer';
    const extraWarning = userType === 'restaurant_owner'
      ? '\n\nThis will also permanently delete your restaurant, all beverage inventory, menus, staff accounts, and analytics data.'
      : '';

    Alert.alert(
      'Delete Account',
      `Are you sure you want to permanently delete your ${accountType} account? This action cannot be undone.${extraWarning}\n\nAll your data including favorites, tastings, and preferences will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This is irreversible. Type is not required but please confirm you understand all your data will be permanently deleted.',
              [
                { text: 'Go Back', style: 'cancel' },
                {
                  text: 'Permanently Delete',
                  style: 'destructive',
                  onPress: async () => {
                    setIsDeletingAccount(true);
                    try {
                      const { error } = await deleteAccount();
                      if (error) {
                        Alert.alert(
                          'Error',
                          'We couldn\'t delete your account right now. Please try again or contact support@unbottl.com for assistance.'
                        );
                      } else {
                        Alert.alert(
                          'Account Deleted',
                          'Your account and all associated data have been permanently deleted.',
                          [{ text: 'OK', onPress: () => router.replace('/') }]
                        );
                      }
                    } catch (err) {
                      Alert.alert(
                        'Error',
                        'Something went wrong. Please contact support@unbottl.com for help.'
                      );
                    } finally {
                      setIsDeletingAccount(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleOpenURL = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open this link.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong opening this link.');
    }
  };

  const preferencesItems = [
    {
      icon: Bell,
      label: 'Notifications',
      description: unreadCount > 0 ? `${unreadCount} unread` : 'Push notifications',
      chevron: true,
      route: '/notifications',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
  ];

  const accountItems = [
    { icon: User, label: 'Profile', description: 'Edit your profile', chevron: true, route: '/login' },
    {
      icon: Heart,
      label: 'Favorites',
      description: 'Your saved drinks',
      chevron: true,
      route: '/(tabs)/journal',
    },
    {
      icon: Bookmark,
      label: 'Wishlist',
      description: `${wishlistCount} items to try`,
      chevron: true,
      route: '/wishlist',
      badge: wishlistCount > 0 ? wishlistCount : undefined,
    },
  ];

  const supportItems = [
    {
      icon: MessageSquarePlus,
      label: 'Send Feedback',
      description: 'Report bugs or request features',
      chevron: true,
      onPress: () => router.push('/feedback' as any),
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      description: 'Get help',
      chevron: true,
      onPress: () => Alert.alert('Help & Support', 'Need help? Email us at support@unbottl.com'),
    },
    {
      icon: FileText,
      label: 'Terms of Service',
      description: 'Legal information',
      chevron: true,
      onPress: () => handleOpenURL(TERMS_OF_SERVICE_URL),
    },
    {
      icon: Shield,
      label: 'Privacy Policy',
      description: 'Your data & privacy',
      chevron: true,
      onPress: () => handleOpenURL(PRIVACY_POLICY_URL),
    },
  ];

  // ────────────────────────────────────────────────
  // Guest view: sign-in card + support section only
  // ────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.guestCardContainer}>
          <View style={styles.guestCard}>
            <View style={styles.guestLogoContainer}>
              <Wine size={48} color={Colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.guestTitle}>Welcome to Unbottl</Text>
            <Text style={styles.guestSubtitle}>
              Sign in to save favorites, track your tastings, and get personalized recommendations.
            </Text>
            <TouchableOpacity
              style={styles.guestSignInButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.guestSignInText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.guestCreateButton}
              onPress={() => router.push('/login?mode=signup')}
            >
              <Text style={styles.guestCreateText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.switchModeCard} onPress={handleSwitchToRestaurant}>
            <View style={styles.switchModeIcon}>
              <Building2 size={22} color={Colors.primary} />
            </View>
            <View style={styles.switchModeContent}>
              <Text style={styles.switchModeTitle}>Switch to Restaurant</Text>
              <Text style={styles.switchModeDesc}>
                Manage inventory, QR menus & analytics
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuCard}>
            {supportItems.map((item, index) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
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

        <Text style={styles.version}>Unbottl v1.0.0</Text>
        <View style={styles.bottomPadding} />
      </ScrollView>
    );
  }

  // ────────────────────────────────────────────────
  // Authenticated view: full settings
  // ────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity
        style={styles.profileSection}
        onPress={() => !user && router.push('/login')}
      >
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
                onPress={() =>
                  (item as any).onPress
                    ? (item as any).onPress()
                    : (item as any).route && router.push((item as any).route)
                }
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
                onPress={() =>
                  (item as any).onPress
                    ? (item as any).onPress()
                    : (item as any).route && router.push((item as any).route)
                }
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

      <View style={styles.section}>
        <TouchableOpacity style={styles.switchModeCard} onPress={handleSwitchToRestaurant}>
          <View style={styles.switchModeIcon}>
            <Building2 size={22} color={Colors.primary} />
          </View>
          <View style={styles.switchModeContent}>
            <Text style={styles.switchModeTitle}>Switch to Restaurant</Text>
            <Text style={styles.switchModeDesc}>
              Manage inventory, QR menus & analytics
            </Text>
          </View>
          <ChevronRight size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.menuCard}>
          {supportItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
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

      {/* Sign Out & Delete Account */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={18} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={handleDeleteAccount}
          disabled={isDeletingAccount}
        >
          {isDeletingAccount ? (
            <ActivityIndicator size="small" color={Colors.error} />
          ) : (
            <>
              <Trash2 size={16} color={Colors.textMuted} />
              <Text style={styles.deleteAccountText}>Delete Account</Text>
            </>
          )}
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
  guestCardContainer: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 12,
  },
  guestCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  guestLogoContainer: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  guestSignInButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  guestSignInText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '600' as const,
  },
  guestCreateButton: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  guestCreateText: {
    color: Colors.primary,
    fontSize: 17,
    fontWeight: '600' as const,
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
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    marginTop: 12,
  },
  deleteAccountText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 20,
  },
  switchModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  switchModeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchModeContent: { flex: 1 },
  switchModeTitle: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
  switchModeDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
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
