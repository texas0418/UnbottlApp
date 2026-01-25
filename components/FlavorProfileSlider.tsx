import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

export interface FlavorFilters {
  body: [number, number];
  sweetness: [number, number];
  tannins: [number, number];
  acidity: [number, number];
}

interface FlavorProfileSliderProps {
  filters: FlavorFilters;
  onFiltersChange: (filters: FlavorFilters) => void;
  matchCount: number;
}

const SLIDER_CONFIGS = [
  { key: 'body' as const, label: 'Body', leftLabel: 'Light', rightLabel: 'Full', color: '#8B5A6B' },
  { key: 'sweetness' as const, label: 'Sweetness', leftLabel: 'Dry', rightLabel: 'Sweet', color: '#C9A962' },
  { key: 'tannins' as const, label: 'Tannins', leftLabel: 'Soft', rightLabel: 'Bold', color: '#722F37' },
  { key: 'acidity' as const, label: 'Acidity', leftLabel: 'Low', rightLabel: 'Crisp', color: '#6B8E6B' },
];

const DEFAULT_FILTERS: FlavorFilters = {
  body: [1, 5],
  sweetness: [1, 5],
  tannins: [1, 5],
  acidity: [1, 5],
};

function RangeSlider({
  value,
  onChange,
  color,
  leftLabel,
  rightLabel,
}: {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  color: string;
  leftLabel: string;
  rightLabel: string;
}) {
  const sliderWidth = useRef(0);
  const [localValue, setLocalValue] = useState(value);
  const leftPos = useRef(new Animated.Value(0)).current;
  const rightPos = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    setLocalValue(value);
    leftPos.setValue((value[0] - 1) / 4);
    rightPos.setValue((value[1] - 1) / 4);
  }, [value, leftPos, rightPos]);

  const createPanResponder = (isLeft: boolean) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      onPanResponderMove: (_, gestureState) => {
        if (sliderWidth.current === 0) return;
        
        const delta = gestureState.dx / sliderWidth.current;
        const currentPos = isLeft ? (localValue[0] - 1) / 4 : (localValue[1] - 1) / 4;
        let newPos = Math.max(0, Math.min(1, currentPos + delta));
        
        const newValue = Math.round(newPos * 4) + 1;
        
        if (isLeft) {
          if (newValue < localValue[1]) {
            const updated: [number, number] = [newValue, localValue[1]];
            setLocalValue(updated);
            leftPos.setValue((newValue - 1) / 4);
          }
        } else {
          if (newValue > localValue[0]) {
            const updated: [number, number] = [localValue[0], newValue];
            setLocalValue(updated);
            rightPos.setValue((newValue - 1) / 4);
          }
        }
      },
      onPanResponderRelease: () => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onChange(localValue);
      },
    });
  };

  const leftPanResponder = useRef(createPanResponder(true)).current;
  const rightPanResponder = useRef(createPanResponder(false)).current;

  const handleDotPress = (dotValue: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const leftDist = Math.abs(dotValue - localValue[0]);
    const rightDist = Math.abs(dotValue - localValue[1]);
    
    let newValue: [number, number];
    if (leftDist <= rightDist && dotValue < localValue[1]) {
      newValue = [dotValue, localValue[1]];
    } else if (dotValue > localValue[0]) {
      newValue = [localValue[0], dotValue];
    } else {
      return;
    }
    
    setLocalValue(newValue);
    leftPos.setValue((newValue[0] - 1) / 4);
    rightPos.setValue((newValue[1] - 1) / 4);
    onChange(newValue);
  };

  const leftPercent = ((localValue[0] - 1) / 4) * 100;
  const rightPercent = ((localValue[1] - 1) / 4) * 100;

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.labelsRow}>
        <Text style={sliderStyles.edgeLabel}>{leftLabel}</Text>
        <Text style={sliderStyles.edgeLabel}>{rightLabel}</Text>
      </View>
      
      <View 
        style={sliderStyles.track}
        onLayout={(e) => { sliderWidth.current = e.nativeEvent.layout.width; }}
      >
        <View style={sliderStyles.trackBackground} />
        
        <View 
          style={[
            sliderStyles.trackFill,
            { 
              left: `${leftPercent}%`, 
              right: `${100 - rightPercent}%`,
              backgroundColor: color,
            }
          ]} 
        />
        
        {[1, 2, 3, 4, 5].map((dot) => {
          const isInRange = dot >= localValue[0] && dot <= localValue[1];
          return (
            <TouchableOpacity
              key={dot}
              style={[
                sliderStyles.dot,
                { left: `${((dot - 1) / 4) * 100}%` },
                isInRange && { backgroundColor: color, borderColor: color },
              ]}
              onPress={() => handleDotPress(dot)}
              activeOpacity={0.7}
            />
          );
        })}
        
        <Animated.View
          style={[
            sliderStyles.thumb,
            { 
              left: `${leftPercent}%`,
              backgroundColor: color,
              shadowColor: color,
            }
          ]}
          {...leftPanResponder.panHandlers}
        >
          <View style={sliderStyles.thumbInner} />
        </Animated.View>
        
        <Animated.View
          style={[
            sliderStyles.thumb,
            { 
              left: `${rightPercent}%`,
              backgroundColor: color,
              shadowColor: color,
            }
          ]}
          {...rightPanResponder.panHandlers}
        >
          <View style={sliderStyles.thumbInner} />
        </Animated.View>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  edgeLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  track: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
  },
  trackFill: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
  },
  dot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    marginLeft: -6,
    top: 14,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: -12,
    top: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  thumbInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
});

export default function FlavorProfileSlider({
  filters,
  onFiltersChange,
  matchCount,
}: FlavorProfileSliderProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const toggleExpanded = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const toValue = isExpanded ? 0 : 1;
    Animated.spring(expandAnim, {
      toValue,
      useNativeDriver: false,
      friction: 8,
      tension: 50,
    }).start();
    setIsExpanded(!isExpanded);
  }, [isExpanded, expandAnim]);

  const handleReset = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onFiltersChange(DEFAULT_FILTERS);
  }, [onFiltersChange]);

  const hasActiveFilters = 
    filters.body[0] !== 1 || filters.body[1] !== 5 ||
    filters.sweetness[0] !== 1 || filters.sweetness[1] !== 5 ||
    filters.tannins[0] !== 1 || filters.tannins[1] !== 5 ||
    filters.acidity[0] !== 1 || filters.acidity[1] !== 5;

  const containerHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 340],
  });

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity 
        style={[styles.header, isExpanded && styles.headerExpanded]} 
        onPress={toggleExpanded}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, hasActiveFilters && styles.iconContainerActive]}>
            <SlidersHorizontal size={18} color={hasActiveFilters ? Colors.white : Colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Flavor Profile</Text>
            <Text style={styles.headerSubtitle}>
              {hasActiveFilters ? `${matchCount} wines match` : 'Filter by taste'}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {hasActiveFilters && (
            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={handleReset}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <RotateCcw size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
          <View style={[styles.expandIcon, isExpanded && styles.expandIconRotated]}>
            <X 
              size={20} 
              color={Colors.textSecondary} 
              style={{ transform: [{ rotate: isExpanded ? '0deg' : '45deg' }] }}
            />
          </View>
        </View>
      </TouchableOpacity>

      <Animated.View style={[styles.content, { height: containerHeight, overflow: 'hidden' }]}>
        <View style={styles.slidersContainer}>
          {SLIDER_CONFIGS.map((config) => (
            <View key={config.key} style={styles.sliderWrapper}>
              <Text style={[styles.sliderLabel, { color: config.color }]}>{config.label}</Text>
              <RangeSlider
                value={filters[config.key]}
                onChange={(value) => onFiltersChange({ ...filters, [config.key]: value })}
                color={config.color}
                leftLabel={config.leftLabel}
                rightLabel={config.rightLabel}
              />
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: Colors.primary,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetButton: {
    padding: 4,
  },
  expandIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandIconRotated: {
    backgroundColor: Colors.borderLight,
  },
  content: {
    backgroundColor: Colors.surface,
  },
  slidersContainer: {
    padding: 16,
    paddingTop: 12,
    gap: 8,
  },
  sliderWrapper: {
    marginBottom: 4,
  },
  sliderLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
});
