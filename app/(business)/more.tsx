import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Building2,
  Users,
  Zap,
  QrCode,
  FileSpreadsheet,
  MessageSquarePlus,
  HelpCircle,
  FileText,
  Shield,
  ChevronRight,
  LogOut,
  Compass,
  Trash2,
  User,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useAppMode } from '@/hooks/useAppMode';
import BusinessAuthPrompt from '@/components/BusinessAuthPrompt';

const PRIVACY_POLICY_URL = 'https://unbottl.com/privacy-policy.html';
const TERMS_OF_SERVICE_URL = 'https://unbottl.com/terms-of-service.html';

export default function BusinessMoreScreen() {
  const router = useRouter();
  const { isAuthenticated, user, userType, logout, deleteAccount } = useAuth();
  const { restaurant } = useRestaurant();
  const { setMode, isModeLocked } = useAppMode();
  const [isDeleting, setIsDeleting] = useState(false);

  const go = (route: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const openURL = async (url: string) => {
    try {
      if (await Linking.canOpenURL(url)) await Linking.openURL(url);
      else Alert.alert('Error', 'Unable to open this link.');
    } catch {
      Alert.alert('Error', 'Something went wrong opening this link.');
    }
  };

  const handleSwitchToGuest = () => {
    if (isModeLocked) {
      Alert.alert(
        'Restaurant account',
        'This account is registered as a restaurant. To browse as a guest, sign out and use a personal account.'
      );
      return;
    }
    Alert.alert('Switch to guest mode', 'Browse Unbottl as a drink lover instead of managing a restaurant?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Switch',
        onPress: async () => {
          await setMode('consumer');
          router.replace('/(tabs)/(home)');
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your restaurant account? This will also permanently delete your restaurant, all beverage inventory, menus, staff accounts, and analytics data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Final Confirmation', 'This is irreversible. All your data will be permanently deleted.', [
              { text: 'Go Back', style: 'cancel' },
              {
                text: 'Permanently Delete',
                style: 'destructive',
                onPress: async () => {
                  setIsDeleting(true);
                  try {
                    const { error } = await deleteAccount();
                    if (error) {
                      Alert.alert('Error', "We couldn't delete your account right now. Please try again or contact support@unbottl.com.");
                    } else {
                      Alert.alert('Account Deleted', 'Your account and all associated data have been permanently deleted.', [
                        { text: 'OK', onPress: () => router.replace('/') },
                      ]);
                    }
                  } catch {
                    Alert.alert('Error', 'Something went wrong. Please contact support@unbottl.com.');
                  } finally {
                    setIsDeleting(false);
                  }
                },
              },
            ]);
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return <BusinessAuthPrompt />;
  }

  const managementItems = [
    { icon: Building2, label: 'Restaurant Details', desc: 'Update restaurant info', route: '/restaurant-setup' },
    { icon: QrCode, label: 'QR Menu', desc: 'Generate customer QR codes', route: '/qr-menu' },
    { icon: FileSpreadsheet, label: 'Import CSV', desc: 'Bulk import from spreadsheet', route: '/csv-import' },
    { icon: Users, label: 'Team', desc: 'Manage staff access', route: '/staff-management' },
    { icon: Zap, label: 'Subscription', desc: 'Manage your plan', route: '/pricing' },
  ];

  const supportItems = [
    { icon: MessageSquarePlus, label: 'Send Feedback', desc: 'Report bugs or request features', onPress: () => go('/feedback') },
    { icon: HelpCircle, label: 'Help & Support', desc: 'Get help', onPress: () => Alert.alert('Help & Support', 'Need help? Email us at support@unbottl.com') },
    { icon: FileText, label: 'Terms of Service', desc: 'Legal information', onPress: () => openURL(TERMS_OF_SERVICE_URL) },
    { icon: Shield, label: 'Privacy Policy', desc: 'Your data & privacy', onPress: () => openURL(PRIVACY_POLICY_URL) },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile header */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Building2 size={30} color={Colors.primary} />
          </View>
          <Text style={styles.name}>{restaurant?.name || user?.name || 'Your Restaurant'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Management */}
        <Text style={styles.sectionTitle}>Restaurant Management</Text>
        <View style={styles.card}>
          {managementItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.item} onPress={() => go(item.route)}>
                <View style={[styles.itemIcon, { backgroundColor: Colors.primary + '12' }]}>
                  <item.icon size={18} color={Colors.primary} />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemDesc}>{item.desc}</Text>
                </View>
                <ChevronRight size={18} color={Colors.textMuted} />
              </TouchableOpacity>
              {index < managementItems.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Switch mode */}
        {!isModeLocked && (
          <TouchableOpacity style={styles.switchCard} onPress={handleSwitchToGuest}>
            <View style={[styles.itemIcon, { backgroundColor: Colors.secondary + '20' }]}>
              <Compass size={18} color={Colors.secondary} />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>Switch to Guest Mode</Text>
              <Text style={styles.itemDesc}>Browse and save drinks as a guest</Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Support */}
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.card}>
          {supportItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.item} onPress={item.onPress}>
                <View style={[styles.itemIcon, { backgroundColor: Colors.textMuted + '15' }]}>
                  <item.icon size={18} color={Colors.textMuted} />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemDesc}>{item.desc}</Text>
                </View>
                <ChevronRight size={18} color={Colors.textMuted} />
              </TouchableOpacity>
              {index < supportItems.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Account actions */}
        <View style={styles.accountActions}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={18} color={Colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount} disabled={isDeleting}>
            {isDeleting ? (
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <>
                <Trash2 size={16} color={Colors.textMuted} />
                <Text style={styles.deleteText}>Delete Account</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Unbottl v1.0.0</Text>
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 20 },
  profile: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  name: { fontSize: 22, fontWeight: '700' as const, color: Colors.text, marginBottom: 4 },
  email: { fontSize: 14, color: Colors.textSecondary },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: { flex: 1 },
  itemLabel: { fontSize: 15, fontWeight: '500' as const, color: Colors.text },
  itemDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 1 },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginLeft: 64 },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  accountActions: { paddingHorizontal: 20 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error + '10',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '600' as const, color: Colors.error },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    marginTop: 12,
  },
  deleteText: { fontSize: 13, fontWeight: '500' as const, color: Colors.textMuted },
  version: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 20 },
});
