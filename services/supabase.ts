import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// DEBUG: Log what we're getting
console.log('🔧 SUPABASE DEBUG:');
console.log('  URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING!');
console.log('  Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING!');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials not found! Check your .env file.');
  console.error('   Make sure .env is in the ROOT of your project (same folder as package.json)');
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
    console.log('🆔 Created new device ID:', deviceId);
  } else {
    console.log('🆔 Using existing device ID:', deviceId);
  }
  return deviceId;
};

// Test function to verify Supabase connection
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing Supabase connection...');
    const { data, error } = await supabase.from('wines').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase test failed:', error.message);
      return false;
    }
    console.log('✅ Supabase connection successful!');
    return true;
  } catch (e) {
    console.error('❌ Supabase test exception:', e);
    return false;
  }
};
