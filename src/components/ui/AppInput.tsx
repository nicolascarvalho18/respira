import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TextInputProps,
  ViewStyle,
  TextStyle,
  Platform,
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
  id?: string;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  id,
  onFocus,
  onBlur,
  editable = true,
  readOnly,
  ...props
}) => {
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const inputId = id || (label ? `input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined);
  const errorId = inputId ? `${inputId}-error` : undefined;
  const helperId = inputId ? `${inputId}-helper` : undefined;

  const isActuallyDisabled = editable === false || readOnly === true;
  const hasError = !!error;

  let borderColor = colors.border;
  if (hasError) {
    borderColor = colors.error;
  } else if (isFocused) {
    borderColor = colors.primary;
  }

  const describedBy = hasError ? errorId : helperText ? helperId : undefined;

  return (
    <View style={[{ marginBottom: 16, width: '100%' }, containerStyle]}>
      {label && (
        <Text
          nativeID={inputId ? `${inputId}-label` : undefined}
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: isDark ? colors.text : '#173D3B',
            marginBottom: 6,
          }}
          {...(Platform.OS === 'web' && inputId ? { htmlFor: inputId } as any : {})}
        >
          {label}
        </Text>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isActuallyDisabled
            ? isDark
              ? colors.surfaceSecondary
              : '#F2F6F5'
            : isDark
            ? colors.surfaceSubtle
            : '#FFFFFF',
          borderWidth: isFocused || hasError ? 1.5 : 1,
          borderColor,
          borderRadius: 16,
          paddingHorizontal: 14,
          minHeight: 50,
          opacity: isActuallyDisabled ? 0.85 : 1,
        }}
      >
        {leftIcon && <View style={{ marginRight: 10 }}>{leftIcon}</View>}

        <TextInput
          id={inputId}
          nativeID={inputId}
          placeholderTextColor={colors.textLight}
          editable={!isActuallyDisabled}
          readOnly={isActuallyDisabled}
          style={[
            {
              flex: 1,
              color: isActuallyDisabled
                ? isDark
                  ? colors.textMuted
                  : '#567571'
                : colors.text,
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
          aria-labelledby={label && inputId ? `${inputId}-label` : undefined}
          aria-describedby={describedBy}
          aria-invalid={hasError}
          {...props}
        />

        {rightIcon && <View style={{ marginLeft: 10 }}>{rightIcon}</View>}
      </View>

      {hasError ? (
        <Text
          id={errorId}
          nativeID={errorId}
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
          id={helperId}
          nativeID={helperId}
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
