import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { colors, isDark } = useTheme();
  const isClickingRef = useRef(false);

  const handlePress = async () => {
    if (disabled || isLoading || isClickingRef.current) return;
    isClickingRef.current = true;
    try {
      await onPress();
    } finally {
      setTimeout(() => {
        isClickingRef.current = false;
      }, 400);
    }
  };

  const getContainerStyle = (): ViewStyle => {
    let bg: string;
    let borderColor = 'transparent';
    let borderWidth = 0;

    switch (variant) {
      case 'primary':
        bg = colors.primary;
        break;
      case 'secondary':
        bg = isDark ? colors.surfaceSecondary : colors.secondaryLight;
        break;
      case 'outline':
        bg = 'transparent';
        borderColor = colors.borderStrong;
        borderWidth = 1.5;
        break;
      case 'ghost':
        bg = 'transparent';
        break;
      case 'danger':
        bg = colors.error;
        break;
    }

    if (disabled) {
      bg = isDark ? '#263133' : '#E2E8F0';
      borderColor = 'transparent';
    }

    let paddingVertical = 12;
    let paddingHorizontal = 20;
    let minHeight = 48;
    let borderRadius = 14;

    if (size === 'sm') {
      paddingVertical = 8;
      paddingHorizontal = 14;
      minHeight = 36;
      borderRadius = 10;
    } else if (size === 'lg') {
      paddingVertical = 16;
      paddingHorizontal = 24;
      minHeight = 54;
      borderRadius = 18;
    }

    return {
      backgroundColor: bg,
      borderColor,
      borderWidth,
      paddingVertical,
      paddingHorizontal,
      minHeight,
      borderRadius,
      alignSelf: fullWidth ? 'stretch' : 'auto',
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getTextColor = (): string => {
    if (disabled) return isDark ? '#6C7E81' : '#94A3B8';

    switch (variant) {
      case 'primary':
      case 'danger':
        return '#FFFFFF';
      case 'secondary':
        return colors.primaryDark;
      case 'outline':
      case 'ghost':
        return colors.primary;
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'sm':
        return 13;
      case 'lg':
        return 16;
      default:
        return 15;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled || isLoading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
      style={[
        styles.buttonBase,
        getContainerStyle(),
        Platform.OS === 'web' ? ({ cursor: disabled || isLoading ? 'not-allowed' : 'pointer' } as any) : undefined,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {leftIcon && <>{leftIcon}</>}
          <Text
            style={[
              styles.textBase,
              {
                color: getTextColor(),
                fontSize: getFontSize(),
                fontWeight: size === 'lg' ? '700' : '600',
                marginLeft: leftIcon ? 8 : 0,
                marginRight: rightIcon ? 8 : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <>{rightIcon}</>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBase: {
    textAlign: 'center',
  },
});
