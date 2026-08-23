import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

export interface ArticleContourLinesProps {
  width?: number;
  height?: number;
  style?: ViewStyle;
}

export const ArticleContourLines: React.FC<ArticleContourLinesProps> = ({
  width = 160,
  height = 140,
  style,
}) => {
  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Svg width={width} height={height} viewBox="0 0 160 140" fill="none">
        {/* Soft background glow */}
        <Circle cx="120" cy="70" r="55" fill="#DCEDE8" opacity={0.5} />

        {/* Concentric topographic/harmonic wave lines */}
        <Path
          d="M60 140C65 110 80 85 105 60C125 40 145 25 160 15"
          stroke="#7BAEA6"
          strokeWidth="1.5"
          strokeOpacity={0.45}
        />
        <Path
          d="M75 140C80 115 92 92 115 70C132 52 148 38 160 28"
          stroke="#82B6AE"
          strokeWidth="1.5"
          strokeOpacity={0.5}
        />
        <Path
          d="M90 140C95 120 105 100 125 80C140 65 152 52 160 42"
          stroke="#8EBEB6"
          strokeWidth="1.5"
          strokeOpacity={0.55}
        />
        <Path
          d="M105 140C110 125 118 108 135 90C148 76 156 65 160 56"
          stroke="#9AC7BF"
          strokeWidth="1.4"
          strokeOpacity={0.6}
        />
        <Path
          d="M120 140C124 130 130 116 144 100C152 90 158 80 160 70"
          stroke="#A6D0C9"
          strokeWidth="1.3"
          strokeOpacity={0.65}
        />
        <Path
          d="M135 140C138 134 142 124 152 110C156 102 159 95 160 84"
          stroke="#B3D9D2"
          strokeWidth="1.2"
          strokeOpacity={0.7}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
