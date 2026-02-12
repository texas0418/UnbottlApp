import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAgeVerified: boolean;
  userType: 'consumer' | 'restaurant_owner' | 'staff';
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isAgeVerified: false,
    userType: 'consumer',
  });

  // Fetch user profile from Supabase
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
    }

    return data;
  }, []);

  // Initialize auth state
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: profile?.display_name || session.user.email?.split('@')[0] || '',
          restaurantIds: [],
          currentRestaurantId: null,
          createdAt: session.user.created_at,
        };
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          isAgeVerified: profile?.is_age_verified || false,
          userType: profile?.user_type || 'consumer',
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isAgeVerified: false,
          userType: 'consumer',
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: profile?.display_name || session.user.email?.split('@')[0] || '',
            restaurantIds: [],
            currentRestaurantId: null,
            createdAt: session.user.created_at,
          };
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            isAgeVerified: profile?.is_age_verified || false,
            userType: profile?.user_type || 'consumer',
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isAgeVerified: false,
            userType: 'consumer',
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      return data.user;
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({
      email,
      password,
      name,
      userType = 'consumer',
    }: {
      email: string;
      password: string;
      name: string;
      userType?: 'consumer' | 'restaurant_owner';
    }) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            display_name: name,
            user_type: userType,
          },
        },
      });
      if (error) throw error;
      return data.user;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isAgeVerified: false,
        userType: 'consumer',
      });
      queryClient.clear();
    },
  });

  const verifyAge = useCallback(async (dateOfBirth: Date) => {
    if (!session?.user) return { error: new Error('Not authenticated') };

    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    const isOver21 = age > 21 || (age === 21 && monthDiff >= 0);

    if (!isOver21) {
      return { error: new Error('You must be 21 or older') };
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({
        date_of_birth: dateOfBirth.toISOString().split('T')[0],
        is_age_verified: true,
      })
      .eq('id', session.user.id);

    if (error) return { error };

    setAuthState(prev => ({ ...prev, isAgeVerified: true }));
    return { error: null };
  }, [session]);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (authState.user && session?.user) {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: updates.name,
        })
        .eq('id', session.user.id);

      if (!error) {
        const updatedUser = { ...authState.user, ...updates };
        setAuthState(prev => ({ ...prev, user: updatedUser }));
      }
    }
  }, [authState.user, session]);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'unbottl://auth/reset-password',
    });
    return { error };
  }, []);

  // ── Delete Account ──
  // Calls the Supabase RPC function to remove all user data,
  // then signs out locally.
  const deleteAccount = useCallback(async () => {
    if (!session?.user) {
      return { error: new Error('Not authenticated') };
    }

    try {
      // Call the database function to delete all user data
      const { error: rpcError } = await supabase.rpc('delete_user_account');

      if (rpcError) {
        console.error('Error deleting account:', rpcError);
        return { error: rpcError };
      }

      // Sign out locally after successful deletion
      await supabase.auth.signOut();

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isAgeVerified: false,
        userType: 'consumer',
      });
      queryClient.clear();

      return { error: null };
    } catch (err) {
      console.error('Delete account error:', err);
      return { error: err as Error };
    }
  }, [session, queryClient]);

  return {
    ...authState,
    session,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutate,
    updateUser,
    verifyAge,
    resetPassword,
    deleteAccount,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    loginError: loginMutation.error?.message || null,
    registerError: registerMutation.error?.message || null,
  };
});
