import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { WifiOff, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useOffline } from '@/contexts/OfflineContext';

interface OfflineIndicatorProps {
  showCacheInfo?: boolean;
  compact?: boolean;
}

export default function OfflineIndicator({ showCacheInfo = true, compact = false }: OfflineIndicatorProps) {
  const { isOffline, hasCache, getCacheAge } = useOffline();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isOffline) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOffline, slideAnim, pulseAnim]);

  if (!isOffline) return null;

  const cacheAge = getCacheAge();

  if (compact) {
    return (
      <Animated.View 
        style={[
          styles.compactContainer,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        <Animated.View style={{ opacity: pulseAnim }}>
          <WifiOff size={14} color={Colors.white} />
        </Animated.View>
        <Text style={styles.compactText}>Offline Mode</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Animated.View style={{ opacity: pulseAnim }}>
            <WifiOff size={20} color={Colors.white} />
          </Animated.View>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>You&apos;re Offline</Text>
          {showCacheInfo && hasCache && cacheAge && (
            <View style={styles.cacheInfo}>
              <Clock size={12} color="rgba(255,255,255,0.8)" />
              <Text style={styles.cacheText}>Cached {cacheAge}</Text>
            </View>
          )}
          {showCacheInfo && !hasCache && (
            <Text style={styles.subtitle}>No cached data available</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  cacheInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cacheText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.text,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
