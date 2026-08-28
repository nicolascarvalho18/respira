import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  LayoutChangeEvent,
  PanResponder,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface AnxietySliderProps {
  value: number | null; // 0 to 10 or null when unset
  onChange: (value: number) => void;
  disabled?: boolean;
  hideHeader?: boolean;
}

export const ANXIETY_DESCRIPTIONS = [
  'Tranquilo', // 0
  'Tranquilo', // 1
  'Tranquilo', // 2
  'Leve',      // 3
  'Leve',      // 4
  'Moderado',  // 5
  'Moderado',  // 6
  'Elevado',   // 7
  'Elevado',   // 8
  'Intenso',   // 9
  'Intenso',   // 10
];

export const AnxietySlider: React.FC<AnxietySliderProps> = ({
  value,
  onChange,
  disabled = false,
  hideHeader = false,
}) => {
  const { colors, isDark } = useTheme();
  const [trackWidth, setTrackWidth] = useState(300);
  const trackRef = useRef<View>(null);

  const currentValue = value ?? 3;
  const clampedValue = Math.min(10, Math.max(0, Math.round(currentValue)));
  const progressRatio = clampedValue / 10;
  const description = ANXIETY_DESCRIPTIONS[clampedValue] || 'Tranquilo';

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0) {
      setTrackWidth(width);
    }
  };

  const updateFromPosition = (locationX: number) => {
    if (disabled || trackWidth <= 0) return;
    const ratio = Math.min(1, Math.max(0, locationX / trackWidth));
    const stepVal = Math.min(10, Math.max(0, Math.round(ratio * 10)));
    onChange(stepVal);
  };

  // PanResponder para dispositivos móveis nativos (iOS e Android)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (evt) => {
        updateFromPosition(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        updateFromPosition(evt.nativeEvent.locationX);
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (evt) => {
        updateFromPosition(evt.nativeEvent.locationX);
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* 1. Valor Atual no Topo (“X de 10”) */}
      {!hideHeader && (
        <View style={styles.valueRow}>
          <Text
            style={[
              styles.currentValueText,
              { color: isDark ? '#5ECFC3' : '#238C82' },
            ]}
          >
            {`${clampedValue} de 10`}
          </Text>
        </View>
      )}

      {/* 2. Rótulos dos Extremos (0 e 10) */}
      <View style={styles.topLabelsRow}>
        <Text style={[styles.endpointNumber, { color: isDark ? '#FFFFFF' : '#1F2927' }]}>
          0
        </Text>
        <Text style={[styles.endpointNumber, { color: isDark ? '#FFFFFF' : '#1F2927' }]}>
          10
        </Text>
      </View>

      {/* 3. Slider Interativo Responsivo */}
      <View
        ref={trackRef}
        style={styles.sliderContainer}
        onLayout={handleLayout}
        {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
        accessibilityRole="adjustable"
        aria-label="Nível de ansiedade"
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={clampedValue}
        aria-valuetext={description}
      >
        {/* Trilho base cinza */}
        <View
          style={[
            styles.trackBg,
            { backgroundColor: isDark ? '#334155' : '#E2E8F0' },
          ]}
        />

        {/* Trilho preenchido verde-água (sem bolinhas intermediárias) */}
        <View
          style={[
            styles.trackFill,
            {
              width: `${progressRatio * 100}%`,
              backgroundColor: isDark ? '#5ECFC3' : '#238C82',
            },
          ]}
        />

        {/* Círculo / Knob (28px de diâmetro, sombra e borda branca de 2.5px) */}
        <View
          pointerEvents="none"
          style={[
            styles.thumbKnob,
            {
              left: `${progressRatio * 100}%`,
              backgroundColor: isDark ? '#5ECFC3' : '#238C82',
              borderColor: '#FFFFFF',
            },
          ]}
        />

        {/* No Web: Input Range real com toque fluido e acessibilidade nativa */}
        {Platform.OS === 'web' && (
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={clampedValue}
            disabled={disabled}
            onChange={(e) => onChange(Number(e.target.value))}
            onInput={(e: any) => onChange(Number(e.target.value))}
            aria-label="Nível de ansiedade"
            aria-valuemin={0}
            aria-valuemax={10}
            aria-valuenow={clampedValue}
            aria-valuetext={description}
            className="anxiety-slider-input"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: 44,
              opacity: 0,
              cursor: disabled ? 'not-allowed' : 'pointer',
              touchAction: 'pan-y',
              margin: 0,
              zIndex: 10,
            }}
          />
        )}

        {/* Passos acessíveis para Screen Readers e Testes Automatizados */}
        <View style={styles.touchAreaRow} pointerEvents={Platform.OS === 'web' ? 'none' : 'auto'}>
          {Array.from({ length: 11 }, (_, num) => (
            <TouchableOpacity
              key={num}
              disabled={disabled}
              onPress={() => onChange(num)}
              accessibilityRole="radio"
              accessibilityLabel={`Nível de ansiedade ${num} de 10: ${ANXIETY_DESCRIPTIONS[num]}`}
              accessibilityState={{ checked: clampedValue === num, selected: clampedValue === num }}
              style={styles.touchStep}
              activeOpacity={1}
            />
          ))}
        </View>
      </View>

      {/* 4. Rótulos Descritivos Inferiores ("Tranquilo" e "Intenso") */}
      <View style={styles.bottomLabelsRow}>
        <Text style={[styles.bottomLabelText, { color: isDark ? '#CBD5E1' : '#708885' }]}>
          Tranquilo
        </Text>
        <Text style={[styles.bottomLabelText, { color: isDark ? '#CBD5E1' : '#708885' }]}>
          Intenso
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  valueRow: {
    marginBottom: 6,
  },
  currentValueText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  topLabelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  endpointNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  sliderContainer: {
    height: 44,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  trackBg: {
    height: 7,
    borderRadius: 3.5,
    width: '100%',
    position: 'absolute',
  },
  trackFill: {
    height: 7,
    borderRadius: 3.5,
    position: 'absolute',
  },
  thumbKnob: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    marginLeft: -14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  touchAreaRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  touchStep: {
    flex: 1,
    height: '100%',
  },
  bottomLabelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  bottomLabelText: {
    fontSize: 13.5,
    fontWeight: '500',
  },
});
