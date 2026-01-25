import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';

const AUTH_STORAGE_KEY = '@unbottl_auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const authQuery = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored) as User;
        return user;
      }
      return null;
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!authQuery.isLoading) {
      setAuthState({
        user: authQuery.data || null,
        isAuthenticated: !!authQuery.data,
        isLoading: false,
      });
    }
  }, [authQuery.data, authQuery.isLoading]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (password.length < 6) {
        throw new Error('Invalid credentials');
      }

      const user: User = {
        id: '1',
        email,
        name: email.split('@')[0],
        restaurantIds: ['1'],
        currentRestaurantId: '1',
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      return user;
    },
    onSuccess: (user) => {
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      queryClient.setQueryData(['auth'], user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, name }: { email: string; password: string; name: string }) => {
      await new Promise(resolve => setTimeout(resolve, 800));

      const user: User = {
        id: Date.now().toString(),
        email,
        name,
        restaurantIds: [],
        currentRestaurantId: null,
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      return user;
    },
    onSuccess: (user) => {
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      queryClient.setQueryData(['auth'], user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    },
    onSuccess: () => {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      queryClient.setQueryData(['auth'], null);
      queryClient.clear();
    },
  });

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (authState.user) {
      const updatedUser = { ...authState.user, ...updates };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      setAuthState(prev => ({ ...prev, user: updatedUser }));
      queryClient.setQueryData(['auth'], updatedUser);
    }
  }, [authState.user, queryClient]);

  return {
    ...authState,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutate,
    updateUser,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    loginError: loginMutation.error?.message || null,
    registerError: registerMutation.error?.message || null,
  };
});
