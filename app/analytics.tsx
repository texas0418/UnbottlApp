import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, TrendingUp, TrendingDown, Eye, QrCode, ShoppingBag, BarChart3, Minus } from 'lucide-react-native';
import { useAnalytics } from '../contexts/AnalyticsContext';
import AuthGuard from '../components/AuthGuard';

const Colors = {
  primary: '#722F37',
  secondary: '#2D5A27',
  background: '#FAF7F2',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
};

const screenWidth = Dimensions.get('window').width;

type TimeRange = '7d' | '30d';

function AnalyticsContent() {
  const router = useRouter();
  const {
    analyticsData,
    popularWines,
    last7DaysStats,
    last30DaysStats,
    weeklyComparison,
    todayStats,
    thisWeekStats,
    isLoading,
  } = useAnalytics();

  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  if (isLoading || !analyticsData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  const stats = timeRange === '7d' ? last7DaysStats : last30DaysStats;

  const renderTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp size={14} color="#16A34A" />;
    if (value < 0) return <TrendingDown size={14} color="#DC2626" />;
    return <Minus size={14} color={Colors.textSecondary} />;
  };

  const renderTrendText = (value: number) => {
    const color = value > 0 ? '#16A34A' : value < 0 ? '#DC2626' : Colors.textSecondary;
    const prefix = value > 0 ? '+' : '';
    return (
      <Text style={[styles.trendText, { color }]}>
        {prefix}{value}% vs last week
      </Text>
    );
  };

  // Calculate chart data
  const chartData = stats || [];
  const maxMenuViews = Math.max(...chartData.map(d => d.menuViews), 1);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Today's Summary */}
        <Text style={styles.sectionTitle}>Today</Text>
        <View style={styles.todayRow}>
          <View style={[styles.todayCard, { backgroundColor: '#FEF3C7' }]}>
            <Eye size={20} color="#D97706" />
            <Text style={styles.todayValue}>{todayStats?.menuViews ?? 0}</Text>
            <Text style={styles.todayLabel}>Menu Views</Text>
          </View>
          <View style={[styles.todayCard, { backgroundColor: '#DBEAFE' }]}>
            <QrCode size={20} color="#2563EB" />
            <Text style={styles.todayValue}>{todayStats?.qrScans ?? 0}</Text>
            <Text style={styles.todayLabel}>QR Scans</Text>
          </View>
          <View style={[styles.todayCard, { backgroundColor: '#D1FAE5' }]}>
            <ShoppingBag size={20} color="#059669" />
            <Text style={styles.todayValue}>{todayStats?.orders ?? 0}</Text>
            <Text style={styles.todayLabel}>Orders</Text>
          </View>
        </View>

        {/* Weekly Comparison */}
        <Text style={styles.sectionTitle}>This Week vs Last Week</Text>
        <View style={styles.card}>
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Menu Views</Text>
              <View style={styles.trendRow}>
                {renderTrendIcon(weeklyComparison?.menuViews ?? 0)}
                {renderTrendText(weeklyComparison?.menuViews ?? 0)}
              </View>
            </View>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>QR Scans</Text>
              <View style={styles.trendRow}>
                {renderTrendIcon(weeklyComparison?.qrScans ?? 0)}
                {renderTrendText(weeklyComparison?.qrScans ?? 0)}
              </View>
            </View>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Orders</Text>
              <View style={styles.trendRow}>
                {renderTrendIcon(weeklyComparison?.orders ?? 0)}
                {renderTrendText(weeklyComparison?.orders ?? 0)}
              </View>
            </View>
          </View>
        </View>

        {/* Time Range Toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.sectionTitle}>Menu Views</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, timeRange === '7d' && styles.toggleActive]}
              onPress={() => setTimeRange('7d')}
            >
              <Text style={[styles.toggleText, timeRange === '7d' && styles.toggleTextActive]}>7 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, timeRange === '30d' && styles.toggleActive]}
              onPress={() => setTimeRange('30d')}
            >
              <Text style={[styles.toggleText, timeRange === '30d' && styles.toggleTextActive]}>30 Days</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Simple Bar Chart */}
        <View style={styles.card}>
          <View style={styles.chartContainer}>
            {chartData.map((day, index) => {
              const barHeight = (day.menuViews / maxMenuViews) * 120;
              const label = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
              const showLabel = timeRange === '7d' || index % 5 === 0;
              return (
                <View key={day.date} style={styles.barWrapper}>
                  <Text style={styles.barValue}>{day.menuViews}</Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(barHeight, 4),
                        backgroundColor: index === chartData.length - 1 ? Colors.primary : '#E8D5D7',
                      },
                    ]}
                  />
                  {showLabel && <Text style={styles.barLabel}>{label}</Text>}
                </View>
              );
            })}
          </View>
        </View>

        {/* Totals */}
        <Text style={styles.sectionTitle}>
          {timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'} Totals
        </Text>
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <View style={styles.totalItem}>
              <BarChart3 size={18} color={Colors.primary} />
              <Text style={styles.totalValue}>
                {analyticsData.totalMenuViews.toLocaleString()}
              </Text>
              <Text style={styles.totalLabel}>Total Views</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalItem}>
              <QrCode size={18} color="#2563EB" />
              <Text style={styles.totalValue}>
                {analyticsData.totalQrScans.toLocaleString()}
              </Text>
              <Text style={styles.totalLabel}>Total Scans</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalItem}>
              <ShoppingBag size={18} color="#059669" />
              <Text style={styles.totalValue}>
                {analyticsData.totalOrders.toLocaleString()}
              </Text>
              <Text style={styles.totalLabel}>Total Orders</Text>
            </View>
          </View>
        </View>

        {/* Popular Beverages */}
        <Text style={styles.sectionTitle}>Top Beverages</Text>
        <View style={styles.card}>
          {popularWines && popularWines.length > 0 ? (
            popularWines.map((wine, index) => (
              <View
                key={wine.wineId}
                style={[
                  styles.wineRow,
                  index < popularWines.length - 1 && styles.wineRowBorder,
                ]}
              >
                <View style={styles.wineRank}>
                  <Text style={styles.wineRankText}>{index + 1}</Text>
                </View>
                <View style={styles.wineInfo}>
                  <Text style={styles.wineName}>Beverage #{wine.wineId}</Text>
                  <Text style={styles.wineStats}>
                    {wine.views} views · {wine.orders} orders
                  </Text>
                </View>
                <View style={styles.wineViews}>
                  <Eye size={14} color={Colors.textSecondary} />
                  <Text style={styles.wineViewCount}>{wine.views}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No beverage data yet</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

export default function AnalyticsScreen() {
  return (
    <AuthGuard>
      <AnalyticsContent />
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  // Today cards
  todayRow: {
    flexDirection: 'row',
    gap: 10,
  },
  todayCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  todayValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  todayLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  // Weekly comparison
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  comparisonRow: {
    gap: 16,
  },
  comparisonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Toggle
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.border,
    borderRadius: 8,
    padding: 2,
    marginTop: 24,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  // Chart
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    paddingTop: 20,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  bar: {
    width: '60%',
    borderRadius: 4,
    minWidth: 4,
  },
  barValue: {
    fontSize: 8,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  barLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Totals
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  totalLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  totalDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  // Popular wines
  wineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  wineRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  wineRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wineRankText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  wineInfo: {
    flex: 1,
    gap: 2,
  },
  wineName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  wineStats: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  wineViews: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wineViewCount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
