import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Compass } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppButton } from './AppButton';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionTitle,
  onActionPress,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          backgroundColor: colors.surfaceSubtle,
          borderRadius: 24,
          marginVertical: 16,
        },
        style,
      ]}
      accessibilityRole="text"
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.highlight,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        {icon || <Compass size={28} color={colors.primary} aria-hidden={true} />}
      </View>

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

      {description && (
        <Text
          style={{
            fontSize: 14,
            color: colors.textMuted,
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: actionTitle ? 20 : 0,
          }}
        >
          {description}
        </Text>
      )}

      {actionTitle && onActionPress && (
        <AppButton
          title={actionTitle}
          onPress={onActionPress}
          variant="secondary"
          size="sm"
          fullWidth={false}
        />
      )}
    </View>
  );
};
