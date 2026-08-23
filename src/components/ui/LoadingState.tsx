import React from 'react';
import { View, ActivityIndicator, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface LoadingStateProps {
  message?: string;
  style?: ViewStyle;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Carregando...',
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          minHeight: 200,
        },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text
          style={{
            marginTop: 16,
            fontSize: 14,
            color: colors.textMuted,
            textAlign: 'center',
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
};
