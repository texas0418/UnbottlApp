import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';

const NOTIFICATIONS_STORAGE_KEY = '@unbottl_notifications';
const FAVORITE_RESTAURANTS_KEY = '@unbottl_favorite_restaurants';

export interface NotificationPreferences {
  enabled: boolean;
  newWines: boolean;
  newBeers: boolean;
  newCocktails: boolean;
  newSpirits: boolean;
  specialOffers: boolean;
  menuUpdates: boolean;
  recommendations: boolean;
}

export interface FavoriteRestaurant {
  id: string;
  name: string;
  subscribedAt: string;
  notificationsEnabled: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  restaurantId: string;
  restaurantName: string;
  beverageCategory?: string;
  beverageId?: string;
  type: 'new_wine' | 'new_beer' | 'new_cocktail' | 'new_spirit' | 'menu_update' | 'special_offer' | 'recommendation';
  read: boolean;
  createdAt: string;
}

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  newWines: true,
  newBeers: true,
  newCocktails: true,
  newSpirits: true,
  specialOffers: true,
  menuUpdates: true,
  recommendations: true,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const [NotificationsProvider, useNotifications] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<FavoriteRestaurant[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  const preferencesQuery = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) as NotificationPreferences : defaultPreferences;
    },
  });

  const favoriteRestaurantsQuery = useQuery({
    queryKey: ['favoriteRestaurants'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(FAVORITE_RESTAURANTS_KEY);
      return stored ? JSON.parse(stored) as FavoriteRestaurant[] : [];
    },
  });

  const notificationsQuery = useQuery({
    queryKey: ['notificationItems'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem('@unbottl_notification_items');
      return stored ? JSON.parse(stored) as NotificationItem[] : [];
    },
  });

  useEffect(() => {
    if (preferencesQuery.data) {
      setPreferences(preferencesQuery.data);
    }
  }, [preferencesQuery.data]);

  useEffect(() => {
    if (favoriteRestaurantsQuery.data) {
      setFavoriteRestaurants(favoriteRestaurantsQuery.data);
    }
  }, [favoriteRestaurantsQuery.data]);

  useEffect(() => {
    if (notificationsQuery.data) {
      setNotifications(notificationsQuery.data);
    }
  }, [notificationsQuery.data]);

  useEffect(() => {
    registerForPushNotifications();
  }, []);

  const registerForPushNotifications = async () => {
    if (Platform.OS === 'web') {
      console.log('Push notifications not supported on web');
      setPermissionStatus('denied');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        setPermissionStatus('denied');
        return;
      }

      setPermissionStatus('granted');

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'fa31i7lek0zpay056wz2u',
      });
      setExpoPushToken(token.data);
      console.log('Expo push token:', token.data);
    } catch (error) {
      console.log('Error registering for push notifications:', error);
      setPermissionStatus('denied');
    }
  };

  const requestPermission = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Supported', 'Push notifications are not supported on web.');
      return false;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status === 'granted' ? 'granted' : 'denied');
    
    if (status === 'granted') {
      if ((Platform.OS as string) !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      return true;
    }
    return false;
  };

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<NotificationPreferences>) => {
      const updated = { ...preferences, ...newPreferences };
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      setPreferences(updated);
      queryClient.setQueryData(['notificationPreferences'], updated);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      return updated;
    },
  });

  const subscribeToRestaurantMutation = useMutation({
    mutationFn: async (restaurant: { id: string; name: string }) => {
      const existing = favoriteRestaurants.find(r => r.id === restaurant.id);
      if (existing) {
        throw new Error('Already subscribed to this restaurant');
      }

      const newFavorite: FavoriteRestaurant = {
        id: restaurant.id,
        name: restaurant.name,
        subscribedAt: new Date().toISOString(),
        notificationsEnabled: true,
      };

      const updated = [...favoriteRestaurants, newFavorite];
      await AsyncStorage.setItem(FAVORITE_RESTAURANTS_KEY, JSON.stringify(updated));
      setFavoriteRestaurants(updated);
      queryClient.setQueryData(['favoriteRestaurants'], updated);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      return newFavorite;
    },
  });

  const unsubscribeFromRestaurantMutation = useMutation({
    mutationFn: async (restaurantId: string) => {
      const updated = favoriteRestaurants.filter(r => r.id !== restaurantId);
      await AsyncStorage.setItem(FAVORITE_RESTAURANTS_KEY, JSON.stringify(updated));
      setFavoriteRestaurants(updated);
      queryClient.setQueryData(['favoriteRestaurants'], updated);

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      return restaurantId;
    },
  });

  const toggleRestaurantNotificationsMutation = useMutation({
    mutationFn: async (restaurantId: string) => {
      const updated = favoriteRestaurants.map(r => 
        r.id === restaurantId 
          ? { ...r, notificationsEnabled: !r.notificationsEnabled }
          : r
      );
      await AsyncStorage.setItem(FAVORITE_RESTAURANTS_KEY, JSON.stringify(updated));
      setFavoriteRestaurants(updated);
      queryClient.setQueryData(['favoriteRestaurants'], updated);

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      return updated;
    },
  });

  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const updated = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      await AsyncStorage.setItem('@unbottl_notification_items', JSON.stringify(updated));
      setNotifications(updated);
      queryClient.setQueryData(['notificationItems'], updated);
      return notificationId;
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const updated = notifications.map(n => ({ ...n, read: true }));
      await AsyncStorage.setItem('@unbottl_notification_items', JSON.stringify(updated));
      setNotifications(updated);
      queryClient.setQueryData(['notificationItems'], updated);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
  });

  const clearAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.setItem('@unbottl_notification_items', JSON.stringify([]));
      setNotifications([]);
      queryClient.setQueryData(['notificationItems'], []);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
  });

  const addNotification = useCallback(async (notification: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: NotificationItem = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newNotification, ...notifications];
    await AsyncStorage.setItem('@unbottl_notification_items', JSON.stringify(updated));
    setNotifications(updated);
    queryClient.setQueryData(['notificationItems'], updated);

    if (Platform.OS !== 'web' && preferences.enabled) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: { 
            restaurantId: notification.restaurantId,
            beverageId: notification.beverageId,
            type: notification.type,
          },
        },
        trigger: null,
      });
    }

    return newNotification;
  }, [notifications, preferences.enabled, queryClient]);

  const isSubscribedToRestaurant = useCallback((restaurantId: string) => {
    return favoriteRestaurants.some(r => r.id === restaurantId);
  }, [favoriteRestaurants]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    preferences,
    favoriteRestaurants,
    notifications,
    unreadCount,
    expoPushToken,
    permissionStatus,
    isLoading: preferencesQuery.isLoading || favoriteRestaurantsQuery.isLoading,
    requestPermission,
    updatePreferences: updatePreferencesMutation.mutateAsync,
    subscribeToRestaurant: subscribeToRestaurantMutation.mutateAsync,
    unsubscribeFromRestaurant: unsubscribeFromRestaurantMutation.mutateAsync,
    toggleRestaurantNotifications: toggleRestaurantNotificationsMutation.mutateAsync,
    markNotificationRead: markNotificationReadMutation.mutateAsync,
    markAllRead: markAllReadMutation.mutateAsync,
    clearAllNotifications: clearAllNotificationsMutation.mutateAsync,
    addNotification,
    isSubscribedToRestaurant,
  };
});
