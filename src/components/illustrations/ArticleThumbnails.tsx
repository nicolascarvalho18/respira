import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Circle, Rect, Defs, ClipPath } from 'react-native-svg';

export interface ArticleThumbProps {
  size?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const NightSkyMoonThumb: React.FC<ArticleThumbProps> = ({
  size = 64,
  borderRadius = 12,
  style,
}) => (
  <View style={[styles.container, { width: size, height: size, borderRadius }, style]}>
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <ClipPath id="nightClip">
          <Rect width="64" height="64" rx={borderRadius} fill="#FFFFFF" />
        </ClipPath>
      </Defs>
      <Svg clipPath="url(#nightClip)">
        {/* Background night sky */}
        <Rect width="64" height="64" fill="#294B48" />

        {/* Crescent Moon */}
        <Path
          d="M34 18C28 22 28 32 34 38C26 38 22 30 24 22C25 19 28 17 34 18Z"
          fill="#E7F3EF"
        />

        {/* Small stars */}
        <Circle cx="16" cy="24" r="1" fill="#E7F3EF" opacity={0.7} />
        <Circle cx="44" cy="20" r="1.2" fill="#E7F3EF" opacity={0.8} />
        <Circle cx="50" cy="32" r="1" fill="#E7F3EF" opacity={0.6} />
        <Circle cx="18" cy="38" r="0.8" fill="#E7F3EF" opacity={0.7} />

        {/* Gentle dark rolling hills at bottom */}
        <Path
          d="M-5 50C12 42 30 52 48 46C56 43 64 48 70 50L70 70L-5 70Z"
          fill="#1C3835"
          opacity={0.8}
        />
        <Path
          d="M-5 56C15 48 35 60 55 52C62 49 66 54 70 56L70 70L-5 70Z"
          fill="#122523"
        />
      </Svg>
    </Svg>
  </View>
);

export const SageLeavesThumb: React.FC<ArticleThumbProps> = ({
  size = 64,
  borderRadius = 12,
  style,
}) => (
  <View style={[styles.container, { width: size, height: size, borderRadius }, style]}>
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <ClipPath id="sageClip">
          <Rect width="64" height="64" rx={borderRadius} fill="#FFFFFF" />
        </ClipPath>
      </Defs>
      <Svg clipPath="url(#sageClip)">
        {/* Soft cream/mint background */}
        <Rect width="64" height="64" fill="#EAF3EE" />

        {/* Background organic blob */}
        <Path
          d="M10 20C5 35 15 55 35 60C50 65 60 50 58 35C55 20 40 10 25 12C15 14 12 15 10 20Z"
          fill="#D6E8DF"
          opacity={0.7}
        />

        {/* Plant stem */}
        <Path
          d="M12 60C22 52 30 42 38 28"
          stroke="#4D7F7A"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Leaves */}
        <Path
          d="M38 28C42 20 40 14 36 12C32 18 30 24 38 28Z"
          fill="#6F9F97"
        />
        <Path
          d="M34 36C44 32 50 34 52 40C46 44 40 42 34 36Z"
          fill="#6F9F97"
        />
        <Path
          d="M26 44C18 38 12 42 10 48C18 50 24 48 26 44Z"
          fill="#8BB7AF"
        />
      </Svg>
    </Svg>
  </View>
);

export const WarmSunHillsThumb: React.FC<ArticleThumbProps> = ({
  size = 64,
  borderRadius = 12,
  style,
}) => (
  <View style={[styles.container, { width: size, height: size, borderRadius }, style]}>
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <ClipPath id="warmClip">
          <Rect width="64" height="64" rx={borderRadius} fill="#FFFFFF" />
        </ClipPath>
      </Defs>
      <Svg clipPath="url(#warmClip)">
        {/* Warm peach sky */}
        <Rect width="64" height="64" fill="#FCEEE6" />

        {/* Warm Sun */}
        <Circle cx="44" cy="24" r="8" fill="#E8A78D" />

        {/* Warm hills */}
        <Path
          d="M-5 46C15 36 35 48 55 40C62 37 66 42 70 45L70 70L-5 70Z"
          fill="#E5B29D"
          opacity={0.8}
        />
        <Path
          d="M-5 54C12 44 30 56 50 48C58 45 64 50 70 53L70 70L-5 70Z"
          fill="#D98968"
        />
      </Svg>
    </Svg>
  </View>
);

export const RiverHillsThumb: React.FC<ArticleThumbProps> = ({
  size = 64,
  borderRadius = 12,
  style,
}) => (
  <View style={[styles.container, { width: size, height: size, borderRadius }, style]}>
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <ClipPath id="riverClip">
          <Rect width="64" height="64" rx={borderRadius} fill="#FFFFFF" />
        </ClipPath>
      </Defs>
      <Svg clipPath="url(#riverClip)">
        {/* Calm sage sky */}
        <Rect width="64" height="64" fill="#EAF3EE" />

        {/* Left and Right Calm Green Hills */}
        <Path
          d="M-5 36C15 28 30 42 45 35L45 70L-5 70Z"
          fill="#9DC5BA"
          opacity={0.8}
        />
        <Path
          d="M25 38C40 28 55 42 70 34L70 70L25 70Z"
          fill="#6F9F97"
          opacity={0.85}
        />

        {/* Foreground Hills */}
        <Path
          d="M-5 48C15 42 24 54 30 65L-5 65Z"
          fill="#3B7D75"
        />
        <Path
          d="M40 50C48 42 60 52 70 48L70 65L40 65Z"
          fill="#3B7D75"
        />

        {/* Winding River Stream */}
        <Path
          d="M34 36C28 44 42 50 32 65L38 65C48 50 36 44 40 36Z"
          fill="#EAF3EE"
        />
      </Svg>
    </Svg>
  </View>
);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
