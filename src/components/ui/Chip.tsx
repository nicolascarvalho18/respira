import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  count?: number;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  count,
  icon,
  size = 'md',
  style,
  accessibilityLabel,
}) => {
  const { colors, isDark } = useTheme();

  const isSmall = size === 'sm';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel || `${label}${selected ? ', selecionado' : ''}`}
      style={[
        styles.chip,
        {
          paddingVertical: isSmall ? 6 : 8,
          paddingHorizontal: isSmall ? 12 : 16,
          minHeight: isSmall ? 34 : 40,
          backgroundColor: selected
            ? colors.primary
            : isDark
              ? colors.surfaceSecondary
              : '#FFFFFF',
          borderColor: selected ? colors.primary : colors.border,
        },
        Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined,
        style,
      ]}
    >
      {icon && <>{icon}</>}
      <Text
        style={[
          styles.text,
          {
            fontSize: isSmall ? 12 : 14,
            fontWeight: selected ? '700' : '500',
            color: selected ? '#FFFFFF' : colors.text,
            marginLeft: icon ? 6 : 0,
            marginRight: count !== undefined ? 6 : 0,
          },
        ]}
      >
        {label}
      </Text>
      {count !== undefined && (
        <Text
          style={[
            styles.countBadge,
            {
              backgroundColor: selected ? 'rgba(255, 255, 255, 0.25)' : colors.surfaceSecondary,
              color: selected ? '#FFFFFF' : colors.textMuted,
            },
          ]}
        >
          {count}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
    marginVertical: 4,
  },
  text: {
    textAlign: 'center',
  },
  countBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
});
