import React from 'react';
import {
  TouchableOpacity,
  View,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SHADOWS } from '../../constants/theme';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'bordered' | 'flat' | 'interactive';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  accessibilityLabel?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'bordered',
  onPress,
  style,
  padding = 'md',
  accessibilityLabel,
}) => {
  const { colors, isDark } = useTheme();

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return 12;
      case 'lg':
        return 20;
      default:
        return 16;
    }
  };

  const getCardStyle = (): ViewStyle => {
    const base: ViewStyle = {
      backgroundColor: isDark ? colors.surface : '#FFFFFF',
      borderRadius: 16,
      padding: getPadding(),
    };

    if (variant === 'elevated') {
      return {
        ...base,
        borderWidth: 1,
        borderColor: colors.border,
        ...(SHADOWS.sm as any),
      };
    } else if (variant === 'bordered' || variant === 'interactive') {
      return {
        ...base,
        borderWidth: 1,
        borderColor: colors.border,
      };
    } else {
      return {
        ...base,
        backgroundColor: isDark ? colors.surfaceSecondary : colors.surfaceSecondary,
      };
    }
  };

  if (onPress || variant === 'interactive') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[
          getCardStyle(),
          Platform.OS === 'web' ? ({ cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' } as any) : undefined,
          style,
        ]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[getCardStyle(), style]}>{children}</View>;
};
