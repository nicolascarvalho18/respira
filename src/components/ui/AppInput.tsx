import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...props
}) => {
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!error;

  let borderColor = colors.border;
  if (hasError) {
    borderColor = colors.error;
  } else if (isFocused) {
    borderColor = colors.primary;
  }

  return (
    <View style={[{ marginBottom: 16, width: '100%' }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
          borderWidth: isFocused || hasError ? 1.5 : 1,
          borderColor,
          borderRadius: 16,
          paddingHorizontal: 14,
          minHeight: 50,
        }}
      >
        {leftIcon && <View style={{ marginRight: 10 }}>{leftIcon}</View>}

        <TextInput
          placeholderTextColor={colors.textLight}
          style={[
            {
              flex: 1,
              color: colors.text,
              fontSize: 15,
              paddingVertical: 12,
            },
            inputStyle,
          ]}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          accessibilityLabel={label || props.placeholder}
          accessibilityHint={helperText}
          {...props}
        />

        {rightIcon && <View style={{ marginLeft: 10 }}>{rightIcon}</View>}
      </View>

      {hasError ? (
        <Text
          accessibilityRole="alert"
          style={{
            color: colors.error,
            fontSize: 12,
            marginTop: 4,
            marginLeft: 4,
          }}
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text
          style={{
            color: colors.textMuted,
            fontSize: 12,
            marginTop: 4,
            marginLeft: 4,
          }}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};
