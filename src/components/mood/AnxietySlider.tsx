import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface AnxietySliderProps {
  value: number | null; // 0 to 10 or null when unset
  onChange: (value: number) => void;
  disabled?: boolean;
  hideHeader?: boolean;
}

export const AnxietySlider: React.FC<AnxietySliderProps> = ({
  value,
  onChange,
  disabled = false,
  hideHeader = false,
}) => {
  const { colors, isDark } = useTheme();
  const [trackWidth, setTrackWidth] = useState(280);

  const currentValue = value ?? 0;
  const clampedValue = Math.min(10, Math.max(0, currentValue));
  const progressRatio = clampedValue / 10;

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0) {
      setTrackWidth(width);
    }
  };

  const handleTrackPress = (locationX: number) => {
    if (disabled || trackWidth <= 0) return;
    const ratio = Math.min(1, Math.max(0, locationX / trackWidth));
    const stepVal = Math.round(ratio * 10);
    onChange(stepVal);
  };

  return (
    <View style={styles.container}>
      {/* Valor Atual */}
      {!hideHeader && (
        <View style={styles.valueRow}>
          <Text
            style={[
              styles.currentValueText,
              { color: '#247B74' },
            ]}
          >
            {value !== null ? `${value} de 10` : '0 de 10'}
          </Text>
        </View>
      )}

      {/* Rótulos dos extremos (0 e 10) */}
      <View style={styles.topLabelsRow}>
        <Text style={[styles.endpointNumber, { color: isDark ? colors.text : '#1F2927' }]}>
          0
        </Text>
        <Text style={[styles.endpointNumber, { color: isDark ? colors.text : '#1F2927' }]}>
          10
        </Text>
      </View>

      {/* Slider Interativo */}
      <View
        style={styles.sliderContainer}
        onLayout={handleLayout}
        accessibilityRole="adjustable"
        accessibilityLabel={`Nível de ansiedade ${clampedValue} de 10`}
        accessibilityValue={{ min: 0, max: 10, now: clampedValue }}
        {...(Platform.OS === 'web'
          ? ({
              tabIndex: 0,
              onKeyDown: (e: React.KeyboardEvent) => {
                if (disabled) return;
                if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  onChange(Math.min(10, clampedValue + 1));
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  onChange(Math.max(0, clampedValue - 1));
                } else if (e.key === 'Home') {
                  e.preventDefault();
                  onChange(0);
                } else if (e.key === 'End') {
                  e.preventDefault();
                  onChange(10);
                }
              },
            } as any)
          : {})}
      >
        {/* Trilho base */}
        <View
          style={[
            styles.trackBg,
            { backgroundColor: isDark ? '#2D3835' : '#D8DEDB' },
          ]}
        />

        {/* Trilho preenchido */}
        <View
          style={[
            styles.trackFill,
            {
              width: `${progressRatio * 100}%`,
              backgroundColor: '#247B74',
            },
          ]}
        />

        {/* Marcações discretas (Ticks) */}
        {Array.from({ length: 11 }, (_, i) => {
          const tickRatio = i / 10;
          const isPassed = i <= clampedValue;
          return (
            <View
              key={i}
              style={[
                styles.tickDot,
                {
                  left: `${tickRatio * 100}%`,
                  backgroundColor: isPassed ? '#247B74' : isDark ? '#3D4D49' : '#C4CDCA',
                },
              ]}
            />
          );
        })}

        {/* Knob (Thumb) */}
        <View
          style={[
            styles.thumbKnob,
            {
              left: `${progressRatio * 100}%`,
              backgroundColor: '#247B74',
              borderColor: '#FFFFFF',
            },
          ]}
        />

        {/* Zonas de Toque Acessíveis para cada passo de 0 a 10 */}
        <View style={styles.touchAreaRow}>
          {Array.from({ length: 11 }, (_, num) => (
            <TouchableOpacity
              key={num}
              disabled={disabled}
              onPress={() => onChange(num)}
              accessibilityRole="radio"
              accessibilityLabel={`Nível de ansiedade ${num} de 10`}
              accessibilityState={{ checked: value === num, selected: value === num }}
              style={styles.touchStep}
              activeOpacity={0.7}
            />
          ))}
        </View>
      </View>

      {/* Rótulos Descritivos Inferiores */}
      <View style={styles.bottomLabelsRow}>
        <Text style={[styles.bottomLabelText, { color: isDark ? colors.textMuted : '#68736F' }]}>
          Tranquilo
        </Text>
        <Text style={[styles.bottomLabelText, { color: isDark ? colors.textMuted : '#68736F' }]}>
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
    marginBottom: 8,
  },
  currentValueText: {
    fontSize: 16,
    fontWeight: '600',
  },
  topLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  endpointNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  sliderContainer: {
    height: 32,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  trackBg: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    position: 'absolute',
  },
  trackFill: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
  },
  tickDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: -2,
    top: 14,
  },
  thumbKnob: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    marginLeft: -11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
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
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  bottomLabelText: {
    fontSize: 13,
    fontWeight: '400',
  },
});

