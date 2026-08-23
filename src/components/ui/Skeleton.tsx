import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: isDark ? colors.surfaceSecondary : colors.border,
          opacity,
        },
        style,
      ]}
      accessibilityRole="none"
      accessibilityLabel="Carregando conteúdo..."
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardContainer}>
      <Skeleton height={24} width="40%" style={{ marginBottom: 12 }} />
      <Skeleton height={16} width="90%" style={{ marginBottom: 8 }} />
      <Skeleton height={16} width="70%" style={{ marginBottom: 16 }} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Skeleton height={32} width={80} borderRadius={16} />
        <Skeleton height={32} width={100} borderRadius={16} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  cardContainer: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    width: '100%',
  },
});
