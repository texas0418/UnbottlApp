import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import Colors from '@/constants/colors';
import { useAppMode } from '@/hooks/useAppMode';

/**
 * Entry gate. Decides which experience to show on launch:
 *  - no choice yet  → Welcome (role selection)
 *  - business        → restaurant dashboard
 *  - consumer        → discover experience
 */
export default function IndexGate() {
  const { mode, isLoading } = useAppMode();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!mode) {
    return <Redirect href="/welcome" />;
  }

  if (mode === 'business') {
    return <Redirect href="/(business)/dashboard" />;
  }

  return <Redirect href="/(tabs)/(home)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
