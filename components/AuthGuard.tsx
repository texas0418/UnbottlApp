import React from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredUserType?: 'consumer' | 'restaurant_owner';
}

/**
 * AuthGuard - Wraps screens that require authentication.
 * 
 * Usage:
 *   <AuthGuard requiredUserType="restaurant_owner">
 *     <YourScreenContent />
 *   </AuthGuard>
 * 
 * Behavior:
 *   - Shows a loading spinner while auth state is being determined
 *   - Redirects to /login if the user is not authenticated
 *   - Redirects to /login if the user doesn't match the requiredUserType
 *   - Renders children if all checks pass
 */
export default function AuthGuard({ children, requiredUserType }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, userType } = useAuth();

  React.useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (requiredUserType && userType !== requiredUserType) {
      router.replace('/login');
      return;
    }
  }, [isAuthenticated, isLoading, userType, requiredUserType, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (requiredUserType && userType !== requiredUserType) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
