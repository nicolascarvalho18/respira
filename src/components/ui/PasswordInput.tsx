import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { AppInput, AppInputProps } from './AppInput';
import { useTheme } from '../../hooks/useTheme';

export interface PasswordInputProps extends Omit<AppInputProps, 'secureTextEntry' | 'rightIcon'> {
  label?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = (props) => {
  const [showPassword, setShowPassword] = useState(false);
  const { colors } = useTheme();

  return (
    <AppInput
      {...props}
      secureTextEntry={!showPassword}
      autoCapitalize="none"
      autoCorrect={false}
      rightIcon={
        <TouchableOpacity
          onPress={() => setShowPassword((prev) => !prev)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Ocultar senha' : 'Exibir senha'}
        >
          {showPassword ? (
            <EyeOff size={20} color={colors.textMuted} />
          ) : (
            <Eye size={20} color={colors.textMuted} />
          )}
        </TouchableOpacity>
      }
    />
  );
};
