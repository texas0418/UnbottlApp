import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import Colors from '@/constants/colors';
import { GlossaryEntry } from '@/constants/glossary';
import { segmentByGlossary } from '@/utils/glossaryMatch';
import GlossaryDefinition from '@/components/GlossaryDefinition';

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

      <GlossaryDefinition entry={open} onClose={() => setOpen(null)} />
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
});
