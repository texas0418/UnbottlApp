import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Show alert after app loads to debug env vars
setTimeout(() => {
  Alert.alert(
    'Supabase Debug',
    `URL: ${supabaseUrl ? 'LOADED ✅' : 'MISSING ❌'}\nKey: ${supabaseAnonKey ? 'LOADED ✅' : 'MISSING ❌'}`,
    [{ text: 'OK' }]
  );
}, 3000);

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
