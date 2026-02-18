import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Wine, Mail, Lock, User, Eye, EyeOff, Building2, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Button from '@/components/Button';

export default function LoginScreen() {
  const router = useRouter();
  const { login, register, resetPassword, isLoginLoading, isRegisterLoading, loginError, registerError } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<'consumer' | 'restaurant_owner'>('consumer');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleForgotPassword = async () => {
    const email = formData.email.trim();

    if (!email) {
      Alert.prompt(
        'Reset Password',
        'Enter your email address to receive a password reset link.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send',
            onPress: async (inputEmail) => {
              if (inputEmail?.trim()) {
                const { error } = await resetPassword(inputEmail.trim());
                if (error) {
                  Alert.alert('Error', error.message);
                } else {
                  Alert.alert('Check Your Email', 'A password reset link has been sent to your email address.');
                }
              }
            },
          },
        ],
        'plain-text',
        '',
        'email-address'
      );
    } else {
      const { error } = await resetPassword(email);
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Check Your Email', `A password reset link has been sent to ${email}.`);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isSignUp && !formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      if (isSignUp) {
        await register({
          email: formData.email.trim(),
          password: formData.password,
          name: formData.name.trim(),
          userType: userType,
        });

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Email confirmation is now required — show the confirmation screen
        // instead of navigating immediately
        setConfirmedEmail(formData.email.trim());
        setShowEmailConfirmation(true);

      } else {
        // Login — user has already confirmed their email
        const user = await login({
          email: formData.email.trim(),
          password: formData.password,
        });

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Fetch the user's profile to check their type
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();

        if (profile?.user_type === 'restaurant_owner') {
          // Check if they already have a restaurant set up
          const { data: restaurants } = await supabase
            .from('restaurants')
            .select('id')
            .eq('owner_id', user.id)
            .limit(1);

          if (restaurants && restaurants.length > 0) {
            // Restaurant already set up — go to Profile/Settings tab
            router.replace('/(tabs)/settings');
          } else {
            // No restaurant yet — go to setup
            router.replace('/restaurant-setup');
          }
        } else {
          // Consumer — go to Home tab
          router.replace('/');
        }
      }
    } catch (error) {
      Alert.alert(
        'Error',
        isSignUp ? registerError || 'Registration failed' : loginError || 'Login failed'
      );
    }
  };

  // ─── Email Confirmation Screen ───────────────────────────────────
  if (showEmailConfirmation) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <LinearGradient
          colors={[Colors.primary + '15', Colors.background]}
          style={styles.gradient}
        />
        <View style={styles.confirmationContainer}>
          <View style={styles.confirmationIconContainer}>
            <CheckCircle size={64} color={Colors.primary} strokeWidth={1.5} />
          </View>

          <Text style={styles.confirmationTitle}>Check Your Email</Text>

          <Text style={styles.confirmationSubtitle}>
            We sent a confirmation link to
          </Text>
          <Text style={styles.confirmationEmail}>{confirmedEmail}</Text>

          <Text style={styles.confirmationBody}>
            Tap the link in the email to verify your account, then come back here to sign in.
          </Text>

          <View style={styles.confirmationActions}>
            <Button
              title="Go to Sign In"
              onPress={() => {
                setShowEmailConfirmation(false);
                setIsSignUp(false);
                // Keep the email pre-filled for easy login after confirmation
              }}
              fullWidth
              size="large"
            />

            <TouchableOpacity
              style={styles.resendButton}
              onPress={async () => {
                try {
                  const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email: confirmedEmail,
                  });
                  if (error) {
                    Alert.alert('Error', error.message);
                  } else {
                    Alert.alert('Email Sent', 'A new confirmation link has been sent to your email.');
                  }
                } catch (e) {
                  Alert.alert('Error', 'Failed to resend confirmation email. Please try again.');
                }
              }}
            >
              <Text style={styles.resendText}>Didn't receive it? Resend email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Login / Sign Up Form ────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={[Colors.primary + '15', Colors.background]}
        style={styles.gradient}
      />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Wine size={48} color={Colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.title}>Unbottl</Text>
            <Text style={styles.subtitle}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </Text>
          </View>

          {isSignUp && (
            <View style={styles.userTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'consumer' && styles.userTypeButtonActive,
                ]}
                onPress={() => setUserType('consumer')}
              >
                <User size={24} color={userType === 'consumer' ? Colors.primary : Colors.textMuted} />
                <Text style={[
                  styles.userTypeText,
                  userType === 'consumer' && styles.userTypeTextActive,
                ]}>Consumer</Text>
                <Text style={styles.userTypeDesc}>Save favorites & track drinks</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'restaurant_owner' && styles.userTypeButtonActive,
                ]}
                onPress={() => setUserType('restaurant_owner')}
              >
                <Building2 size={24} color={userType === 'restaurant_owner' ? Colors.primary : Colors.textMuted} />
                <Text style={[
                  styles.userTypeText,
                  userType === 'restaurant_owner' && styles.userTypeTextActive,
                ]}>Restaurant</Text>
                <Text style={styles.userTypeDesc}>Manage your inventory</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.form}>
            {isSignUp && (
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <User size={20} color={Colors.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(v) => handleChange('name', v)}
                  placeholder={userType === 'restaurant_owner' ? 'Restaurant Name' : 'Full Name'}
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Mail size={20} color={Colors.textMuted} />
              </View>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(v) => handleChange('email', v)}
                placeholder="Email"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Lock size={20} color={Colors.textMuted} />
              </View>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(v) => handleChange('password', v)}
                placeholder="Password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={Colors.textMuted} />
                ) : (
                  <Eye size={20} color={Colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>

            {!isSignUp && (
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            <View style={styles.submitButton}>
              <Button
                title={isSignUp ? 'Create Account' : 'Sign In'}
                onPress={handleSubmit}
                loading={isLoginLoading || isRegisterLoading}
                fullWidth
                size="large"
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={styles.footerLink}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.skipText}>Continue as Guest</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.primary,
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: Colors.textSecondary,
  },
  userTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  userTypeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  userTypeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  userTypeText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginTop: 8,
  },
  userTypeTextActive: {
    color: Colors.primary,
  },
  userTypeDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginBottom: 16,
    paddingHorizontal: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 16,
  },
  eyeButton: {
    padding: 8,
    marginRight: -8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  submitButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  footerText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipText: {
    fontSize: 15,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  // ─── Email Confirmation Styles ─────────────────────────────────
  confirmationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  confirmationIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  confirmationTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  confirmationEmail: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmationBody: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
    paddingHorizontal: 16,
  },
  confirmationActions: {
    width: '100%',
    alignItems: 'center',
  },
  resendButton: {
    marginTop: 20,
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
});
