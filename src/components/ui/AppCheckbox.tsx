import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

export interface AppCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  sublabel?: string;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export const AppCheckbox: React.FC<AppCheckboxProps> = ({
  checked,
  onChange,
  label,
  sublabel,
  disabled = false,
  style,
  accessibilityLabel,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        if (!disabled) onChange(!checked);
      }}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={accessibilityLabel || label}
      style={[
        styles.container,
        Platform.OS === 'web' ? ({ cursor: disabled ? 'not-allowed' : 'pointer' } as any) : undefined,
        style,
      ]}
    >
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: checked ? colors.primary : isDark ? colors.surfaceSecondary : '#FFFFFF',
            borderColor: checked ? colors.primary : colors.borderStrong,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {checked && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
      </View>

      {(label || sublabel) && (
        <View style={styles.textContainer}>
          {label && (
            <Text
              style={[
                styles.label,
                {
                  color: disabled ? colors.textMuted : colors.text,
                },
              ]}
            >
              {label}
            </Text>
          )}
          {sublabel && (
            <Text style={[styles.sublabel, { color: colors.textMuted }]}>{sublabel}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 6,
    minHeight: 44,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  sublabel: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
});
