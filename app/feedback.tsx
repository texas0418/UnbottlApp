import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  Bug,
  Lightbulb,
  MessageSquare,
  Send,
  CheckCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

type FeedbackType = 'bug' | 'feature' | 'general';

const FEEDBACK_TYPES: { key: FeedbackType; label: string; icon: any; color: string; description: string }[] = [
  {
    key: 'bug',
    label: 'Bug Report',
    icon: Bug,
    color: Colors.error,
    description: 'Something isn\'t working right',
  },
  {
    key: 'feature',
    label: 'Feature Request',
    icon: Lightbulb,
    color: '#F59E0B',
    description: 'I\'d love to see this added',
  },
  {
    key: 'general',
    label: 'General Feedback',
    icon: MessageSquare,
    color: '#3B82F6',
    description: 'Thoughts, suggestions, or praise',
  },
];

export default function FeedbackScreen() {
  const router = useRouter();
  const { user, isAuthenticated, userType } = useAuth();
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSelectType = (type: FeedbackType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFeedbackType(type);
  };

  const handleSubmit = async () => {
    if (!feedbackType) {
      Alert.alert('Select Type', 'Please select a feedback type.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Message Required', 'Please describe your feedback.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('feedback').insert({
        user_id: user?.id || null,
        user_email: contactEmail.trim() || null,
        user_type: isAuthenticated ? userType : 'guest',
        feedback_type: feedbackType,
        subject: subject.trim() || null,
        message: message.trim(),
        app_version: '1.0.0',
        platform: Platform.OS,
      });

      if (error) throw error;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setSubmitted(true);
    } catch (error: any) {
      console.error('Feedback submission error:', error);
      Alert.alert(
        'Submission Failed',
        'We couldn\'t send your feedback right now. Please try again or email us at support@unbottl.com.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFeedbackType(null);
    setSubject('');
    setMessage('');
    setSubmitted(false);
  };

  // ── Success screen ──
  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Send Feedback</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.successContainer}>
          <View style={styles.successIconWrapper}>
            <CheckCircle size={56} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Thank You!</Text>
          <Text style={styles.successMessage}>
            Your feedback has been received. We read every submission and use it to make Unbottl better.
          </Text>
          {contactEmail ? (
            <Text style={styles.successNote}>
              We may follow up at {contactEmail} if we have questions.
            </Text>
          ) : null}

          <TouchableOpacity style={styles.submitAnotherButton} onPress={handleReset}>
            <Text style={styles.submitAnotherText}>Submit Another</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Feedback form ──
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Feedback</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Intro */}
          <Text style={styles.introText}>
            Help us improve Unbottl! Report a bug, request a feature, or share your thoughts.
          </Text>

          {/* Feedback type selector */}
          <Text style={styles.label}>What kind of feedback?</Text>
          <View style={styles.typeContainer}>
            {FEEDBACK_TYPES.map((type) => {
              const isSelected = feedbackType === type.key;
              return (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeCard,
                    isSelected && { borderColor: type.color, backgroundColor: type.color + '08' },
                  ]}
                  onPress={() => handleSelectType(type.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.typeIcon, { backgroundColor: type.color + '15' }]}>
                    <type.icon
                      size={22}
                      color={isSelected ? type.color : Colors.textMuted}
                    />
                  </View>
                  <View style={styles.typeContent}>
                    <Text style={[styles.typeLabel, isSelected && { color: type.color }]}>
                      {type.label}
                    </Text>
                    <Text style={styles.typeDescription}>{type.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Subject */}
          <Text style={styles.label}>
            Subject <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder={
              feedbackType === 'bug'
                ? 'e.g. App crashes when scanning a label'
                : feedbackType === 'feature'
                  ? 'e.g. Add sorting options for inventory'
                  : 'Brief summary'
            }
            placeholderTextColor={Colors.textMuted}
            value={subject}
            onChangeText={setSubject}
            maxLength={120}
            returnKeyType="next"
          />

          {/* Message */}
          <Text style={styles.label}>
            Details <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={
              feedbackType === 'bug'
                ? 'What happened? What were you doing when the issue occurred? Any steps to reproduce?'
                : feedbackType === 'feature'
                  ? 'Describe the feature you\'d like and how it would help you...'
                  : 'Tell us what\'s on your mind...'
            }
            placeholderTextColor={Colors.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text style={styles.charCount}>{message.length}/2000</Text>

          {/* Contact email (pre-filled for authenticated users) */}
          {!isAuthenticated && (
            <>
              <Text style={styles.label}>
                Email <Text style={styles.optional}>(optional, for follow-up)</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textMuted}
                value={contactEmail}
                onChangeText={setContactEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </>
          )}

          {/* Submit button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!feedbackType || !message.trim() || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!feedbackType || !message.trim() || isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Send size={18} color={Colors.white} />
                <Text style={styles.submitText}>Send Feedback</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            You can also email us directly at support@unbottl.com
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  introText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  optional: {
    fontWeight: '400',
    color: Colors.textMuted,
    fontSize: 13,
  },
  required: {
    color: Colors.error,
  },
  typeContainer: {
    gap: 10,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeContent: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  typeDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 140,
    paddingTop: 14,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 28,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
  // ── Success screen ──
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.success + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  successNote: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  submitAnotherButton: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  submitAnotherText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  doneText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
