import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  G,
} from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { MoodRecord } from '../../types';

export interface MoodLineChartProps {
  records: MoodRecord[];
  days?: 7 | 30 | 90;
  metric?: 'mood' | 'anxiety';
  onNavigateNew?: () => void;
  isLoading?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
}

export interface ChartDayPoint {
  dateStr: string;
  dayLabel: string;
  fullDateLabel: string;
  value: number; // Média diária calculada
  classification: string;
  count: number; // Quantidade de registros no dia
  records: MoodRecord[];
}

export const MoodLineChart: React.FC<MoodLineChartProps> = ({
  records,
  days = 30,
  metric = 'anxiety',
  onNavigateNew,
  isLoading = false,
  hasError = false,
  onRetry,
}) => {
  const { colors, isDark } = useTheme();
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(360);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 50 && Math.abs(w - containerWidth) > 2) {
      setContainerWidth(w);
    }
  };

  // 1. Filtrar registros dentro do período selecionado (7, 30 ou 90 dias)
  const now = new Date();
  const cutoffTime = now.getTime() - days * 24 * 60 * 60 * 1000;
  const periodRecords = records.filter((r) => {
    const time = new Date(r.createdAt).getTime();
    return !isNaN(time) && time >= cutoffTime;
  });

  // 2. Agregação por dia (sem inventar dias vazios)
  const dailyGroups: Record<string, MoodRecord[]> = {};
  periodRecords.forEach((r) => {
    const dayKey = r.createdAt.slice(0, 10);
    if (!dailyGroups[dayKey]) {
      dailyGroups[dayKey] = [];
    }
    dailyGroups[dayKey].push(r);
  });

  // Ordenar cronologicamente: do mais antigo para o mais recente
  const sortedDates = Object.keys(dailyGroups).sort(
    (a, b) => new Date(a + 'T12:00:00').getTime() - new Date(b + 'T12:00:00').getTime()
  );

  const getAnxietyClassification = (score: number) => {
    if (score <= 2) return 'Tranquilo';
    if (score <= 4) return 'Leve';
    if (score <= 6) return 'Moderado';
    if (score <= 8) return 'Elevado';
    return 'Intenso';
  };

  const getMoodClassification = (score: number) => {
    if (score >= 4.5) return 'Muito bem';
    if (score >= 3.5) return 'Bem';
    if (score >= 2.5) return 'Neutro';
    if (score >= 1.5) return 'Difícil';
    return 'Muito difícil';
  };

  // Construir data points reais com datas em português
  const dataPoints: ChartDayPoint[] = sortedDates.map((dateStr) => {
    const dayRecs = dailyGroups[dateStr];
    const sum = dayRecs.reduce(
      (acc, r) => acc + (metric === 'mood' ? r.mood : r.anxietyLevel),
      0
    );
    const avg = sum / dayRecs.length;

    const d = new Date(dateStr + 'T12:00:00');
    const dayOfMonth = d.getDate();
    const monthShort = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    const dayLabel = `${dayOfMonth} ${monthShort}`;

    const classification = metric === 'mood'
      ? getMoodClassification(avg)
      : getAnxietyClassification(avg);

    return {
      dateStr,
      dayLabel,
      fullDateLabel: d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }),
      value: Number(avg.toFixed(1)),
      classification,
      count: dayRecs.length,
      records: dayRecs,
    };
  });

  // Estado de Carregamento
  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <View style={[styles.skeletonLine, { backgroundColor: isDark ? '#2A3634' : '#E8ECEA' }]} />
        <View style={[styles.skeletonLineShort, { backgroundColor: isDark ? '#2A3634' : '#E8ECEA' }]} />
      </View>
    );
  }

  // Estado de Erro
  if (hasError) {
    return (
      <View style={styles.stateContainer}>
        <Text style={[styles.stateTitle, { color: isDark ? '#FFFFFF' : '#17211F' }]}>
          Não foi possível carregar o resumo.
        </Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Estado Sem Registros no Período (Mensagem Obrigatória)
  if (dataPoints.length === 0) {
    return (
      <View style={styles.stateContainer}>
        <Text style={[styles.stateTitle, { color: isDark ? '#FFFFFF' : '#17211F' }]}>
          Você ainda não possui registros neste período.
        </Text>
        <Text style={[styles.stateSubtitle, { color: isDark ? '#F1F5F9' : '#66726F' }]}>
          Faça um check-in diário para acompanhar suas tendências ao longo do tempo.
        </Text>
        {onNavigateNew && (
          <TouchableOpacity onPress={onNavigateNew} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>+ Registrar momento</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Dimensões do Gráfico (Altura de 240px)
  const chartWidth = Math.max(280, containerWidth);
  const chartHeight = 240;
  const paddingLeft = 32; // Espaço para rótulos do eixo Y
  const paddingRight = 16;
  const paddingTop = 24;
  const paddingBottom = 34;

  const usableWidth = chartWidth - paddingLeft - paddingRight;
  const usableHeight = chartHeight - paddingTop - paddingBottom;

  // Escala Vertical de 1 a 5 (ou 0 a 10)
  const minY = metric === 'mood' ? 1 : 0;
  const maxY = metric === 'mood' ? 5 : 10;
  const rangeY = maxY - minY;

  const scaleY = (val: number) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    return paddingTop + usableHeight - ((clamped - minY) / rangeY) * usableHeight;
  };

  const scaleX = (index: number) => {
    if (dataPoints.length === 1) {
      return paddingLeft + usableWidth / 2;
    }
    return paddingLeft + (index / (dataPoints.length - 1)) * usableWidth;
  };

  // Linha verde-petróleo (~2px)
  const lineColor = isDark ? '#5ECFC3' : '#1F766E';
  const pointFillColor = isDark ? '#5ECFC3' : '#1F766E';
  const gridColor = isDark ? '#334155' : '#E8EDEA';

  // Gerar coordenadas dos pontos
  const pointsCoords = dataPoints.map((p, idx) => ({
    x: scaleX(idx),
    y: scaleY(p.value),
    point: p,
  }));

  let pathLine = '';
  if (pointsCoords.length > 1) {
    pathLine = `M ${pointsCoords[0].x} ${pointsCoords[0].y}`;
    for (let i = 1; i < pointsCoords.length; i++) {
      pathLine += ` L ${pointsCoords[i].x} ${pointsCoords[i].y}`;
    }
  }

  // Eixo Y: 5 níveis discretos
  const yTicks = metric === 'mood' ? [1, 2, 3, 4, 5] : [0, 2.5, 5, 7.5, 10];

  // Rótulos do Eixo X em português
  const getVisibleXLabels = () => {
    if (dataPoints.length <= 5) {
      return dataPoints.map((p, idx) => ({ index: idx, label: p.dayLabel, x: scaleX(idx) }));
    }
    const step = (dataPoints.length - 1) / 4;
    const visible = [];
    for (let i = 0; i < 5; i++) {
      const idx = Math.round(i * step);
      if (idx < dataPoints.length) {
        visible.push({ index: idx, label: dataPoints[idx].dayLabel, x: scaleX(idx) });
      }
    }
    return visible;
  };

  const xLabels = getVisibleXLabels();
  const selectedPoint = selectedPointIndex !== null ? dataPoints[selectedPointIndex] : null;

  return (
    <View
      onLayout={handleLayout}
      style={styles.chartWrapper}
      {...(Platform.OS === 'web'
        ? ({
            role: 'region',
            'aria-label': `Gráfico de evolução de ${metric === 'mood' ? 'humor' : 'ansiedade'} no período de ${days} dias`,
          } as any)
        : {})}
    >
      {/* Explicação discreta da escala */}
      <View style={styles.scaleExplanationRow}>
        <Text style={[styles.scaleExplanationText, { color: isDark ? '#F1F5F9' : '#66726F' }]}>
          {metric === 'mood'
            ? 'Escala: 1 (Muito difícil) a 5 (Muito bem)'
            : 'Escala: 0–2 (Tranquilo) a 9–10 (Intenso)'}
        </Text>
      </View>

      {/* SVG Canvas do Gráfico */}
      <View style={styles.svgContainer}>
        <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* Grade Horizontal Leve */}
          <G>
            {yTicks.map((tick) => {
              const y = scaleY(tick);
              return (
                <Line
                  key={`grid-${tick}`}
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke={gridColor}
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
              );
            })}
          </G>

          {/* Linha Verde-Petróleo ~2px (renderizada apenas se houver mais de 1 ponto) */}
          {pathLine ? (
            <Path
              d={pathLine}
              fill="none"
              stroke={lineColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {/* Pontos Pequenos e Bem Definidos */}
          {pointsCoords.map((pt, idx) => {
            const isSelected = selectedPointIndex === idx;
            return (
              <G key={`circle-${idx}`}>
                <Circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 6 : 4}
                  fill={pointFillColor}
                  stroke={isDark ? '#1F2937' : '#FFFFFF'}
                  strokeWidth={2}
                />
              </G>
            );
          })}
        </Svg>

        {/* Eixo Vertical 1 a 5 */}
        <View style={[styles.yAxisLabels, { top: paddingTop - 8, height: usableHeight + 16, width: paddingLeft }]}>
          {metric === 'mood' ? (
            <>
              <Text style={[styles.axisText, { color: isDark ? '#F1F5F9' : '#66726F' }]}>5</Text>
              <Text style={[styles.axisText, { color: isDark ? '#F1F5F9' : '#66726F' }]}>4</Text>
              <Text style={[styles.axisText, { color: isDark ? '#F1F5F9' : '#66726F' }]}>3</Text>
              <Text style={[styles.axisText, { color: isDark ? '#F1F5F9' : '#66726F' }]}>2</Text>
              <Text style={[styles.axisText, { color: isDark ? '#F1F5F9' : '#66726F' }]}>1</Text>
            </>
          ) : (
            <>
              <Text style={[styles.axisText, { color: isDark ? '#F1F5F9' : '#66726F' }]}>10</Text>
              <Text style={[styles.axisText, { color: isDark ? '#F1F5F9' : '#66726F' }]}>8</Text>
              <Text style={[styles.axisText, { color: isDark ? '#F1F5F9' : '#66726F' }]}>5</Text>
              <Text style={[styles.axisText, { color: isDark ? '#F1F5F9' : '#66726F' }]}>3</Text>
              <Text style={[styles.axisText, { color: isDark ? '#F1F5F9' : '#66726F' }]}>0</Text>
            </>
          )}
        </View>

        {/* Touch Targets para Interatividade */}
        {pointsCoords.map((pt, idx) => (
          <TouchableOpacity
            key={`touch-${idx}`}
            onPress={() => {
              setSelectedPointIndex(selectedPointIndex === idx ? null : idx);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${pt.point.fullDateLabel}: ${metric === 'mood' ? 'Humor' : 'Ansiedade'} ${pt.point.value.toString().replace('.', ',')}, ${pt.point.classification}`}
            style={[
              styles.touchTarget,
              {
                left: `${(pt.x / chartWidth) * 100}%`,
                top: `${(pt.y / chartHeight) * 100}%`,
              },
            ]}
          />
        ))}

        {/* Tooltip com Data, Valor e Classificação */}
        {selectedPoint && selectedPointIndex !== null && (
          <View
            style={[
              styles.tooltipCard,
              {
                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#D0DCD7',
                left: Math.min(
                  chartWidth - 140,
                  Math.max(10, scaleX(selectedPointIndex) - 65)
                ),
                top: Math.max(4, scaleY(selectedPoint.value) - 64),
              },
            ]}
          >
            <Text style={[styles.tooltipDate, { color: isDark ? '#FFFFFF' : '#17211F' }]}>
              {selectedPoint.fullDateLabel}
            </Text>
            <Text style={[styles.tooltipValue, { color: lineColor }]}>
              {metric === 'mood' ? 'Humor: ' : 'Ansiedade: '}
              <Text style={{ fontWeight: '700' }}>
                {selectedPoint.value.toString().replace('.', ',')}
                {metric === 'mood' ? ' / 5' : ' / 10'}
              </Text>
            </Text>
            <Text style={[styles.tooltipClassification, { color: isDark ? '#F1F5F9' : '#596B68' }]}>
              {selectedPoint.classification} ({selectedPoint.count} {selectedPoint.count === 1 ? 'registro' : 'registros'})
            </Text>
          </View>
        )}
      </View>

      {/* Rótulos do Eixo X em Português (Ex: "22 ago", "28 ago") */}
      <View
        style={[
          styles.xAxisLabelsRow,
          {
            paddingLeft: paddingLeft,
            paddingRight: paddingRight,
          },
        ]}
      >
        {xLabels.map((lbl, idx) => (
          <Text
            key={`xlbl-${idx}`}
            style={[styles.xAxisText, { color: isDark ? '#F1F5F9' : '#66726F' }]}
          >
            {lbl.label}
          </Text>
        ))}
      </View>

      {/* Com apenas 1 registro: aviso suave */}
      {dataPoints.length === 1 && (
        <Text style={[styles.singlePointHint, { color: isDark ? '#F1F5F9' : '#66726F' }]}>
          1 registro exibido. Registre mais dias para visualizar a linha de tendência.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  chartWrapper: {
    width: '100%',
    paddingVertical: 4,
  },
  scaleExplanationRow: {
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  scaleExplanationText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  svgContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  yAxisLabels: {
    position: 'absolute',
    left: 0,
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  axisText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'left',
    paddingLeft: 4,
  },
  xAxisLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  xAxisText: {
    fontSize: 11,
    fontWeight: '400',
  },
  touchTarget: {
    position: 'absolute',
    width: 32,
    height: 32,
    marginLeft: -16,
    marginTop: -16,
    zIndex: 5,
  },
  tooltipCard: {
    position: 'absolute',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  tooltipDate: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  tooltipValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  tooltipClassification: {
    fontSize: 10,
    marginTop: 2,
  },
  singlePointHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
  stateContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  stateTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  stateSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1F766E',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  skeletonLine: {
    width: '80%',
    height: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonLineShort: {
    width: '50%',
    height: 12,
    borderRadius: 6,
  },
});
