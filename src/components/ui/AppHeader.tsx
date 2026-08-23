import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  rightAction,
  style,
}) => {
  const router = useRouter();
  const { colors } = useTheme();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 14,
          minHeight: 56,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surfaceSubtle,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <ChevronLeft size={22} color={colors.text} />
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }}>
          {title && (
            <Text
              numberOfLines={1}
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.text,
              }}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              numberOfLines={1}
              style={{
                fontSize: 13,
                color: colors.textMuted,
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {rightAction && <View style={{ marginLeft: 12 }}>{rightAction}</View>}
    </View>
  );
};
