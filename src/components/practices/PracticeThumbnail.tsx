import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';
import {
  Wind,
  Activity,
  Leaf,
  Smile,
  Heart,
  Compass,
  Moon,
  Clock,
  Sun,
  Volume2,
} from 'lucide-react-native';

export interface PracticeThumbnailProps {
  practiceId?: string;
  category?: string;
  title?: string;
  isDark?: boolean;
}

export const PracticeThumbnail: React.FC<PracticeThumbnailProps> = ({
  practiceId = '',
  category = '',
  title = '',
  isDark = false,
}) => {
  const bg = isDark ? '#1F3331' : '#E7F3EF';
  const strokeColor = '#2F7F7C';
  const accentColor = '#79B8A4';

  // 1. Respiração Quadrada (Box Breathing)
  if (practiceId === 'practice-breathing-box' || title.toLowerCase().includes('quadrada')) {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <Svg width={54} height={54} viewBox="0 0 54 54">
          <Rect
            x="7"
            y="7"
            width="40"
            height="40"
            rx="6"
            stroke={strokeColor}
            strokeWidth="3"
            fill={isDark ? '#162927' : '#FFFFFF'}
          />
          <Circle cx="7" cy="7" r="3.5" fill="#D98968" />
          <Circle cx="47" cy="7" r="3.5" fill="#79B8A4" />
          <Circle cx="47" cy="47" r="3.5" fill="#2F7F7C" />
          <Circle cx="7" cy="47" r="3.5" fill="#567571" />
        </Svg>
        <Text style={[styles.microLabel, { color: strokeColor }]}>4×4</Text>
      </View>
    );
  }

  // 2. Coerência Cardíaca (Heart Coherence)
  if (practiceId === 'practice-breathing-coherence' || title.toLowerCase().includes('cardíaca')) {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <Svg width={54} height={54} viewBox="0 0 54 54">
          <Path
            d="M27 41 C12 30 9 20 15 14 C19 10 25 12 27 17 C29 12 35 10 39 14 C45 20 42 30 27 41 Z"
            fill={isDark ? '#2D1F1D' : '#FFF0E8'}
            stroke="#D98968"
            strokeWidth="2.5"
          />
          <Path
            d="M17 26 Q22 20 27 26 T37 26"
            fill="none"
            stroke="#2F7F7C"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </Svg>
      </View>
    );
  }

  // 3. Respiração 4-7-8 & Respirações Guiadas
  if (practiceId === 'practice-breathing-478' || category === 'breathing') {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <Svg width={54} height={54} viewBox="0 0 54 54">
          <Path
            d="M8 34 C16 18 24 18 32 34 C38 42 44 42 48 34"
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <Path
            d="M10 22 C18 10 26 10 34 22 C39 28 44 28 46 22"
            fill="none"
            stroke={accentColor}
            strokeWidth="2"
            strokeLinecap="round"
            opacity={0.8}
          />
        </Svg>
        <Text style={[styles.microLabel, { color: strokeColor }]}>4-7-8</Text>
      </View>
    );
  }

  // 4. Relaxamento Corporal & Leaf
  if (category === 'relaxation' || title.toLowerCase().includes('relaxamento')) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1F3331' : '#EDF6F3' }]}>
        <Leaf size={28} color="#2F7F7C" strokeWidth={2} aria-hidden={true} />
      </View>
    );
  }

  // 5. Meditação Guiada
  if (category === 'guided_meditation' || title.toLowerCase().includes('meditação')) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#232838' : '#F0EEF8' }]}>
        <Svg width={54} height={54} viewBox="0 0 54 54">
          <Circle cx="27" cy="18" r="5" fill="#6A4C93" />
          <Path
            d="M18 38 C18 28 36 28 36 38"
            stroke="#6A4C93"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M15 38 Q27 44 39 38"
            stroke="#9D84B7"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      </View>
    );
  }

  // 6. Sono & Preparação para Dormir
  if (category === 'sleep' || category === 'bedtime_prep' || title.toLowerCase().includes('sono') || title.toLowerCase().includes('dormir')) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1C2538' : '#E8EEF8' }]}>
        <Moon size={26} color="#4A6FA5" strokeWidth={2} aria-hidden={true} />
      </View>
    );
  }

  // 7. Rotina da Manhã
  if (category === 'morning_routine' || title.toLowerCase().includes('manhã')) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#332D1C' : '#FFF9E6' }]}>
        <Sun size={26} color="#D98968" strokeWidth={2} aria-hidden={true} />
      </View>
    );
  }

  // 8. Corpo e Movimento
  if (category === 'body_movement' || title.toLowerCase().includes('corpo') || title.toLowerCase().includes('alongamento')) {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <Activity size={26} color="#2F7F7C" strokeWidth={2} aria-hidden={true} />
      </View>
    );
  }

  // 9. Atenção e Foco
  if (category === 'mindfulness_focus' || title.toLowerCase().includes('foco')) {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <Compass size={26} color="#2F7F7C" strokeWidth={2} aria-hidden={true} />
      </View>
    );
  }

  // 10. Pausas Rápidas
  if (category === 'quick_pauses') {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <Clock size={26} color="#2F7F7C" strokeWidth={2} aria-hidden={true} />
      </View>
    );
  }

  // Padrão
  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Leaf size={26} color="#2F7F7C" strokeWidth={2} aria-hidden={true} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  microLabel: {
    position: 'absolute',
    bottom: 4,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
