import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface ProgressBarProps {
  progress: number; // 0 to 100
  showLabel?: boolean;
  height?: number;
  color?: string;
  style?: ViewStyle;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = false,
  height = 8,
  color,
  style,
  label,
}) => {
  const { colors, isDark } = useTheme();

  const clamped = Math.max(0, Math.min(100, progress));
  const barColor = color || colors.primary;

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      accessibilityLabel={label || `Progresso: ${Math.round(clamped)}%`}
    >
      {(showLabel || label) && (
        <View style={styles.labelRow}>
          {label && <Text style={[styles.labelText, { color: colors.text }]}>{label}</Text>}
          {showLabel && (
            <Text style={[styles.percentText, { color: colors.textMuted }]}>
              {Math.round(clamped)}%
            </Text>
          )}
        </View>
      )}

      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: isDark ? colors.surfaceSecondary : colors.border,
            borderRadius: height / 2,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${clamped}%`,
              backgroundColor: barColor,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
