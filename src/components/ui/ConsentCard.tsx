import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface ConsentCardProps {
  title: string;
  description: string;
  required?: boolean;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const ConsentCard: React.FC<ConsentCardProps> = ({
  title,
  description,
  required = false,
  value,
  onValueChange,
  disabled = false,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
          borderColor: colors.border,
        },
      ]}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {required && (
            <View style={[styles.badge, { backgroundColor: colors.highlight }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>Obrigatório</Text>
            </View>
          )}
        </View>
        <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || required}
        trackColor={{ false: '#CBD5E1', true: colors.secondary }}
        thumbColor={value ? colors.primary : '#FFFFFF'}
        accessibilityLabel={title}
        accessibilityHint={description}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
