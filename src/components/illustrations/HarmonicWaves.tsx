import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export interface HarmonicWavesProps {
  width?: number;
  height?: number;
  style?: ViewStyle;
}

export const HarmonicWaves: React.FC<HarmonicWavesProps> = ({
  width = 160,
  height = 130,
  style,
}) => {
  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Svg width={width} height={height} viewBox="0 0 160 130" fill="none">
        {/* Harmonic flowing undulating lines */}
        <Path
          d="M0 80C30 40 70 110 110 50C130 20 150 40 160 55"
          stroke="#7BAEA6"
          strokeWidth="1.8"
          strokeOpacity={0.4}
        />
        <Path
          d="M5 86C35 48 72 114 112 56C132 26 152 46 160 60"
          stroke="#82B6AE"
          strokeWidth="1.6"
          strokeOpacity={0.45}
        />
        <Path
          d="M10 92C40 56 75 118 114 62C134 32 154 52 160 65"
          stroke="#8EBEB6"
          strokeWidth="1.5"
          strokeOpacity={0.5}
        />
        <Path
          d="M15 98C45 64 78 122 116 68C136 38 156 58 160 70"
          stroke="#9AC7BF"
          strokeWidth="1.4"
          strokeOpacity={0.55}
        />
        <Path
          d="M20 104C50 72 80 126 118 74C138 44 158 64 160 75"
          stroke="#A6D0C9"
          strokeWidth="1.3"
          strokeOpacity={0.6}
        />
        <Path
          d="M25 110C55 80 83 130 120 80C140 50 160 70 160 80"
          stroke="#B3D9D2"
          strokeWidth="1.2"
          strokeOpacity={0.65}
        />
        <Path
          d="M30 116C60 88 85 134 122 86C142 56 160 76 160 85"
          stroke="#C0E2DC"
          strokeWidth="1.1"
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
