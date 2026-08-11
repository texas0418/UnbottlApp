import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '@/constants/colors';

interface FlavorLevelSliderProps {
  label: string;
  /** Current level, 1 to 5. */
  value: number;
  leftLabel: string;
  rightLabel: string;
  onChange: (level: number) => void;
}

/**
 * A five-dot intensity picker: Light to Full, Dry to Sweet.
 *
 * Lifted out of PreferencesSetup, which had grown past the 300-line function
 * limit. It is a self-contained control with no reason to live inside a
 * four-step wizard, and pulling it out makes the sheet readable again.
 *
 * Not to be confused with FlavorProfileSlider, which is the two-thumbed *range*
 * filter on the menu-preview screen. This one picks a single level.
 */
export default function FlavorLevelSlider({
  label,
  value,
  leftLabel,
  rightLabel,
  onChange,
}: FlavorLevelSliderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.dot, value >= n && styles.dotActive]}
            onPress={() => onChange(n)}
            // The dot is 24pt inside a 32pt track. Apple's minimum touch target
            // is 44, so roughly half of every near-miss landed on the track
            // instead of the dot and nothing happened — the "dots don't always
            // turn on or off on first touch" report. The dots are laid out
            // space-between across the sheet, so the widened regions have room
            // and do not overlap each other.
            hitSlop={{ top: 10, bottom: 10, left: 14, right: 14 }}
            accessibilityRole="adjustable"
            accessibilityLabel={`${label}, ${leftLabel} to ${rightLabel}`}
            accessibilityValue={{ min: 1, max: 5, now: value }}
            accessibilityHint={`Sets ${label.toLowerCase()} to ${n} of 5`}
          />
        ))}
      </View>
      <View style={styles.labels}>
        <Text style={styles.minMax}>{leftLabel}</Text>
        <Text style={styles.minMax}>{rightLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  label: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  track: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 32,
    backgroundColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 8,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  dotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  minMax: { fontSize: 12, color: Colors.textMuted },
});
