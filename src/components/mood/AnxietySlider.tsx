import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { getAnxietyDescription } from '../../utils/format';
import { useTheme } from '../../hooks/useTheme';

export interface AnxietySliderProps {
  value: number; // 0 to 10
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const AnxietySlider: React.FC<AnxietySliderProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { colors, isDark } = useTheme();

  const getTrackColor = (val: number) => {
    if (val <= 2) return colors.primary;
    if (val <= 5) return colors.secondary;
    if (val <= 7) return colors.warning;
    return colors.error;
  };

  const currentColor = getTrackColor(value);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: colors.text }]}>Nível de Ansiedade</Text>
        <View style={[styles.badge, { backgroundColor: isDark ? '#2D2A28' : '#FFF5F0', borderColor: currentColor }]}>
          <Text style={[styles.valueText, { color: currentColor }]}>
            {value} / 10 • {getAnxietyDescription(value)}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.numbersRow}
      >
        {Array.from({ length: 11 }, (_, i) => i).map((num) => {
          const isSelected = value === num;
          const numColor = getTrackColor(num);

          return (
            <TouchableOpacity
              key={num}
              disabled={disabled}
              onPress={() => onChange(num)}
              accessibilityRole="radio"
              accessibilityLabel={`Nível de ansiedade ${num} de 10: ${getAnxietyDescription(num)}`}
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.stepButton,
                {
                  backgroundColor: isSelected
                    ? numColor
                    : isDark
                      ? colors.surfaceSubtle
                      : '#FFFFFF',
                  borderColor: isSelected ? numColor : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.stepText,
                  {
                    color: isSelected ? '#FFFFFF' : colors.text,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {num}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.scaleHints}>
        <Text style={[styles.hintText, { color: colors.textMuted }]}>0 (Tranquilo)</Text>
        <Text style={[styles.hintText, { color: colors.textMuted }]}>5 (Moderado)</Text>
        <Text style={[styles.hintText, { color: colors.textMuted }]}>10 (Intenso)</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '700',
  },
  numbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  stepButton: {
    width: 38,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 14,
  },
  scaleHints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  hintText: {
    fontSize: 11,
  },
});
