import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fontFamily } from '@/constants/theme';
import { GlossaryEntry } from '@/constants/glossary';

interface GlossaryDefinitionProps {
  /** The entry to show, or null to stay closed. */
  entry: GlossaryEntry | null;
  onClose: () => void;
}

/**
 * The definition card, shared by the tappable terms inside a menu and the
 * browser on the start page, so a word reads identically wherever it is met.
 */
export default function GlossaryDefinition({ entry, onClose }: GlossaryDefinitionProps) {
  return (
    <Modal
      visible={entry !== null}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Swallows taps inside the card so it does not close under your finger. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.term}>{entry?.term}</Text>
              <Text style={styles.category}>{entry?.category}</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close definition"
            >
              <X size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>
          <Text style={styles.definition}>{entry?.definition}</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: { flex: 1, gap: 2 },
  term: {
    fontFamily: fontFamily.displaySemibold,
    fontSize: 24,
    color: Colors.text,
  },
  category: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: Colors.textMuted,
  },
  definition: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
});
