import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

export interface BotanicalLeavesProps {
  width?: number;
  height?: number;
  style?: ViewStyle;
}

export const BotanicalLeaves: React.FC<BotanicalLeavesProps> = ({
  width = 130,
  height = 140,
  style,
}) => {
  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Svg width={width} height={height} viewBox="0 0 130 140" fill="none">
        {/* Soft background glow circles */}
        <Circle cx="100" cy="40" r="35" fill="#DCEDE8" opacity={0.6} />
        <Circle cx="35" cy="95" r="25" fill="#D3E8E2" opacity={0.5} />
        <Circle cx="20" cy="30" r="3" fill="#84AFA8" opacity={0.5} />
        <Circle cx="115" cy="95" r="2.5" fill="#84AFA8" opacity={0.5} />
        <Circle cx="90" cy="15" r="2" fill="#84AFA8" opacity={0.4} />

        {/* Main central stem */}
        <Path
          d="M40 140C48 105 60 70 85 25"
          stroke="#4D7F7A"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Top central leaf */}
        <Path
          d="M85 25C88 12 84 2 80 0C76 10 74 18 85 25Z"
          fill="#8BB7AF"
          opacity={0.85}
        />

        {/* Upper Right Leaf */}
        <Path
          d="M78 40C98 32 112 36 116 46C104 54 90 50 78 40Z"
          fill="#78AAA2"
          opacity={0.8}
        />

        {/* Upper Left Leaf */}
        <Path
          d="M68 55C50 42 38 48 34 58C48 64 60 62 68 55Z"
          fill="#9DC2BA"
          opacity={0.85}
        />

        {/* Middle Right Leaf */}
        <Path
          d="M60 75C82 68 98 76 102 88C88 94 72 88 60 75Z"
          fill="#6F9F97"
          opacity={0.75}
        />

        {/* Middle Left Leaf */}
        <Path
          d="M52 90C32 78 20 86 16 98C30 102 44 98 52 90Z"
          fill="#8EB9B1"
          opacity={0.8}
        />

        {/* Lower Right Leaf */}
        <Path
          d="M45 110C65 106 78 116 80 126C68 130 54 122 45 110Z"
          fill="#608F87"
          opacity={0.7}
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
