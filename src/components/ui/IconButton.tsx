import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'subtle' | 'outline' | 'filled';
  disabled?: boolean;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  size = 'md',
  variant = 'subtle',
  disabled = false,
  style,
}) => {
  const { colors, isDark } = useTheme();

  let dimension = 44; // min touch target
  let borderRadius = 22;
  if (size === 'sm') {
    dimension = 36;
    borderRadius = 18;
  } else if (size === 'lg') {
    dimension = 50;
    borderRadius = 25;
  }

  let bg = 'transparent';
  let borderWidth = 0;
  let borderColor = 'transparent';

  if (variant === 'subtle') {
    bg = isDark ? colors.surfaceSecondary : colors.surfaceSecondary;
  } else if (variant === 'outline') {
    bg = 'transparent';
    borderWidth = 1.5;
    borderColor = colors.border;
  } else if (variant === 'filled') {
    bg = colors.primary;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={[
        styles.button,
        {
          width: dimension,
          height: dimension,
          borderRadius,
          backgroundColor: bg,
          borderWidth,
          borderColor,
          opacity: disabled ? 0.5 : 1,
        },
        Platform.OS === 'web' ? ({ cursor: disabled ? 'not-allowed' : 'pointer' } as any) : undefined,
        style,
      ]}
    >
      {icon}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
