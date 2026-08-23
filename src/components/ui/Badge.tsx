import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  icon,
  size = 'md',
  style,
}) => {
  const { colors, isDark } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: isDark ? colors.highlight : '#DDEFEA',
          text: colors.primaryDark,
        };
      case 'success':
        return {
          bg: isDark ? colors.successLight : '#E8F5EF',
          text: colors.success,
        };
      case 'warning':
        return {
          bg: isDark ? colors.warningLight : '#FDF2EC',
          text: colors.warning,
        };
      case 'error':
        return {
          bg: isDark ? colors.errorLight : '#FDF0F0',
          text: colors.error,
        };
      case 'info':
        return {
          bg: isDark ? colors.infoLight : '#EDF4F9',
          text: colors.info,
        };
      default:
        return {
          bg: isDark ? colors.surfaceSecondary : '#EEF4F2',
          text: colors.textSecondary,
        };
    }
  };

  const isSmall = size === 'sm';
  const c = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: c.bg,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 8 : 10,
          borderRadius: isSmall ? 6 : 8,
        },
        style,
      ]}
    >
      {icon && <>{icon}</>}
      <Text
        style={[
          styles.text,
          {
            color: c.text,
            fontSize: isSmall ? 11 : 12,
            marginLeft: icon ? 4 : 0,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
