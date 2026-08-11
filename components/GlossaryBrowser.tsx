import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { BookOpen } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fontFamily } from '@/constants/theme';
import { glossary, GlossaryCategory, GlossaryEntry } from '@/constants/glossary';
import GlossaryDefinition from '@/components/GlossaryDefinition';

const GROUPS: { key: GlossaryCategory; label: string }[] = [
  { key: 'grape', label: 'Grapes' },
  { key: 'spirit', label: 'Spirits' },
  { key: 'style', label: 'Styles' },
  { key: 'character', label: 'Wine words' },
];

/**
 * Something to read on the start page when there is no menu to show.
 *
 * A guest who has not scanned anything has no drinks to browse — that is the
 * design, since Unbottl shows one venue's list rather than a global catalogue.
 * But an app that opens on an empty screen looks broken, and App Store review
 * sees exactly that view with no QR code to scan.
 *
 * These are the same entries that make menu terms tappable, so this costs no
 * new content and nothing here can drift out of step with what a menu explains.
 */
export default function GlossaryBrowser() {
  const [group, setGroup] = useState<GlossaryCategory>('grape');
  const [open, setOpen] = useState<GlossaryEntry | null>(null);

  const entries = useMemo(() => glossary.filter((e) => e.category === group), [group]);

  const pick = (entry: GlossaryEntry) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setOpen(entry);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <BookOpen size={16} color={Colors.primary} />
        <Text style={styles.title}>Know what you are ordering</Text>
      </View>
      <Text style={styles.subtitle}>
        The words that turn up on most drinks lists, in plain language.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {GROUPS.map((g) => {
          const selected = g.key === group;
          const count = glossary.filter((e) => e.category === g.key).length;
          return (
            <TouchableOpacity
              key={g.key}
              style={[styles.tab, selected && styles.tabSelected]}
              onPress={() => setGroup(g.key)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${g.label}, ${count} entries`}
            >
              <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.list}>
        {entries.map((entry, i) => (
          <TouchableOpacity
            key={entry.term}
            style={[styles.row, i < entries.length - 1 && styles.rowDivider]}
            onPress={() => pick(entry)}
            accessibilityRole="button"
            accessibilityLabel={`${entry.term}. Opens a definition.`}
          >
            <Text style={styles.rowTerm}>{entry.term}</Text>
            {/* One line here on purpose — the card carries the whole thing.
                A wall of two-line rows is a document, not a list you scan. */}
            <Text style={styles.rowHint} numberOfLines={1}>
              {entry.definition}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <GlossaryDefinition entry={open} onClose={() => setOpen(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: {
    fontFamily: fontFamily.displaySemibold,
    fontSize: 20,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: -4,
  },
  tabs: { gap: 8, paddingVertical: 4 },
  tab: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '600' as const, color: Colors.textSecondary },
  tabTextSelected: { color: Colors.white },
  list: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  row: { minHeight: 60, justifyContent: 'center', paddingVertical: 12, gap: 2 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  rowTerm: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
  rowHint: { fontSize: 13, color: Colors.textMuted },
});
