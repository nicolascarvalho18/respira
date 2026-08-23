import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MoodValue } from '../../types';
import { getMoodColor, getMoodEmoji, getMoodLabel } from '../../utils/format';
import { useTheme } from '../../hooks/useTheme';

export interface MoodSelectorProps {
  value: MoodValue;
  onChange: (value: MoodValue) => void;
  disabled?: boolean;
}

const MOODS: MoodValue[] = [1, 2, 3, 4, 5];

export const MoodSelector: React.FC<MoodSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Como está seu humor?</Text>
      <Text style={[styles.selectedLabel, { color: getMoodColor(value) }]}>
        {getMoodLabel(value)}
      </Text>

      <View style={styles.row}>
        {MOODS.map((mood) => {
          const isSelected = value === mood;
          const moodColor = getMoodColor(mood);

          return (
            <TouchableOpacity
              key={mood}
              disabled={disabled}
              onPress={() => onChange(mood)}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityLabel={`Humor ${mood} de 5: ${getMoodLabel(mood)}`}
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.moodButton,
                {
                  backgroundColor: isSelected
                    ? isDark
                      ? '#2A3B3C'
                      : colors.highlight
                    : isDark
                      ? colors.surfaceSubtle
                      : '#FFFFFF',
                  borderColor: isSelected ? moodColor : colors.border,
                  borderWidth: isSelected ? 2.5 : 1,
                  transform: [{ scale: isSelected ? 1.08 : 1 }],
                },
              ]}
            >
              <Text style={styles.emoji}>{getMoodEmoji(mood)}</Text>
              <Text
                style={[
                  styles.numberLabel,
                  {
                    color: isSelected ? moodColor : colors.textMuted,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {mood}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  selectedLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodButton: {
    width: 58,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  emoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  numberLabel: {
    fontSize: 12,
  },
});
