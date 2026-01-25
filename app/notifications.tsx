import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Bell,
  BellOff,
  Wine,
  Beer,
  Martini,
  GlassWater,
  Sparkles,
  Tag,
  FileText,
  Heart,
  ChevronRight,

  CheckCheck,
  Trash2,
  Store,
  AlertCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useNotifications, NotificationItem } from '@/contexts/NotificationsContext';

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    preferences,
    favoriteRestaurants,
    notifications,
    unreadCount,
    permissionStatus,

    requestPermission,
    updatePreferences,
    unsubscribeFromRestaurant,
    toggleRestaurantNotifications,
    markNotificationRead,
    markAllRead,
    clearAllNotifications,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');
  const [refreshing, setRefreshing] = useState(false);

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings to receive alerts about new wines and menu updates.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleTogglePreference = async (key: keyof typeof preferences) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await updatePreferences({ [key]: !preferences[key] });
  };

  const handleUnsubscribe = (restaurantId: string, restaurantName: string) => {
    Alert.alert(
      'Unsubscribe',
      `Stop receiving notifications from ${restaurantName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsubscribe',
          style: 'destructive',
          onPress: async () => {
            await unsubscribeFromRestaurant(restaurantId);
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All',
      'Remove all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearAllNotifications(),
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'new_wine':
        return <Wine size={18} color={Colors.primary} />;
      case 'new_beer':
        return <Beer size={18} color="#F59E0B" />;
      case 'new_cocktail':
        return <Martini size={18} color="#EC4899" />;
      case 'new_spirit':
        return <GlassWater size={18} color="#8B5CF6" />;
      case 'special_offer':
        return <Tag size={18} color="#10B981" />;
      case 'menu_update':
        return <FileText size={18} color="#3B82F6" />;
      case 'recommendation':
        return <Sparkles size={18} color={Colors.secondary} />;
      default:
        return <Bell size={18} color={Colors.textMuted} />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const preferenceItems = [
    { key: 'newWines', icon: Wine, label: 'New Wines', description: 'When restaurants add new wines', color: Colors.primary },
    { key: 'newBeers', icon: Beer, label: 'New Beers', description: 'When restaurants add new beers', color: '#F59E0B' },
    { key: 'newCocktails', icon: Martini, label: 'New Cocktails', description: 'When restaurants add new cocktails', color: '#EC4899' },
    { key: 'newSpirits', icon: GlassWater, label: 'New Spirits', description: 'When restaurants add new spirits', color: '#8B5CF6' },
    { key: 'specialOffers', icon: Tag, label: 'Special Offers', description: 'Deals and promotions', color: '#10B981' },
    { key: 'menuUpdates', icon: FileText, label: 'Menu Updates', description: 'Changes to menus', color: '#3B82F6' },
    { key: 'recommendations', icon: Sparkles, label: 'Recommendations', description: 'Personalized suggestions', color: Colors.secondary },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerRight}>
          {activeTab === 'notifications' && notifications.length > 0 && (
            <TouchableOpacity onPress={() => markAllRead()} style={styles.headerAction}>
              <CheckCheck size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notifications' && styles.activeTab]}
          onPress={() => setActiveTab('notifications')}
        >
          <Bell size={16} color={activeTab === 'notifications' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.activeTabText]}>
            Inbox
          </Text>
          {unreadCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <Heart size={16} color={activeTab === 'settings' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            Preferences
          </Text>
        </TouchableOpacity>
      </View>

      {permissionStatus !== 'granted' && (
        <TouchableOpacity style={styles.permissionBanner} onPress={handleRequestPermission}>
          <AlertCircle size={20} color="#F59E0B" />
          <View style={styles.permissionContent}>
            <Text style={styles.permissionTitle}>Enable Notifications</Text>
            <Text style={styles.permissionText}>Tap to allow push notifications</Text>
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {activeTab === 'notifications' ? (
          <>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <BellOff size={48} color={Colors.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptyText}>
                  Follow your favorite restaurants to get alerts when they add new beverages
                </Text>
              </View>
            ) : (
              <>
                {notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[styles.notificationItem, !notification.read && styles.unreadItem]}
                    onPress={() => markNotificationRead(notification.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.notificationIcon, !notification.read && styles.unreadIcon]}>
                      {getNotificationIcon(notification.type)}
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={[styles.notificationTitle, !notification.read && styles.unreadTitle]}>
                        {notification.title}
                      </Text>
                      <Text style={styles.notificationBody} numberOfLines={2}>
                        {notification.body}
                      </Text>
                      <View style={styles.notificationMeta}>
                        <Store size={12} color={Colors.textMuted} />
                        <Text style={styles.notificationRestaurant}>{notification.restaurantName}</Text>
                        <Text style={styles.notificationTime}>• {formatTimeAgo(notification.createdAt)}</Text>
                      </View>
                    </View>
                    {!notification.read && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
                  <Trash2 size={16} color={Colors.error} />
                  <Text style={styles.clearButtonText}>Clear All Notifications</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Push Notifications</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.toggleItem}>
                  <View style={[styles.toggleIcon, { backgroundColor: Colors.primary + '15' }]}>
                    <Bell size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.toggleContent}>
                    <Text style={styles.toggleLabel}>Enable Notifications</Text>
                    <Text style={styles.toggleDescription}>Master toggle for all alerts</Text>
                  </View>
                  <Switch
                    value={preferences.enabled}
                    onValueChange={() => handleTogglePreference('enabled')}
                    trackColor={{ false: Colors.border, true: Colors.primary + '60' }}
                    thumbColor={preferences.enabled ? Colors.primary : Colors.surface}
                  />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Notification Types</Text>
                <Text style={styles.sectionSubtitle}>Choose what alerts you want</Text>
              </View>
              <View style={styles.card}>
                {preferenceItems.map((item, index) => (
                  <React.Fragment key={item.key}>
                    <View style={styles.toggleItem}>
                      <View style={[styles.toggleIcon, { backgroundColor: item.color + '15' }]}>
                        <item.icon size={18} color={item.color} />
                      </View>
                      <View style={styles.toggleContent}>
                        <Text style={styles.toggleLabel}>{item.label}</Text>
                        <Text style={styles.toggleDescription}>{item.description}</Text>
                      </View>
                      <Switch
                        value={preferences[item.key as keyof typeof preferences] as boolean}
                        onValueChange={() => handleTogglePreference(item.key as keyof typeof preferences)}
                        trackColor={{ false: Colors.border, true: item.color + '60' }}
                        thumbColor={preferences[item.key as keyof typeof preferences] ? item.color : Colors.surface}
                        disabled={!preferences.enabled}
                      />
                    </View>
                    {index < preferenceItems.length - 1 && <View style={styles.divider} />}
                  </React.Fragment>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Favorite Restaurants</Text>
                <Text style={styles.sectionSubtitle}>Restaurants you are following</Text>
              </View>
              {favoriteRestaurants.length === 0 ? (
                <View style={styles.emptyRestaurants}>
                  <Store size={32} color={Colors.textMuted} />
                  <Text style={styles.emptyRestaurantsText}>
                    No favorite restaurants yet
                  </Text>
                  <Text style={styles.emptyRestaurantsSubtext}>
                    Follow restaurants to get notified about their new offerings
                  </Text>
                </View>
              ) : (
                <View style={styles.card}>
                  {favoriteRestaurants.map((restaurant, index) => (
                    <React.Fragment key={restaurant.id}>
                      <View style={styles.restaurantItem}>
                        <View style={styles.restaurantIcon}>
                          <Store size={18} color={Colors.secondary} />
                        </View>
                        <View style={styles.restaurantContent}>
                          <Text style={styles.restaurantName}>{restaurant.name}</Text>
                          <Text style={styles.restaurantDate}>
                            Following since {new Date(restaurant.subscribedAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <Switch
                          value={restaurant.notificationsEnabled}
                          onValueChange={() => { toggleRestaurantNotifications(restaurant.id); }}
                          trackColor={{ false: Colors.border, true: Colors.secondary + '60' }}
                          thumbColor={restaurant.notificationsEnabled ? Colors.secondary : Colors.surface}
                        />
                        <TouchableOpacity
                          onPress={() => handleUnsubscribe(restaurant.id, restaurant.name)}
                          style={styles.unsubscribeButton}
                        >
                          <X size={16} color={Colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                      {index < favoriteRestaurants.length - 1 && <View style={styles.divider} />}
                    </React.Fragment>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerAction: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    gap: 6,
  },
  activeTab: {
    backgroundColor: Colors.primary + '15',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  tabBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    gap: 12,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#92400E',
  },
  permissionText: {
    fontSize: 12,
    color: '#A16207',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  unreadItem: {
    backgroundColor: Colors.primary + '08',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  unreadIcon: {
    backgroundColor: Colors.primary + '15',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '600' as const,
  },
  notificationBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationRestaurant: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 8,
    marginTop: 6,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.error + '10',
    gap: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.error,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toggleContent: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  toggleDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 68,
  },
  emptyRestaurants: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: Colors.surface,
    borderRadius: 16,
  },
  emptyRestaurantsText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
    marginTop: 12,
  },
  emptyRestaurantsSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  restaurantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  restaurantIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.secondary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  restaurantContent: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  restaurantDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  unsubscribeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 40,
  },
});
