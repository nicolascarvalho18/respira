import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface AppTextareaProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  maxLength?: number;
  minHeight?: number;
  error?: string;
  helperText?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const AppTextarea: React.FC<AppTextareaProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  maxLength = 500,
  minHeight = 100,
  error,
  helperText,
  style,
  inputStyle,
  accessibilityLabel,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          {maxLength && (
            <Text style={[styles.counter, { color: colors.textMuted }]}>
              {value.length}/{maxLength}
            </Text>
          )}
        </View>
      )}

      <TextInput
        multiline
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        value={value}
        onChangeText={(text) => {
          if (maxLength && text.length > maxLength) return;
          onChangeText(text);
        }}
        maxLength={maxLength}
        style={[
          styles.input,
          {
            minHeight,
            backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
            borderColor: error ? colors.error : colors.border,
            color: colors.text,
          },
          Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : undefined,
          inputStyle,
        ]}
        accessibilityLabel={accessibilityLabel || label}
      />

      {error ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: colors.textMuted }]}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  counter: {
    fontSize: 12,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
});
