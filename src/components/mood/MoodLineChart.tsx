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
  count: number; // Quantidade de registros no dia
  records: MoodRecord[];
}

export const MoodLineChart: React.FC<MoodLineChartProps> = ({
  records,
  days = 30,
  metric = 'mood',
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
    return time >= cutoffTime;
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

  // Ordenar cronologicamente
  const sortedDates = Object.keys(dailyGroups).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  // Construir data points reais
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

    return {
      dateStr,
      dayLabel,
      fullDateLabel: d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
      value: Number(avg.toFixed(2)),
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
        <Text style={[styles.stateTitle, { color: isDark ? colors.text : '#1F2927' }]}>
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

  // Estado Sem Dados no Período
  if (dataPoints.length === 0) {
    return (
      <View style={styles.stateContainer}>
        <Text style={[styles.stateTitle, { color: isDark ? colors.text : '#1F2927' }]}>
          Ainda não há dados neste período
        </Text>
        <Text style={[styles.stateSubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
          Registre como você está para começar a acompanhar suas mudanças.
        </Text>
        {onNavigateNew && (
          <TouchableOpacity onPress={onNavigateNew} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Registrar momento</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Dimensões do Gráfico Mais Amplo e Aberto nas Laterais
  const chartWidth = Math.max(280, containerWidth);
  const chartHeight = 185;
  const paddingLeft = 20; // Espaço compacto para os números 5, 4, 3, 2, 1
  const paddingRight = 6;  // Linha estende até a extremidade direita
  const paddingTop = 16;
  const paddingBottom = 24;

  const usableWidth = chartWidth - paddingLeft - paddingRight;
  const usableHeight = chartHeight - paddingTop - paddingBottom;

  // Escala Vertical
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

  // Cores conforme design system
  const lineColor = metric === 'mood' ? '#247B74' : '#D87556';
  const areaColor = metric === 'mood' ? 'rgba(36, 123, 116, 0.05)' : 'rgba(216, 117, 86, 0.05)';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : '#E8ECEA';

  // Gerar caminho SVG para a linha e a área
  const pointsCoords = dataPoints.map((p, idx) => ({
    x: scaleX(idx),
    y: scaleY(p.value),
    point: p,
  }));

  let pathLine = '';
  let pathArea = '';

  if (pointsCoords.length > 1) {
    pathLine = `M ${pointsCoords[0].x} ${pointsCoords[0].y}`;
    for (let i = 1; i < pointsCoords.length; i++) {
      pathLine += ` L ${pointsCoords[i].x} ${pointsCoords[i].y}`;
    }

    const firstX = pointsCoords[0].x;
    const lastX = pointsCoords[pointsCoords.length - 1].x;
    const bottomY = scaleY(minY);
    pathArea = `${pathLine} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }

  // Linhas de Grade Horizontal
  const yTicks = metric === 'mood' ? [1, 2, 3, 4, 5] : [0, 2, 4, 6, 8, 10];

  // Rótulos do Eixo X com limite de exibição (máximo 6)
  const getVisibleXLabels = () => {
    if (dataPoints.length <= 6) {
      return dataPoints.map((p, idx) => ({ index: idx, label: p.dayLabel, x: scaleX(idx) }));
    }
    // Selecionar no máximo 6 pontos uniformemente distribuídos
    const step = (dataPoints.length - 1) / 5;
    const visible = [];
    for (let i = 0; i < 6; i++) {
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
            'aria-label': `Gráfico de evolução de ${metric === 'mood' ? 'Humor' : 'Ansiedade'} no período de ${days} dias`,
          } as any)
        : {})}
    >
      {/* Tabela Oculta para Leitores de Tela (Acessibilidade WCAG) */}
      {Platform.OS === 'web' && (
        <table style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
          <caption>Dados de {metric === 'mood' ? 'Humor' : 'Ansiedade'} no período de {days} dias</caption>
          <thead>
            <tr>
              <th scope="col">Data</th>
              <th scope="col">{metric === 'mood' ? 'Humor (1 a 5)' : 'Ansiedade (0 a 10)'}</th>
              <th scope="col">Registros</th>
            </tr>
          </thead>
          <tbody>
            {dataPoints.map((p, idx) => (
              <tr key={idx}>
                <td>{p.fullDateLabel}</td>
                <td>{p.value.toString().replace('.', ',')}</td>
                <td>{p.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* SVG Canvas do Gráfico (Expandido de ponta a ponta) */}
      <View style={styles.svgContainer}>
        <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* 1. Grade Horizontal Discreta */}
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
                  strokeDasharray="2,2"
                />
              );
            })}
          </G>

          {/* 2. Área Preenchida Suave (5% opacidade) */}
          {pathArea ? <Path d={pathArea} fill={areaColor} /> : null}

          {/* 3. Linha Principal */}
          {pathLine ? (
            <Path
              d={pathLine}
              fill="none"
              stroke={lineColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {/* 4. Marcadores Circulares Interativos (6px) */}
          {pointsCoords.map((pt, idx) => {
            const isSelected = selectedPointIndex === idx;
            return (
              <G key={`circle-${idx}`}>
                <Circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 6.5 : 4.5}
                  fill={lineColor}
                  stroke={isDark ? '#1F2927' : '#FFFFFF'}
                  strokeWidth={isSelected ? 2.5 : 1.8}
                />
              </G>
            );
          })}
        </Svg>

        {/* 5. Escala Y nos Textos à Esquerda */}
        <View style={[styles.yAxisLabels, { top: paddingTop - 8, height: usableHeight + 16 }]}>
          {metric === 'mood' ? (
            <>
              <Text style={[styles.axisText, { color: isDark ? colors.textMuted : '#8F9B97' }]}>5</Text>
              <Text style={[styles.axisText, { color: isDark ? colors.textMuted : '#8F9B97' }]}>4</Text>
              <Text style={[styles.axisText, { color: isDark ? colors.textMuted : '#8F9B97' }]}>3</Text>
              <Text style={[styles.axisText, { color: isDark ? colors.textMuted : '#8F9B97' }]}>2</Text>
              <Text style={[styles.axisText, { color: isDark ? colors.textMuted : '#8F9B97' }]}>1</Text>
            </>
          ) : (
            <>
              <Text style={[styles.axisText, { color: isDark ? colors.textMuted : '#8F9B97' }]}>10</Text>
              <Text style={[styles.axisText, { color: isDark ? colors.textMuted : '#8F9B97' }]}>5</Text>
              <Text style={[styles.axisText, { color: isDark ? colors.textMuted : '#8F9B97' }]}>0</Text>
            </>
          )}
        </View>

        {/* 6. Touch Targets Transparentes sobre cada ponto */}
        {pointsCoords.map((pt, idx) => (
          <TouchableOpacity
            key={`touch-${idx}`}
            onPress={() => {
              setSelectedPointIndex(selectedPointIndex === idx ? null : idx);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${pt.point.fullDateLabel}: ${metric === 'mood' ? 'Humor' : 'Ansiedade'} ${pt.point.value.toString().replace('.', ',')}, ${pt.point.count} ${pt.point.count === 1 ? 'registro' : 'registros'}`}
            style={[
              styles.touchTarget,
              {
                left: `${(pt.x / chartWidth) * 100}%`,
                top: `${(pt.y / chartHeight) * 100}%`,
              },
            ]}
          />
        ))}

        {/* 7. Tooltip Flutuante */}
        {selectedPoint && selectedPointIndex !== null && (
          <View
            style={[
              styles.tooltipCard,
              {
                backgroundColor: isDark ? '#172033' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#DDE6E3',
                left: Math.min(
                  chartWidth - 120,
                  Math.max(10, scaleX(selectedPointIndex) - 55)
                ),
                top: Math.max(5, scaleY(selectedPoint.value) - 60),
              },
            ]}
          >
            <Text style={[styles.tooltipDate, { color: isDark ? colors.text : '#1F2927' }]}>
              {selectedPoint.fullDateLabel}
            </Text>
            <Text style={[styles.tooltipValue, { color: lineColor, fontWeight: '700' }]}>
              {metric === 'mood' ? 'Humor' : 'Ansiedade'}: {selectedPoint.value.toString().replace('.', ',')}
              {metric === 'mood' ? '/5' : '/10'}
            </Text>
            <Text style={[styles.tooltipCount, { color: isDark ? colors.textMuted : '#68736F' }]}>
              {selectedPoint.count} {selectedPoint.count === 1 ? 'registro' : 'registros'}
            </Text>
          </View>
        )}
      </View>

      {/* 8. Rótulos do Eixo X Alinhados com a Largura Total */}
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
            style={[styles.xAxisText, { color: isDark ? colors.textMuted : '#8F9B97' }]}
          >
            {lbl.label}
          </Text>
        ))}
      </View>

      {/* Mensagem Auxiliar para Caso de Registro Único */}
      {dataPoints.length === 1 && (
        <Text style={[styles.singlePointHint, { color: isDark ? colors.textMuted : '#68736F' }]}>
          Adicione mais registros para visualizar a evolução.
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
  svgContainer: {
    width: '100%',
    height: 185,
    position: 'relative',
  },
  yAxisLabels: {
    position: 'absolute',
    left: 0,
    width: 16,
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  axisText: {
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
  },
  xAxisLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  xAxisText: {
    fontSize: 11,
    fontWeight: '400',
  },
  touchTarget: {
    position: 'absolute',
    width: 36,
    height: 36,
    marginLeft: -18,
    marginTop: -18,
    borderRadius: 18,
    zIndex: 5,
  },
  tooltipCard: {
    position: 'absolute',
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    minWidth: 110,
    alignItems: 'center',
  },
  tooltipDate: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  tooltipValue: {
    fontSize: 12,
  },
  tooltipCount: {
    fontSize: 10,
    marginTop: 2,
  },
  stateContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  stateTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 14,
    maxWidth: 280,
  },
  actionBtn: {
    backgroundColor: '#247B74',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  singlePointHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  skeletonLine: {
    width: '80%',
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonLineShort: {
    width: '50%',
    height: 12,
    borderRadius: 6,
  },
});
