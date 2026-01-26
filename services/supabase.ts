import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper function to get current user ID
export const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
};

// For now, use a device-based ID if no auth (simpler for MVP)
export const getDeviceId = async (): Promise<string> => {
  let deviceId = await AsyncStorage.getItem('@unbottl_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    await AsyncStorage.setItem('@unbottl_device_id', deviceId);
  }
  return deviceId;
};
