import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Image } from 'react-native';
import Svg, { Path, Circle, Rect, Defs, ClipPath } from 'react-native-svg';
import {
  User,
  Smile,
  Heart,
  Compass,
  Leaf,
  Wind,
  Sun,
  Moon,
} from 'lucide-react-native';

export interface AnaAvatarProps {
  size?: number;
  avatarUrl?: string | null;
  name?: string;
  style?: ViewStyle;
}

const PRESET_ICONS_MAP: Record<string, any> = {
  user: User,
  smile: Smile,
  heart: Heart,
  compass: Compass,
  leaf: Leaf,
  wind: Wind,
  sun: Sun,
  moon: Moon,
};

export const AnaAvatar: React.FC<AnaAvatarProps> = ({
  size = 68,
  avatarUrl,
  name = 'Ana',
  style,
}) => {
  // 1. Caso seja um ícone personalizado codificado: "custom-icon:iconId:color"
  if (avatarUrl && avatarUrl.startsWith('custom-icon:')) {
    const parts = avatarUrl.split(':');
    const iconId = parts[1] || 'user';
    const bgColor = parts[2] || '#2F7F7C';
    const IconComponent = PRESET_ICONS_MAP[iconId] || User;
    const iconSize = Math.round(size * 0.52);

    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bgColor,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          },
          style,
        ]}
      >
        <IconComponent size={iconSize} color="#FFFFFF" strokeWidth={2.2} />
      </View>
    );
  }

  // 2. Caso seja uma URL de imagem direta (http / https / data:image)
  if (
    avatarUrl &&
    (avatarUrl.startsWith('http://') ||
      avatarUrl.startsWith('https://') ||
      avatarUrl.startsWith('data:image'))
  ) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#E7F3EF',
            overflow: 'hidden',
          },
          style,
        ]}
      >
        <Image
          source={{ uri: avatarUrl }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
          resizeMode="cover"
        />
      </View>
    );
  }

  // 3. Caso o usuário tenha optado expressamente pelas iniciais ou avatar seja vazio com nome informado
  if (avatarUrl === null && name) {
    const initial = name.trim().charAt(0).toUpperCase() || 'A';
    const fontSize = Math.round(size * 0.44);

    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#173D3B',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          },
          style,
        ]}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontSize,
            fontWeight: '800',
          }}
        >
          {initial}
        </Text>
      </View>
    );
  }

  // 4. Ilustração original clássica da Ana como fallback acolhedor
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, overflow: 'hidden' },
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 68 68" fill="none">
        <Defs>
          <ClipPath id="avatarClip">
            <Circle cx="34" cy="34" r="34" />
          </ClipPath>
        </Defs>
        <Svg clipPath="url(#avatarClip)">
          {/* Background circle */}
          <Rect width="68" height="68" fill="#75B4A8" />

          {/* Shoulders / Torso with dark teal shirt */}
          <Path d="M10 68C10 52 20 48 34 48C48 48 58 52 58 68Z" fill="#1E4440" />

          {/* Neck */}
          <Rect x="29" y="38" width="10" height="12" rx="4" fill="#ECCBB3" />

          {/* Face */}
          <Circle cx="34" cy="30" r="14" fill="#F4D8C4" />

          {/* Hair back / long wavy strands */}
          <Path d="M18 24C16 34 16 46 22 52C22 42 22 34 20 24Z" fill="#32221A" />
          <Path d="M50 24C52 34 52 46 46 52C46 42 46 34 48 24Z" fill="#32221A" />

          {/* Hair top / bangs */}
          <Path
            d="M18 26C18 16 26 12 34 12C42 12 50 16 50 26C46 20 38 18 34 20C28 20 22 22 18 26Z"
            fill="#3A271E"
          />

          {/* Eyes */}
          <Circle cx="29" cy="29" r="1.8" fill="#201510" />
          <Circle cx="39" cy="29" r="1.8" fill="#201510" />

          {/* Gentle Smile */}
          <Path
            d="M31 35C33 37 35 37 37 35"
            stroke="#9C5D45"
            strokeWidth="1.4"
            strokeLinecap="round"
          />

          {/* Soft Blushes */}
          <Circle cx="26" cy="33" r="2.2" fill="#E89B84" opacity={0.4} />
          <Circle cx="42" cy="33" r="2.2" fill="#E89B84" opacity={0.4} />
        </Svg>
      </Svg>
    </View>
  );
};
