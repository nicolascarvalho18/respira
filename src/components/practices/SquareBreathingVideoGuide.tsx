import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import Svg, {
  Path,
  Rect,
  Circle,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { useBreakpoint } from '../../hooks/useBreakpoint';

export type BoxPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

export interface SquareBreathingVideoGuideProps {
  isPlaying: boolean;
  currentSecond: number; // 0 to totalDuration (e.g. 180s)
  totalDurationSeconds?: number; // default 180 (3 min)
  speedMultiplier?: number;
  showCaptions?: boolean;
}

export const SquareBreathingVideoGuide: React.FC<SquareBreathingVideoGuideProps> = ({
  isPlaying,
  currentSecond,
  totalDurationSeconds = 180,
  speedMultiplier = 1,
  showCaptions = true,
}) => {
  const { colors, isDark } = useTheme();
  const { isDesktop, isTablet } = useBreakpoint();

  // Cada ciclo dura 16 segundos (4s inspire + 4s segure + 4s expire + 4s aguarde)
  const cycleDuration = 16;
  const cycleIndex = Math.min(Math.floor(currentSecond / cycleDuration) + 1, Math.ceil(totalDurationSeconds / cycleDuration));
  const totalCycles = Math.ceil(totalDurationSeconds / cycleDuration);

  const secondInCycle = currentSecond % cycleDuration;
  let phase: BoxPhase = 'inhale';
  let phaseSecondRemaining = 4;
  let sideProgressPercent = 0; // 0 to 1

  if (secondInCycle < 4) {
    phase = 'inhale';
    phaseSecondRemaining = 4 - (secondInCycle % 4);
    sideProgressPercent = (secondInCycle % 4) / 4;
  } else if (secondInCycle < 8) {
    phase = 'hold1';
    phaseSecondRemaining = 4 - (secondInCycle % 4);
    sideProgressPercent = (secondInCycle % 4) / 4;
  } else if (secondInCycle < 12) {
    phase = 'exhale';
    phaseSecondRemaining = 4 - (secondInCycle % 4);
    sideProgressPercent = (secondInCycle % 4) / 4;
  } else {
    phase = 'hold2';
    phaseSecondRemaining = 4 - (secondInCycle % 4);
    sideProgressPercent = (secondInCycle % 4) / 4;
  }

  // Animação de respiração da personagem no tórax / ombros
  const chestExpansion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let target = 0;
    if (phase === 'inhale') target = 1;
    else if (phase === 'hold1') target = 1;
    else if (phase === 'exhale') target = 0;
    else target = 0;

    Animated.timing(chestExpansion, {
      toValue: target,
      duration: 3800 / speedMultiplier,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [phase, speedMultiplier]);

  const getPhaseInfo = () => {
    switch (phase) {
      case 'inhale':
        return {
          title: 'Inspire',
          instruction: 'Inspire suavemente pelo nariz',
          color: '#2F7F7C',
          caption: 'Inspire pelo nariz contando 4 segundos...',
        };
      case 'hold1':
        return {
          title: 'Segure',
          instruction: 'Mantenha os pulmões cheios com calma',
          color: '#79B8A4',
          caption: 'Segure o ar com serenidade por 4 segundos...',
        };
      case 'exhale':
        return {
          title: 'Expire',
          instruction: 'Solte o ar devagar pela boca',
          color: '#D98968',
          caption: 'Expire lentamente pela boca em 4 segundos...',
        };
      case 'hold2':
        return {
          title: 'Aguarde',
          instruction: 'Permaneça sem ar antes de reiniciar',
          color: '#567571',
          caption: 'Aguarde sem ar nos pulmões por 4 segundos...',
        };
    }
  };

  const info = getPhaseInfo();

  // Coordenadas do quadrado (viewBox 180x180)
  const boxSize = 130;
  const offset = 25;

  let dotX = offset;
  let dotY = offset;

  if (phase === 'inhale') {
    // Lado superior: (offset, offset) -> (offset + boxSize, offset)
    dotX = offset + boxSize * sideProgressPercent;
    dotY = offset;
  } else if (phase === 'hold1') {
    // Lado direito: (offset + boxSize, offset) -> (offset + boxSize, offset + boxSize)
    dotX = offset + boxSize;
    dotY = offset + boxSize * sideProgressPercent;
  } else if (phase === 'exhale') {
    // Lado inferior: (offset + boxSize, offset + boxSize) -> (offset, offset + boxSize)
    dotX = offset + boxSize * (1 - sideProgressPercent);
    dotY = offset + boxSize;
  } else {
    // Lado esquerdo: (offset, offset + boxSize) -> (offset, offset)
    dotX = offset;
    dotY = offset + boxSize * (1 - sideProgressPercent);
  }

  return (
    <View
      style={[
        styles.videoStage,
        {
          backgroundColor: isDark ? '#11211F' : '#F0F6F4',
          borderColor: isDark ? '#1F3B37' : '#DCE9E5',
        },
      ]}
      aria-label="Vídeo demonstrativo de Respiração Quadrada"
      {...(Platform.OS === 'web' ? ({ role: 'region' } as any) : {})}
    >
      {/* 1. Indicador do Ciclo no Topo */}
      <View style={styles.topBarRow}>
        <View style={[styles.cycleBadge, { backgroundColor: isDark ? '#1A3330' : '#E0EFEA' }]}>
          <Text style={[styles.cycleBadgeText, { color: '#2F7F7C' }]}>
            Ciclo {cycleIndex} de {totalCycles}
          </Text>
        </View>
        <Text style={[styles.timeRemainingText, { color: isDark ? colors.textMuted : '#567571' }]}>
          {Math.floor((totalDurationSeconds - currentSecond) / 60)}:
          {((totalDurationSeconds - currentSecond) % 60).toString().padStart(2, '0')} restantes
        </Text>
      </View>

      {/* 2. Conteúdo Central: Personagem 2D + Quadrado Animado */}
      <View style={[styles.centerStageRow, !isDesktop && !isTablet && styles.centerStageColumn]}>
        {/* A. Ilustração 2D da Personagem Feminina Acolhedora */}
        <View style={styles.characterContainer}>
          <Svg width={140} height={160} viewBox="0 0 140 160">
            <Defs>
              <LinearGradient id="sereneBg" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={isDark ? '#1F3B37' : '#E3F2EC'} stopOpacity="0.8" />
                <Stop offset="1" stopColor={isDark ? '#11211F' : '#F0F6F4'} stopOpacity="0" />
              </LinearGradient>
            </Defs>

            {/* Fundo suave em arco */}
            <Circle cx="70" cy="80" r="60" fill="url(#sereneBg)" />

            {/* Planta de fundo decorativa */}
            <Path
              d="M20 120 Q15 90 28 80 Q32 100 24 125"
              fill={isDark ? '#264D47' : '#B8DCcf'}
            />
            <Path
              d="M120 120 Q125 90 112 80 Q108 100 116 125"
              fill={isDark ? '#264D47' : '#B8DCcf'}
            />

            {/* Corpo / Tronco da Personagem */}
            <Path
              d="M40 150 C40 115 50 105 70 105 C90 105 100 115 100 150 Z"
              fill={isDark ? '#2D5E57' : '#79B8A4'}
            />

            {/* Ombros e Colo com expansão suave na respiração */}
            <Path
              d="M48 112 Q70 118 92 112 Q85 102 70 102 Q55 102 48 112 Z"
              fill={isDark ? '#3D7870' : '#A3D4C5'}
            />

            {/* Cabeça / Pescoço */}
            <Rect x="65" y="82" width="10" height="22" rx="5" fill="#E8C3A9" />
            <Circle cx="70" cy="65" r="22" fill="#E8C3A9" />

            {/* Cabelo Acolhedor */}
            <Path
              d="M48 65 C48 45 60 40 70 40 C80 40 92 45 92 65 C92 75 88 80 88 80 C88 80 84 55 70 55 C56 55 52 80 52 80 C52 80 48 75 48 65 Z"
              fill="#4A3428"
            />
            {/* Coque / Cabelo preso sereno */}
            <Circle cx="70" cy="38" r="10" fill="#4A3428" />

            {/* Olhos serenos fechados em relaxamento */}
            <Path
              d="M59 66 Q64 70 69 66"
              fill="none"
              stroke="#5C4033"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Path
              d="M71 66 Q76 70 81 66"
              fill="none"
              stroke="#5C4033"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Sorriso sereno e nariz sutil */}
            <Path d="M70 71 L70 74" stroke="#D4A386" strokeWidth="1.5" strokeLinecap="round" />
            <Path
              d="M66 79 Q70 83 74 79"
              fill="none"
              stroke="#B36B59"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </Svg>
          <Text style={[styles.characterLabel, { color: isDark ? colors.textMuted : '#567571' }]}>
            Guia de Respiração
          </Text>
        </View>

        {/* B. Quadrado Animado Interativo */}
        <View style={styles.squareWrapper}>
          <Svg width={180} height={180} viewBox="0 0 180 180">
            {/* 4 Lados do Quadrado Base com Bordas Arredondadas */}
            <Rect
              x={offset}
              y={offset}
              width={boxSize}
              height={boxSize}
              rx="16"
              stroke={isDark ? '#1C3834' : '#CFE3DC'}
              strokeWidth="5"
              fill={isDark ? '#142725' : '#FFFFFF'}
            />

            {/* Lado Ativo Iluminado */}
            {phase === 'inhale' && (
              <Path
                d={`M${offset} ${offset} L${offset + boxSize} ${offset}`}
                stroke="#2F7F7C"
                strokeWidth="6"
                strokeLinecap="round"
              />
            )}
            {phase === 'hold1' && (
              <Path
                d={`M${offset + boxSize} ${offset} L${offset + boxSize} ${offset + boxSize}`}
                stroke="#79B8A4"
                strokeWidth="6"
                strokeLinecap="round"
              />
            )}
            {phase === 'exhale' && (
              <Path
                d={`M${offset + boxSize} ${offset + boxSize} L${offset} ${offset + boxSize}`}
                stroke="#D98968"
                strokeWidth="6"
                strokeLinecap="round"
              />
            )}
            {phase === 'hold2' && (
              <Path
                d={`M${offset} ${offset + boxSize} L${offset} ${offset}`}
                stroke="#567571"
                strokeWidth="6"
                strokeLinecap="round"
              />
            )}

            {/* Ponto / Marcador Guiado que Percorre o Perímetro */}
            <Circle cx={dotX} cy={dotY} r="7" fill={info.color} />
            <Circle cx={dotX} cy={dotY} r="3" fill="#FFFFFF" />
          </Svg>

          {/* Rótulos dos 4 Lados em volta do Quadrado */}
          <Text
            style={[
              styles.sideLabelTop,
              { color: phase === 'inhale' ? '#2F7F7C' : isDark ? colors.textMuted : '#8C9E9B' },
              phase === 'inhale' && styles.activeSideLabel,
            ]}
          >
            1. Inspire (4s)
          </Text>
          <Text
            style={[
              styles.sideLabelRight,
              { color: phase === 'hold1' ? '#79B8A4' : isDark ? colors.textMuted : '#8C9E9B' },
              phase === 'hold1' && styles.activeSideLabel,
            ]}
          >
            2. Segure (4s)
          </Text>
          <Text
            style={[
              styles.sideLabelBottom,
              { color: phase === 'exhale' ? '#D98968' : isDark ? colors.textMuted : '#8C9E9B' },
              phase === 'exhale' && styles.activeSideLabel,
            ]}
          >
            3. Expire (4s)
          </Text>
          <Text
            style={[
              styles.sideLabelLeft,
              { color: phase === 'hold2' ? '#567571' : isDark ? colors.textMuted : '#8C9E9B' },
              phase === 'hold2' && styles.activeSideLabel,
            ]}
          >
            4. Aguarde (4s)
          </Text>

          {/* Núcleo Central: Contagem e Nome da Etapa */}
          <View style={styles.squareCenterOverlay}>
            <Text style={[styles.stagePhaseTitle, { color: info.color }]}>
              {info.title}
            </Text>
            <Text style={[styles.stageCountdown, { color: isDark ? colors.text : '#173D3B' }]}>
              {phaseSecondRemaining}
            </Text>
            <Text style={[styles.stageInstructionMini, { color: isDark ? colors.textMuted : '#667775' }]}>
              {info.instruction}
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Legendas em Português (Closed Captions) */}
      {showCaptions && (
        <View style={styles.captionContainer}>
          <Text style={[styles.captionText, { color: isDark ? '#E7F3EF' : '#173D3B' }]}>
            {info.caption}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  videoStage: {
    width: '100%',
    aspectRatio: 16 / 9,
    minHeight: 280,
    maxHeight: 460,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  topBarRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  cycleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cycleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  timeRemainingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  centerStageRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  centerStageColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  characterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  squareWrapper: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sideLabelTop: {
    position: 'absolute',
    top: 4,
    fontSize: 9.5,
    fontWeight: '700',
  },
  sideLabelRight: {
    position: 'absolute',
    right: -10,
    fontSize: 9.5,
    fontWeight: '700',
    transform: [{ rotate: '90deg' }],
  },
  sideLabelBottom: {
    position: 'absolute',
    bottom: 4,
    fontSize: 9.5,
    fontWeight: '700',
  },
  sideLabelLeft: {
    position: 'absolute',
    left: -14,
    fontSize: 9.5,
    fontWeight: '700',
    transform: [{ rotate: '-90deg' }],
  },
  activeSideLabel: {
    fontWeight: '900',
    fontSize: 10.5,
  },
  squareCenterOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
  },
  stagePhaseTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  stageCountdown: {
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
  },
  stageInstructionMini: {
    fontSize: 8.5,
    textAlign: 'center',
    lineHeight: 11,
  },
  captionContainer: {
    width: '100%',
    backgroundColor: 'rgba(23, 61, 59, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  captionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
