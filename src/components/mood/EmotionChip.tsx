import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface EmotionChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const EmotionChip: React.FC<EmotionChipProps> = ({
  label,
  selected = false,
  onPress,
  disabled = false,
  style,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      style={[
        styles.chip,
        {
          backgroundColor: selected
            ? isDark
              ? '#2A3D3E'
              : colors.highlight
            : isDark
              ? colors.surfaceSubtle
              : '#FFFFFF',
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: selected ? 1.5 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: selected ? colors.primary : colors.text,
            fontWeight: selected ? '700' : '500',
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
  },
});
