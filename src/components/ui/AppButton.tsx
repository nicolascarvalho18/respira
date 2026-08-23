import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = true,
  disabled,
  style,
  textStyle,
  ...props
}) => {
  const { colors, isDark } = useTheme();

  // Dimensões por tamanho
  const sizeStyles: Record<ButtonSize, { py: number; px: number; fontSize: number; radius: number }> = {
    sm: { py: 8, px: 14, fontSize: 13, radius: 12 },
    md: { py: 14, px: 20, fontSize: 15, radius: 16 },
    lg: { py: 18, px: 24, fontSize: 16, radius: 20 },
  };

  const currentSize = sizeStyles[size];

  // Cores por variante
  let bg = colors.primary;
  let text = '#FFFFFF';
  let border = 'transparent';
  let borderWidth = 0;

  if (variant === 'secondary') {
    bg = colors.highlight;
    text = colors.primary;
  } else if (variant === 'outline') {
    bg = 'transparent';
    text = colors.primary;
    border = colors.borderStrong;
    borderWidth = 1.5;
  } else if (variant === 'ghost') {
    bg = 'transparent';
    text = colors.text;
  } else if (variant === 'danger') {
    bg = colors.error;
    text = '#FFFFFF';
  }

  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      style={[
        {
          backgroundColor: isDisabled ? (isDark ? '#2D3740' : '#E2E8F0') : bg,
          borderColor: border,
          borderWidth,
          paddingVertical: currentSize.py,
          paddingHorizontal: currentSize.px,
          borderRadius: currentSize.radius,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          alignSelf: fullWidth ? 'stretch' : 'auto',
          minHeight: 44, // Altura mínima de toque acessível (WCAG)
          opacity: isDisabled ? 0.6 : 1,
        },
        style,
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={text} size="small" />
      ) : (
        <>
          {leftIcon && <>{leftIcon}</>}
          <Text
            style={[
              {
                color: isDisabled ? (isDark ? '#66737D' : '#94A3B8') : text,
                fontSize: currentSize.fontSize,
                fontWeight: '600',
                marginLeft: leftIcon ? 8 : 0,
                marginRight: rightIcon ? 8 : 0,
                textAlign: 'center',
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
