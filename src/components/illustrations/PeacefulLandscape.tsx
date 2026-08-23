import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Circle, Rect, Defs, ClipPath } from 'react-native-svg';

export interface PeacefulLandscapeProps {
  width?: number;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const PeacefulLandscape: React.FC<PeacefulLandscapeProps> = ({
  width = 100,
  height = 100,
  borderRadius = 14,
  style,
}) => {
  return (
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      <Svg width={width} height={height} viewBox="0 0 100 100" fill="none">
        <Defs>
          <ClipPath id="roundedClip">
            <Rect width="100" height="100" rx={borderRadius} fill="#FFFFFF" />
          </ClipPath>
        </Defs>

        <Svg clipPath="url(#roundedClip)">
          {/* Background sky */}
          <Rect width="100" height="100" fill="#EBF4F0" />

          {/* Moon / Sun */}
          <Circle cx="65" cy="30" r="10" fill="#D3E7DE" />

          {/* Background Mountains */}
          <Path
            d="M-10 70C15 50 40 65 70 52C85 45 105 58 115 65L115 110L-10 110Z"
            fill="#B1D5C9"
            opacity={0.8}
          />

          {/* Middle Mountains */}
          <Path
            d="M-10 82C20 62 55 80 80 66C95 58 110 70 115 78L115 110L-10 110Z"
            fill="#6FA89B"
            opacity={0.85}
          />

          {/* Foreground Mountains */}
          <Path
            d="M-10 92C15 78 45 92 75 80C92 74 105 84 115 88L115 110L-10 110Z"
            fill="#3B7D75"
          />
        </Svg>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
