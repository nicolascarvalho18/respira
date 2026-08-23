import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppButton } from './AppButton';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Algo não saiu como esperado',
  message = 'Não foi possível carregar as informações. Por favor, tente novamente.',
  onRetry,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          backgroundColor: colors.surfaceSubtle,
          borderRadius: 20,
          marginVertical: 16,
        },
        style,
      ]}
      accessibilityRole="alert"
    >
      <AlertCircle size={36} color={colors.error} style={{ marginBottom: 12 }} />
      <Text
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          marginBottom: 6,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: colors.textMuted,
          textAlign: 'center',
          marginBottom: onRetry ? 16 : 0,
        }}
      >
        {message}
      </Text>
      {onRetry && (
        <AppButton
          title="Tentar novamente"
          onPress={onRetry}
          variant="outline"
          size="sm"
          fullWidth={false}
        />
      )}
    </View>
  );
};
