import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Send, Wine, Sparkles, MessageCircle } from 'lucide-react-native';
import { createRorkTool, useRorkAgent } from '@/services/ai-toolkit';
import { z } from 'zod';
import Colors from '@/constants/colors';
import { useWines } from '@/contexts/WineContext';
import { useBeverages } from '@/contexts/BeverageContext';
import { Wine as WineType } from '@/types';

const QUICK_PROMPTS = [
  "I'm in the mood for something light and refreshing",
  "Recommend a bold red wine for steak",
  "What pairs well with seafood?",
  "I want something sweet for dessert",
  "Suggest a craft cocktail",
  "What's your best non-alcoholic option?",
];

export default function SommelierChatScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [input, setInput] = useState('');
  const { wines } = useWines();
  const { beers, spirits, cocktails, nonAlcoholic } = useBeverages();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // FIX: Add null-safe fallbacks to prevent "Cannot read property 'map' of undefined"
  const allBeverages = [
    ...(wines || []).map(w => ({ ...w, category: 'wine' as const })),
    ...(beers || []).map(b => ({ ...b, category: 'beer' as const })),
    ...(spirits || []).map(s => ({ ...s, category: 'spirit' as const })),
    ...(cocktails || []).map(c => ({ ...c, category: 'cocktail' as const })),
    ...(nonAlcoholic || []).map(n => ({ ...n, category: 'non-alcoholic' as const })),
  ];

  const beverageContext = allBeverages.map(b => {
    if (b.category === 'wine') {
      const wine = b as WineType & { category: 'wine' };
      // FIX: Add null-safe fallback for foodPairings.join()
      return `Wine: ${wine.name} by ${wine.producer} - ${wine.type}, ${wine.region}, ${wine.country}. ${wine.tastingNotes}. Price: $${wine.price}. Pairs with: ${(wine.foodPairings || []).join(', ')}. ${wine.inStock ? 'In stock' : 'Out of stock'}`;
    }
    if (b.category === 'beer') {
      return `Beer: ${b.name} by ${b.brewery} - ${b.type} ${b.style}. ABV: ${b.abv}%. ${b.description}. Price: $${b.price}. ${b.inStock ? 'In stock' : 'Out of stock'}`;
    }
    if (b.category === 'spirit') {
      return `Spirit: ${b.name} by ${b.brand} - ${b.type}. ABV: ${b.abv}%. ${b.description}. Price: $${b.price}. ${b.inStock ? 'In stock' : 'Out of stock'}`;
    }
    if (b.category === 'cocktail') {
      return `Cocktail: ${b.name} - ${b.type}. Base: ${b.baseSpirit}. ${b.description}. Price: $${b.price}. ${b.isAvailable ? 'Available' : 'Not available'}`;
    }
    return `Non-Alcoholic: ${b.name} - ${b.type}. ${b.description}. Price: $${b.price}. ${b.inStock ? 'In stock' : 'Out of stock'}`;
  }).join('\n');

  const systemPrompt = `You are an expert AI sommelier helping restaurant customers find the perfect beverage. You have deep knowledge of wines, beers, spirits, cocktails, and non-alcoholic drinks.

Available beverages at this restaurant:
${beverageContext}

Guidelines:
- Be warm, conversational, and helpful
- Ask clarifying questions about preferences (taste, occasion, food pairing, budget)
- Only recommend beverages that are in stock/available
- Provide 2-3 specific recommendations with brief explanations
- Share interesting facts about your recommendations
- If asked about food pairings, suggest beverages that complement the dish
- For non-drinkers, enthusiastically suggest non-alcoholic options
- Keep responses concise but informative`;

  const { messages, sendMessage, status } = useRorkAgent({
    tools: {
      recommendBeverage: createRorkTool({
        description: `Recommend a specific beverage from the menu. ${systemPrompt}`,
        zodSchema: z.object({
          beverageName: z.string().describe('Name of the recommended beverage'),
          category: z.enum(['wine', 'beer', 'spirit', 'cocktail', 'non-alcoholic']),
          reason: z.string().describe('Why this beverage is recommended'),
        }),
        execute(input) {
          console.log('Recommending beverage:', input);
          return JSON.stringify({ success: true, recommendation: input });
        },
      }),
    },
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput('');
    sendMessage(message);
  }, [input, isLoading, sendMessage]);

  const handleQuickPrompt = useCallback((prompt: string) => {
    if (isLoading) return;
    sendMessage(prompt);
  }, [isLoading, sendMessage]);

  const renderMessage = (message: typeof messages[0], index: number) => {
    const isUser = message.role === 'user';
    return (
      <View
        key={message.id || index}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Wine size={18} color={Colors.white} />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userText : styles.assistantText,
            ]}
          >
            {message.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            testID="close-button"
          >
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerIcon}>
              <Wine size={20} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.headerTitle}>AI Sommelier</Text>
              <Text style={styles.headerSubtitle}>Your personal beverage guide</Text>
            </View>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.welcomeContainer}>
                <View style={styles.welcomeIcon}>
                  <MessageCircle size={40} color={Colors.primary} />
                </View>
                <Text style={styles.welcomeTitle}>
                  Hello! I&apos;m your AI Sommelier
                </Text>
                <Text style={styles.welcomeText}>
                  Tell me what you&apos;re in the mood for, what you&apos;re eating, or ask for recommendations. I&apos;ll help you find the perfect drink!
                </Text>
                <View style={styles.quickPromptsContainer}>
                  <Text style={styles.quickPromptsTitle}>Try asking:</Text>
                  <View style={styles.quickPrompts}>
                    {QUICK_PROMPTS.map((prompt, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.quickPromptButton}
                        onPress={() => handleQuickPrompt(prompt)}
                        disabled={isLoading}
                      >
                        <Text style={styles.quickPromptText}>{prompt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              messages.map((message, index) => renderMessage(message, index))
            )}

            {isLoading && (
              <View style={[styles.messageContainer, styles.assistantMessageContainer]}>
                <View style={styles.avatarContainer}>
                  <Wine size={18} color={Colors.white} />
                </View>
                <View style={[styles.messageBubble, styles.assistantBubble, styles.typingBubble]}>
                  <View style={styles.typingIndicator}>
                    <View style={[styles.typingDot, styles.typingDot1]} />
                    <View style={[styles.typingDot, styles.typingDot2]} />
                    <View style={[styles.typingDot, styles.typingDot3]} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Describe what you're in the mood for..."
                placeholderTextColor={Colors.textMuted}
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={500}
                editable={!isLoading}
                testID="chat-input"
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!input.trim() || isLoading) && styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={!input.trim() || isLoading}
                testID="send-button"
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Send size={20} color={Colors.white} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  headerSpacer: {
    width: 40,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  quickPromptsContainer: {
    width: '100%',
  },
  quickPromptsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickPrompts: {
    gap: 8,
  },
  quickPromptButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickPromptText: {
    fontSize: 14,
    color: Colors.text,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: Colors.white,
  },
  assistantText: {
    color: Colors.text,
  },
  recommendationCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  recommendationTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recommendationName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  recommendationReason: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  typingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 0.8,
  },
  inputContainer: {
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: Colors.background,
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },
});
