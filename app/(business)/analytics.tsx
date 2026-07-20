import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import BusinessAuthPrompt from '@/components/BusinessAuthPrompt';
import { AnalyticsContent } from '@/app/analytics';

export default function BusinessAnalyticsTab() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <BusinessAuthPrompt message="Sign in to see how guests are engaging with your menu." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <AnalyticsContent embedded />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1 },
});
