import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface DailyData {
  date: string;
  value: number;
}

interface AnalyticsChartProps {
  data: DailyData[];
  color: string;
  height?: number;
}

export function MiniBarChart({ data, color, height = 60 }: AnalyticsChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const animatedValues = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = animatedValues.map((anim, index) => {
      return Animated.timing(anim, {
        toValue: data[index]?.value || 0,
        duration: 600,
        delay: index * 50,
        useNativeDriver: false,
      });
    });
    Animated.parallel(animations).start();
  }, [data, animatedValues]);

  return (
    <View style={[styles.chartContainer, { height }]}>
      {data.map((item, index) => {
        const barHeight = animatedValues[index].interpolate({
          inputRange: [0, maxValue],
          outputRange: [4, height - 16],
          extrapolate: 'clamp',
        });

        return (
          <View key={item.date} style={styles.barWrapper}>
            <View style={styles.barBackground}>
              <Animated.View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
            <Text style={styles.dayLabel}>
              {new Date(item.date).toLocaleDateString('en-US', { weekday: 'narrow' })}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

interface TrendBadgeProps {
  value: number;
  label?: string;
}

export function TrendBadge({ value, label }: TrendBadgeProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const bgColor = isNeutral 
    ? Colors.border 
    : isPositive 
      ? 'rgba(74, 124, 89, 0.12)' 
      : 'rgba(199, 62, 62, 0.12)';
  const textColor = isNeutral 
    ? Colors.textSecondary 
    : isPositive 
      ? Colors.success 
      : Colors.error;

  return (
    <View style={[styles.trendBadge, { backgroundColor: bgColor }]}>
      <Icon size={12} color={textColor} />
      <Text style={[styles.trendValue, { color: textColor }]}>
        {isNeutral ? '0%' : `${isPositive ? '+' : ''}${value}%`}
      </Text>
      {label && <Text style={[styles.trendLabel, { color: textColor }]}>{label}</Text>}
    </View>
  );
}

interface AnalyticsStatProps {
  label: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

export function AnalyticsStat({ label, value, change, icon, color }: AnalyticsStatProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);

  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
        {icon}
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={styles.statValueRow}>
          <Text style={styles.statValue}>{value.toLocaleString()}</Text>
          <TrendBadge value={change} />
        </View>
      </View>
    </View>
  );
}

interface PopularItemProps {
  rank: number;
  name: string;
  views: number;
  maxViews: number;
}

export function PopularItem({ rank, name, views, maxViews }: PopularItemProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const percentage = (views / maxViews) * 100;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: percentage,
      duration: 800,
      delay: rank * 100,
      useNativeDriver: false,
    }).start();
  }, [percentage, rank, animatedWidth]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.popularItem}>
      <View style={styles.popularRank}>
        <Text style={styles.rankNumber}>{rank}</Text>
      </View>
      <View style={styles.popularInfo}>
        <Text style={styles.popularName} numberOfLines={1}>{name}</Text>
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              { width: widthInterpolated },
            ]}
          />
        </View>
      </View>
      <Text style={styles.popularViews}>{views}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barBackground: {
    flex: 1,
    width: '70%',
    maxWidth: 28,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendValue: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  trendLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  popularItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  popularRank: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  popularInfo: {
    flex: 1,
    marginRight: 12,
  },
  popularName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  popularViews: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    minWidth: 40,
    textAlign: 'right' as const,
  },
});
