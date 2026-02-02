import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Log credentials status to console (only visible in development, not to users)
if (__DEV__) {
  console.log('Supabase URL:', supabaseUrl ? '✅ Loaded' : '❌ Missing');
  console.log('Supabase Key:', supabaseAnonKey ? '✅ Loaded' : '❌ Missing');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials not found!');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
};

export const getDeviceId = async (): Promise<string> => {
  let deviceId = await AsyncStorage.getItem('@unbottl_device_id');
  
  if (!deviceId) {
    deviceId = 'device_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    await AsyncStorage.setItem('@unbottl_device_id', deviceId);
  }
  
  return deviceId;
};
