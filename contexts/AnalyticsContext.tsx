import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';

const ANALYTICS_STORAGE_KEY = '@unbottl_analytics';

export interface WineAnalytics {
  wineId: string;
  views: number;
  orders: number;
  lastViewed: string;
}

export interface DailyStats {
  date: string;
  menuViews: number;
  qrScans: number;
  orders: number;
}

export interface AnalyticsData {
  wineAnalytics: WineAnalytics[];
  dailyStats: DailyStats[];
  totalMenuViews: number;
  totalQrScans: number;
  totalOrders: number;
}

const generateMockAnalytics = (wineIds: string[]): AnalyticsData => {
  const today = new Date();
  const dailyStats: DailyStats[] = [];
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseMultiplier = isWeekend ? 1.8 : 1;
    
    dailyStats.push({
      date: date.toISOString().split('T')[0],
      menuViews: Math.floor((Math.random() * 80 + 40) * baseMultiplier),
      qrScans: Math.floor((Math.random() * 50 + 20) * baseMultiplier),
      orders: Math.floor((Math.random() * 30 + 10) * baseMultiplier),
    });
  }

  const wineAnalytics: WineAnalytics[] = wineIds.map(wineId => ({
    wineId,
    views: Math.floor(Math.random() * 200 + 50),
    orders: Math.floor(Math.random() * 40 + 5),
    lastViewed: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
  }));

  const totalMenuViews = dailyStats.reduce((sum, d) => sum + d.menuViews, 0);
  const totalQrScans = dailyStats.reduce((sum, d) => sum + d.qrScans, 0);
  const totalOrders = dailyStats.reduce((sum, d) => sum + d.orders, 0);

  return {
    wineAnalytics,
    dailyStats,
    totalMenuViews,
    totalQrScans,
    totalOrders,
  };
};

export const [AnalyticsProvider, useAnalytics] = createContextHook(() => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  const analyticsQuery = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as AnalyticsData;
      }
      const mockData = generateMockAnalytics([
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'
      ]);
      await AsyncStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(mockData));
      return mockData;
    },
  });

  useEffect(() => {
    if (analyticsQuery.data) {
      setAnalyticsData(analyticsQuery.data);
    }
  }, [analyticsQuery.data]);

  const popularWines = useMemo(() => {
    if (!analyticsData) return [];
    return [...analyticsData.wineAnalytics]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [analyticsData]);

  const last7DaysStats = useMemo(() => {
    if (!analyticsData) return [];
    return analyticsData.dailyStats.slice(-7);
  }, [analyticsData]);

  const last30DaysStats = useMemo(() => {
    if (!analyticsData) return [];
    return analyticsData.dailyStats;
  }, [analyticsData]);

  const weeklyComparison = useMemo(() => {
    if (!analyticsData || analyticsData.dailyStats.length < 14) {
      return { menuViews: 0, qrScans: 0, orders: 0 };
    }
    
    const thisWeek = analyticsData.dailyStats.slice(-7);
    const lastWeek = analyticsData.dailyStats.slice(-14, -7);
    
    const thisWeekViews = thisWeek.reduce((sum, d) => sum + d.menuViews, 0);
    const lastWeekViews = lastWeek.reduce((sum, d) => sum + d.menuViews, 0);
    
    const thisWeekScans = thisWeek.reduce((sum, d) => sum + d.qrScans, 0);
    const lastWeekScans = lastWeek.reduce((sum, d) => sum + d.qrScans, 0);
    
    const thisWeekOrders = thisWeek.reduce((sum, d) => sum + d.orders, 0);
    const lastWeekOrders = lastWeek.reduce((sum, d) => sum + d.orders, 0);
    
    return {
      menuViews: lastWeekViews > 0 ? Math.round(((thisWeekViews - lastWeekViews) / lastWeekViews) * 100) : 0,
      qrScans: lastWeekScans > 0 ? Math.round(((thisWeekScans - lastWeekScans) / lastWeekScans) * 100) : 0,
      orders: lastWeekOrders > 0 ? Math.round(((thisWeekOrders - lastWeekOrders) / lastWeekOrders) * 100) : 0,
    };
  }, [analyticsData]);

  const todayStats = useMemo(() => {
    if (!analyticsData || analyticsData.dailyStats.length === 0) {
      return { menuViews: 0, qrScans: 0, orders: 0 };
    }
    const today = analyticsData.dailyStats[analyticsData.dailyStats.length - 1];
    return {
      menuViews: today.menuViews,
      qrScans: today.qrScans,
      orders: today.orders,
    };
  }, [analyticsData]);

  const thisWeekStats = useMemo(() => {
    if (!analyticsData) return { menuViews: 0, qrScans: 0, orders: 0 };
    const week = analyticsData.dailyStats.slice(-7);
    return {
      menuViews: week.reduce((sum, d) => sum + d.menuViews, 0),
      qrScans: week.reduce((sum, d) => sum + d.qrScans, 0),
      orders: week.reduce((sum, d) => sum + d.orders, 0),
    };
  }, [analyticsData]);

  return {
    analyticsData,
    popularWines,
    last7DaysStats,
    last30DaysStats,
    weeklyComparison,
    todayStats,
    thisWeekStats,
    isLoading: analyticsQuery.isLoading,
  };
});
