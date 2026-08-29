import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Animated, Easing } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export type CharacterPosture =
  | 'breathing_diaphragmatic' // Mão no peito e mão na barriga
  | 'breathing_relaxed'       // Mãos sobre o colo
  | 'meditation_lotus'        // Postura meditativa tranquila
  | 'grounding_mug'           // Segurando xícara com acolhimento
  | 'body_scan'               // Foco corporal descontraído
  | 'stretch_arms'            // Alongamento suave de braços/ombros
  | 'stretch_neck';           // Alongamento suave cervical

export interface CharacterGuidedCanvasProps {
  phase?: 'inhale' | 'hold' | 'exhale' | 'hold_after_exhale' | 'idle';
  phaseDurationSeconds?: number;
  posture?: CharacterPosture;
  reducedMotion?: boolean;
  intensity?: number; // 0 a 1
}

export const CharacterGuidedCanvas: React.FC<CharacterGuidedCanvasProps> = ({
  phase = 'idle',
  phaseDurationSeconds = 4,
  posture = 'breathing_diaphragmatic',
  reducedMotion = false,
  intensity = 1,
}) => {
  const { colors, isDark } = useTheme();

  // Animação de expansão do peito e abdômen
  const chestExpansion = useRef(new Animated.Value(0)).current;
  const bellyExpansion = useRef(new Animated.Value(0)).current;
  const shouldersElevation = useRef(new Animated.Value(0)).current;

  // Animação de piscar suave dos olhos
  const [isBlinking, setIsBlinking] = useState(false);

  // Animação de aura / brilho suave da respiração
  const auraOpacity = useRef(new Animated.Value(0.3)).current;

  // Efeito de piscar orgânico periódico (a cada 4 a 6 segundos)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const scheduleBlink = () => {
      const delay = Math.random() * 2500 + 3500;
      timeoutId = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 180);
      }, delay);
    };

    scheduleBlink();
    return () => clearTimeout(timeoutId);
  }, []);

  // Sincronização cinemática com a fase da respiração
  useEffect(() => {
    if (reducedMotion) {
      chestExpansion.setValue(0);
      bellyExpansion.setValue(0);
      shouldersElevation.setValue(0);
      return;
    }

    const durationMs = Math.max(800, phaseDurationSeconds * 1000);

    if (phase === 'inhale') {
      // Inspiração: Expansão suave da barriga e peito, ombros relaxados
      Animated.parallel([
        Animated.timing(chestExpansion, {
          toValue: 1 * intensity,
          duration: durationMs,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(bellyExpansion, {
          toValue: 1.15 * intensity,
          duration: durationMs,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(shouldersElevation, {
          toValue: 0.2 * intensity, // Elevação mínima sem tensão
          duration: durationMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(auraOpacity, {
          toValue: 0.65,
          duration: durationMs,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else if (phase === 'hold' || phase === 'hold_after_exhale') {
      // Pausa: Corpo permanece perfeitamente estável e sereno
    } else if (phase === 'exhale') {
      // Expiração: Recolhimento lento e gradual da barriga e peito
      Animated.parallel([
        Animated.timing(chestExpansion, {
          toValue: 0,
          duration: durationMs,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(bellyExpansion, {
          toValue: 0,
          duration: durationMs,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(shouldersElevation, {
          toValue: 0,
          duration: durationMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(auraOpacity, {
          toValue: 0.2,
          duration: durationMs,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else {
      // Idle: Respiração natural sutil
      Animated.parallel([
        Animated.timing(chestExpansion, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(bellyExpansion, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(auraOpacity, {
          toValue: 0.3,
          duration: 1200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [phase, phaseDurationSeconds, reducedMotion, intensity]);

  // Interpolações de escala e transformação
  const chestScaleX = chestExpansion.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });
  const chestScaleY = chestExpansion.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  const bellyScaleX = bellyExpansion.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const bellyScaleY = bellyExpansion.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  const shoulderY = shouldersElevation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });

  // Cores da personagem oficial fielmente extraídas da identidade
  const skinTone = '#EBB696';
  const skinShadow = '#D99F7F';
  const blushTone = 'rgba(230, 120, 100, 0.28)';
  const hairDark = '#2B1B17';
  const hairHighlight = '#3E2A24';
  const sweaterGreen = '#658C7F';
  const sweaterShadow = '#507468';
  const sweaterRib = '#46665B';
  const pantsCream = isDark ? '#2D3B37' : '#F4F0E6';
  const chairTeal = isDark ? '#1C2926' : '#234E47';
  const cushionOrange = '#D97C5B';
  const goldEarring = '#D4AF37';

  return (
    <View style={styles.container}>
      {/* 1. Aura e Fundo Suave */}
      <Animated.View
        style={[
          styles.backgroundAura,
          {
            backgroundColor: isDark ? 'rgba(94, 207, 195, 0.08)' : 'rgba(31, 118, 110, 0.06)',
            opacity: auraOpacity,
          },
        ]}
      />

      {/* 2. SVG Multicamadas da Personagem Oficial */}
      <svg
        viewBox="0 0 400 480"
        style={{ width: '100%', height: '100%', maxWidth: 360, maxHeight: 420 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.08" />
          </filter>
          <linearGradient id="sweaterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={sweaterGreen} />
            <stop offset="100%" stopColor={sweaterShadow} />
          </linearGradient>
          <linearGradient id="auraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2A7E74" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#D4A373" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* --- CAMADA 1: Poltrona Confortável e Almofada --- */}
        <g id="furniture">
          {/* Encosto da Poltrona */}
          <path
            d="M 90 280 C 80 180, 320 180, 310 280 L 325 450 C 325 465, 75 465, 75 450 Z"
            fill={chairTeal}
            opacity={0.88}
          />
          {/* Almofada de Apoio Terracota */}
          <path
            d="M 270 330 C 290 320, 325 340, 320 400 C 315 430, 280 435, 260 410 Z"
            fill={cushionOrange}
            opacity={0.92}
          />
        </g>

        {/* --- CAMADA 2: Pernas e Calça Clara --- */}
        <g id="lowerBody">
          <path
            d="M 105 390 C 105 450, 160 470, 200 470 C 240 470, 295 450, 295 390 C 275 370, 125 370, 105 390 Z"
            fill={pantsCream}
            filter="url(#softShadow)"
          />
          {/* Dobras suaves da calça */}
          <path
            d="M 190 410 C 195 440, 200 460, 200 470"
            stroke={isDark ? '#3D4F4A' : '#D8D2C4'}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* --- CAMADA 3 & 4: Tronco Animado (Abdômen e Peito em Suéter Verde) --- */}
        <g
          id="torso"
          style={{
            transformOrigin: '200px 330px',
            transform: `scale(${chestScaleX}, ${chestScaleY}) translateY(${shoulderY}px)`,
            transition: reducedMotion ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {/* Corpo do Suéter */}
          <path
            d="M 125 240 C 120 310, 115 360, 135 390 C 160 400, 240 400, 265 390 C 285 360, 280 310, 275 240 C 250 220, 150 220, 125 240 Z"
            fill="url(#sweaterGrad)"
          />

          {/* Gola Redonda Texturizada do Suéter */}
          <path
            d="M 172 215 C 185 232, 215 232, 228 215 C 220 238, 180 238, 172 215 Z"
            fill={sweaterRib}
          />
          <path
            d="M 172 215 C 185 230, 215 230, 228 215"
            stroke={sweaterRib}
            strokeWidth="3.5"
            fill="none"
          />

          {/* Abdômen com Expansão Cinemática */}
          <g
            id="abdomen"
            style={{
              transformOrigin: '200px 345px',
              transform: `scale(${bellyScaleX}, ${bellyScaleY})`,
              transition: reducedMotion ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            {/* Indicador sutil de respiração abdominal */}
            {phase === 'inhale' && (
              <path
                d="M 160 340 C 180 325, 220 325, 240 340"
                stroke="rgba(255, 255, 255, 0.45)"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                fill="none"
              />
            )}
          </g>
        </g>

        {/* --- CAMADA 5 & 6: Braços e Mãos na Postura da Técnica --- */}
        <g id="armsAndHands">
          {posture === 'breathing_diaphragmatic' && (
            <>
              {/* Braço Esquerdo (apoiando mão no peito) */}
              <path
                d="M 128 245 C 120 280, 135 320, 185 270"
                stroke="url(#sweaterGrad)"
                strokeWidth="26"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              {/* Mão sobre o Peito / Clavícula */}
              <g id="handChest" transform="translate(180, 248)">
                <ellipse cx="14" cy="14" rx="14" ry="10" fill={skinTone} transform="rotate(-15 14 14)" />
                {/* Dedos repousados suavemente */}
                <path d="M 6 12 C 14 6, 26 12, 30 18" stroke={skinShadow} strokeWidth="1.8" fill="none" strokeLinecap="round" />
                <path d="M 4 18 C 12 12, 24 18, 28 24" stroke={skinShadow} strokeWidth="1.8" fill="none" strokeLinecap="round" />
              </g>

              {/* Braço Direito (apoiando mão na barriga) */}
              <path
                d="M 272 245 C 280 290, 265 350, 210 350"
                stroke="url(#sweaterGrad)"
                strokeWidth="26"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              {/* Mão sobre a Barriga */}
              <g id="handBelly" transform="translate(178, 335)">
                <ellipse cx="20" cy="12" rx="18" ry="11" fill={skinTone} transform="rotate(5 20 12)" />
                {/* Dedos suaves sobre o abdômen */}
                <path d="M 8 10 C 18 10, 28 14, 36 14" stroke={skinShadow} strokeWidth="1.8" fill="none" strokeLinecap="round" />
                <path d="M 6 16 C 16 16, 26 20, 34 20" stroke={skinShadow} strokeWidth="1.8" fill="none" strokeLinecap="round" />
              </g>
            </>
          )}

          {posture === 'grounding_mug' && (
            <>
              {/* Braços segurando xícara quente */}
              <path
                d="M 128 245 C 125 290, 145 330, 185 330"
                stroke="url(#sweaterGrad)"
                strokeWidth="24"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 272 245 C 275 290, 255 330, 215 330"
                stroke="url(#sweaterGrad)"
                strokeWidth="24"
                strokeLinecap="round"
                fill="none"
              />
              {/* Xícara de Chá Aconchegante */}
              <g transform="translate(182, 310)">
                <rect x="0" y="5" width="36" height="30" rx="6" fill="#E28768" />
                <path d="M 36 12 C 43 12, 43 24, 36 24" stroke="#E28768" strokeWidth="3" fill="none" />
                {/* Fumaça sutil do chá */}
                <path d="M 10 0 C 8 -10, 14 -15, 10 -22" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                <path d="M 24 -2 C 22 -12, 28 -16, 24 -24" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              </g>
            </>
          )}

          {(posture === 'breathing_relaxed' || posture === 'meditation_lotus' || posture === 'body_scan') && (
            <>
              {/* Braços repousando suavemente sobre as pernas/colo */}
              <path
                d="M 128 245 C 120 290, 130 360, 165 375"
                stroke="url(#sweaterGrad)"
                strokeWidth="24"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 272 245 C 280 290, 270 360, 235 375"
                stroke="url(#sweaterGrad)"
                strokeWidth="24"
                strokeLinecap="round"
                fill="none"
              />
              {/* Mãos com palmas abertas ou viradas para cima no colo */}
              <ellipse cx="165" cy="375" rx="14" ry="9" fill={skinTone} transform="rotate(20 165 375)" />
              <ellipse cx="235" cy="375" rx="14" ry="9" fill={skinTone} transform="rotate(-20 235 375)" />
            </>
          )}
        </g>

        {/* --- CAMADA 7: Pescoço, Rosto e Cabeça Oficial --- */}
        <g id="headAndFace">
          {/* Pescoço */}
          <path d="M 184 185 L 184 225 C 192 230, 208 230, 216 225 L 216 185 Z" fill={skinTone} />
          <path d="M 184 195 C 196 205, 208 205, 216 195 L 216 208 C 208 215, 192 215, 184 208 Z" fill={skinShadow} opacity="0.4" />

          {/* Formato do Rosto (Mandíbula suave e graciosa) */}
          <path
            d="M 158 135 C 158 190, 175 208, 200 208 C 225 208, 242 190, 242 135 C 242 85, 158 85, 158 135 Z"
            fill={skinTone}
            filter="url(#softShadow)"
          />

          {/* Orelhas e Brinco Dourado */}
          <ellipse cx="156" cy="142" rx="6" ry="10" fill={skinTone} />
          <ellipse cx="244" cy="142" rx="6" ry="10" fill={skinTone} />
          <circle cx="156" cy="150" r="3.2" fill={goldEarring} />
          <circle cx="244" cy="150" r="3.2" fill={goldEarring} />

          {/* Cabelo Traseiro e Coque Alto Icônico */}
          <circle cx="200" cy="72" r="30" fill={hairDark} />
          <path
            d="M 182 82 C 170 50, 230 50, 218 82 Z"
            fill={hairHighlight}
          />
          {/* Grampo/Prendedor sutil */}
          <ellipse cx="200" cy="84" rx="14" ry="4" fill="#6B4226" />

          {/* Cabelo Frontal com mecha lateral suave */}
          <path
            d="M 156 128 C 160 85, 240 85, 244 128 C 232 105, 168 105, 156 128 Z"
            fill={hairDark}
          />
          {/* Mecha graciosa solta no lado esquerdo */}
          <path
            d="M 160 120 C 152 145, 154 175, 162 188 C 160 170, 158 140, 164 125 Z"
            fill={hairDark}
          />

          {/* Sobrancelhas Arqueadas Naturais */}
          <path d="M 172 132 C 178 127, 188 128, 192 132" stroke={hairDark} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M 208 132 C 212 128, 222 127, 228 132" stroke={hairDark} strokeWidth="2.4" strokeLinecap="round" fill="none" />

          {/* Olhos: Serenos e fechados para prática interior (ou piscando) */}
          {isBlinking ? (
            <>
              <path d="M 173 145 Q 183 147 191 145" stroke="#3D261C" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <path d="M 209 145 Q 217 147 227 145" stroke="#3D261C" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              <path d="M 173 144 Q 183 151 191 144" stroke="#3D261C" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M 178 148 L 176 151" stroke="#3D261C" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 183 149 L 183 153" stroke="#3D261C" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 188 148 L 190 151" stroke="#3D261C" strokeWidth="1.5" strokeLinecap="round" />

              <path d="M 209 144 Q 217 151 227 144" stroke="#3D261C" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M 214 148 L 212 151" stroke="#3D261C" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 219 149 L 219 153" stroke="#3D261C" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 224 148 L 226 151" stroke="#3D261C" strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}

          {/* Nariz Delicado */}
          <path d="M 200 138 C 201 155, 196 160, 203 162" stroke={skinShadow} strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Bochechas com Blush Suave de Vitalidade */}
          <circle cx="172" cy="156" r="8" fill={blushTone} />
          <circle cx="228" cy="156" r="8" fill={blushTone} />

          {/* Lábios Acolhedores com Sorriso Calmo */}
          <path
            d="M 191 176 C 196 182, 204 182, 209 176"
            stroke="#B55B48"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 380,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backgroundAura: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: 50,
    zIndex: 0,
  },
});
