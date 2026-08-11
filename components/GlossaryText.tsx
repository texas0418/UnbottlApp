import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextStyle, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fontFamily } from '@/constants/theme';
import { GlossaryEntry } from '@/constants/glossary';
import { segmentByGlossary } from '@/utils/glossaryMatch';

interface GlossaryTextProps {
  /** Whatever the venue typed — "Cabernet Sauvignon, Merlot". */
  text: string | null | undefined;
  /** Style for the line as a whole. Matched terms inherit it. */
  style?: TextStyle | TextStyle[];
  numberOfLines?: number;
}

/**
 * Renders a menu string with any recognised term made tappable.
 *
 * The point is the moment of not-knowing: someone is looking at "Grenache,
 * Cinsault, Rolle" with a waiter standing there. A general drinks app cannot
 * help, because it does not know what is on the table. This does.
 *
 * Unmatched text renders exactly as before, so putting this in place of a
 * <Text> is safe on strings with nothing to define — which is most of them.
 */
export default function GlossaryText({ text, style, numberOfLines }: GlossaryTextProps) {
  const [open, setOpen] = useState<GlossaryEntry | null>(null);
  const segments = useMemo(() => segmentByGlossary(text ?? ''), [text]);

  if (!text) return null;

  const show = (entry: GlossaryEntry) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setOpen(entry);
  };

  return (
    <>
      <Text style={style} numberOfLines={numberOfLines}>
        {segments.map((seg, i) =>
          seg.entry ? (
            <Text
              // Index is stable here: segments are derived from `text`, and if
              // `text` changes the whole line re-renders anyway.
              key={i}
              style={styles.term}
              onPress={() => show(seg.entry as GlossaryEntry)}
              suppressHighlighting
              accessibilityRole="button"
              accessibilityLabel={`${seg.text}. Double tap for a definition.`}
            >
              {seg.text}
            </Text>
          ) : (
            <Text key={i}>{seg.text}</Text>
          ),
        )}
      </Text>

      <Modal
        visible={open !== null}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setOpen(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(null)}>
          {/* Stops a tap inside the card closing it. */}
          <Pressable style={styles.card} onPress={() => {}}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTerm}>{open?.term}</Text>
                <Text style={styles.cardCategory}>{open?.category}</Text>
              </View>
              <Pressable
                onPress={() => setOpen(null)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Close definition"
              >
                <X size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.cardDefinition}>{open?.definition}</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Restrained on purpose. A menu should not look like a page of hyperlinks;
  // the underline is there for anyone who goes looking.
  term: {
    color: Colors.primary,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardHeaderText: {
    flex: 1,
    gap: 2,
  },
  cardTerm: {
    fontFamily: fontFamily.displaySemibold,
    fontSize: 24,
    color: Colors.text,
  },
  cardCategory: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: Colors.textMuted,
  },
  cardDefinition: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
});
