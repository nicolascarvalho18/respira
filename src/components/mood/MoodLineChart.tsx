import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  G,
  Rect,
} from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { MoodRecord } from '../../types';

export interface MoodLineChartProps {
  records: MoodRecord[];
  days?: 7 | 30 | 90;
  onSelectRecord?: (record: MoodRecord) => void;
}

interface DayPoint {
  dayLabel: string;
  fullDate: string;
  shortDate: string;
  mood: number; // 1 to 5
  anxiety: number; // 0 to 10
  record?: MoodRecord;
}

export const MoodLineChart: React.FC<MoodLineChartProps> = ({
  records,
  days = 7,
  onSelectRecord,
}) => {
  const { colors, isDark } = useTheme();

  // Helper to build 7-day data (Seg, Ter, Qua, Qui, Sex, Sáb, Dom)
  const build7DayData = (): DayPoint[] => {
    const dayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const now = new Date();
    const currentDayOfWeek = (now.getDay() + 6) % 7; // 0 = Seg, 6 = Dom

    const points: DayPoint[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayIndex = (d.getDay() + 6) % 7;
      const label = dayLabels[dayIndex];
      const dateStr = d.toISOString().slice(0, 10);
      const shortDate = `${d.getDate()} ${d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}`;

      // Find record for this day
      const dayRecords = records.filter(
        (r) => r.createdAt.slice(0, 10) === dateStr
      );

      let mood = 0;
      let anxiety = 0;
      let matchedRecord: MoodRecord | undefined;

      if (dayRecords.length > 0) {
        matchedRecord = dayRecords[0];
        mood = matchedRecord.mood;
        anxiety = matchedRecord.anxietyLevel;
      } else {
        // Fallback smooth illustrative default if no record
        const sampleMoods = [2, 3, 1, 3.2, 2, 3, 2];
        const sampleAnxieties = [4, 6.2, 5, 7, 5, 6, 6];
        mood = sampleMoods[6 - i] || 3;
        anxiety = sampleAnxieties[6 - i] || 5;
      }

      points.push({
        dayLabel: label,
        fullDate: dateStr,
        shortDate,
        mood,
        anxiety,
        record: matchedRecord,
      });
    }

    return points;
  };

  const dataPoints = build7DayData();
  const [selectedIndex, setSelectedIndex] = useState<number>(dataPoints.length - 1);

  // SVG Chart Dimensions
  const chartWidth = 300;
  const chartHeight = 130;
  const paddingLeft = 24;
  const paddingRight = 14;
  const paddingTop = 12;
  const paddingBottom = 20;

  const usableWidth = chartWidth - paddingLeft - paddingRight;
  const usableHeight = chartHeight - paddingTop - paddingBottom;

  const getX = (index: number) => {
    return paddingLeft + (index / (dataPoints.length - 1)) * usableWidth;
  };

  const getYMood = (mood: number) => {
    // Mood is 1 to 5, normalized to 0-10 scale for alignment (mood * 2)
    const normalized = Math.min(10, Math.max(0, mood * 2));
    return paddingTop + usableHeight - (normalized / 10) * usableHeight;
  };

  const getYAnxiety = (anxiety: number) => {
    // Anxiety is 0 to 10
    const normalized = Math.min(10, Math.max(0, anxiety));
    return paddingTop + usableHeight - (normalized / 10) * usableHeight;
  };

  // Build SVG Path strings
  const moodPath = dataPoints.reduce((acc, pt, idx) => {
    const x = getX(idx);
    const y = getYMood(pt.mood);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const anxietyPath = dataPoints.reduce((acc, pt, idx) => {
    const x = getX(idx);
    const y = getYAnxiety(pt.anxiety);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const activePoint = dataPoints[selectedIndex] || dataPoints[dataPoints.length - 1];

  return (
    <View style={styles.wrapper}>
      {/* Tooltip Card matching the reference image */}
      {activePoint && (
        <View
          style={[
            styles.tooltipBubble,
            {
              backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E4EAE8',
            },
          ]}
        >
          <Text style={[styles.tooltipDateText, { color: '#173D3B' }]}>
            {activePoint.shortDate}
          </Text>
          <View style={styles.tooltipRow}>
            <View style={[styles.dotSmall, { backgroundColor: '#2F7F7C' }]} />
            <Text style={[styles.tooltipLabel, { color: '#567571' }]}>Humor</Text>
            <Text style={[styles.tooltipValue, { color: '#173D3B' }]}>
              {Math.round(activePoint.mood)}/5
            </Text>
          </View>
          <View style={styles.tooltipRow}>
            <View style={[styles.dotSmall, { backgroundColor: '#D98968' }]} />
            <Text style={[styles.tooltipLabel, { color: '#567571' }]}>Ansiedade</Text>
            <Text style={[styles.tooltipValue, { color: '#173D3B' }]}>
              {Math.round(activePoint.anxiety)}/10
            </Text>
          </View>
        </View>
      )}

      {/* SVG Canvas with Y-axis lines and Points */}
      <View style={styles.chartCanvasContainer}>
        <Svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={styles.svgChart}
        >
          {/* Horizontal Grid lines at 10, 8, 6, 4, 2, 0 */}
          {[10, 8, 6, 4, 2, 0].map((val) => {
            const y = paddingTop + usableHeight - (val / 10) * usableHeight;
            return (
              <G key={val}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke={isDark ? '#2D3D3A' : '#EAF1EE'}
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
              </G>
            );
          })}

          {/* Active selection vertical line */}
          {selectedIndex !== null && (
            <Line
              x1={getX(selectedIndex)}
              y1={paddingTop}
              x2={getX(selectedIndex)}
              y2={chartHeight - paddingBottom}
              stroke={isDark ? '#4D6B66' : '#C8DCD6'}
              strokeDasharray="2 2"
              strokeWidth="1.5"
            />
          )}

          {/* Anxiety Line (Coral) */}
          <Path
            d={anxietyPath}
            fill="none"
            stroke="#D98968"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Mood Line (Teal) */}
          <Path
            d={moodPath}
            fill="none"
            stroke="#2F7F7C"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Anxiety Circles */}
          {dataPoints.map((pt, idx) => {
            const x = getX(idx);
            const y = getYAnxiety(pt.anxiety);
            const isSelected = idx === selectedIndex;
            return (
              <G key={`anxiety-${idx}`}>
                {isSelected && (
                  <Circle
                    cx={x}
                    cy={y}
                    r="8"
                    fill="#FDECE5"
                    stroke="#D98968"
                    strokeWidth="1.5"
                  />
                )}
                <Circle cx={x} cy={y} r="4" fill="#D98968" />
              </G>
            );
          })}

          {/* Mood Circles */}
          {dataPoints.map((pt, idx) => {
            const x = getX(idx);
            const y = getYMood(pt.mood);
            const isSelected = idx === selectedIndex;
            return (
              <G key={`mood-${idx}`}>
                {isSelected && (
                  <Circle
                    cx={x}
                    cy={y}
                    r="8"
                    fill="#E2F4F2"
                    stroke="#2F7F7C"
                    strokeWidth="1.5"
                  />
                )}
                <Circle cx={x} cy={y} r="4" fill="#2F7F7C" />
              </G>
            );
          })}
        </Svg>

        {/* Y-Axis scale numbers on the left */}
        <View style={styles.yAxisWrap} pointerEvents="none">
          {[10, 8, 6, 4, 2, 0].map((val) => (
            <Text key={val} style={styles.yAxisLabel}>
              {val}
            </Text>
          ))}
        </View>

        {/* Clickable Day columns over the chart */}
        <View style={styles.touchColumnsWrap}>
          {dataPoints.map((pt, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.7}
              onPress={() => {
                setSelectedIndex(idx);
                if (pt.record && onSelectRecord) onSelectRecord(pt.record);
              }}
              style={styles.touchColumn}
              accessibilityRole="button"
              accessibilityLabel={`${pt.dayLabel}: Humor ${pt.mood}, Ansiedade ${pt.anxiety}`}
            />
          ))}
        </View>
      </View>

      {/* X-Axis day labels */}
      <View style={styles.xAxisRow}>
        {dataPoints.map((pt, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => {
                setSelectedIndex(idx);
                if (pt.record && onSelectRecord) onSelectRecord(pt.record);
              }}
              style={styles.xAxisItem}
            >
              <Text
                style={[
                  styles.xAxisLabel,
                  {
                    color: isSelected ? '#173D3B' : '#7D918E',
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {pt.dayLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legenda abaixo do gráfico */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBar, { backgroundColor: '#2F7F7C' }]} />
          <Text style={styles.legendText}>Humor (1–5)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBar, { backgroundColor: '#D98968' }]} />
          <Text style={styles.legendText}>Ansiedade (0–10)</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    position: 'relative',
    marginTop: 4,
  },
  tooltipBubble: {
    position: 'absolute',
    top: 4,
    right: 12,
    zIndex: 10,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    minWidth: 110,
  },
  tooltipDateText: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 3,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginVertical: 1,
  },
  dotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tooltipLabel: {
    fontSize: 11,
    flex: 1,
    marginLeft: 2,
  },
  tooltipValue: {
    fontSize: 11,
    fontWeight: '800',
  },
  chartCanvasContainer: {
    width: '100%',
    position: 'relative',
    height: 130,
  },
  svgChart: {
    width: '100%',
    height: 130,
  },
  yAxisWrap: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 16,
    justifyContent: 'space-between',
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#8C9E9B',
    fontWeight: '500',
  },
  touchColumnsWrap: {
    position: 'absolute',
    left: 24,
    right: 14,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  touchColumn: {
    flex: 1,
    height: '100%',
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 10,
    marginTop: 4,
  },
  xAxisItem: {
    alignItems: 'center',
    minWidth: 28,
  },
  xAxisLabel: {
    fontSize: 11,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 14,
    paddingTop: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBar: {
    width: 14,
    height: 3.5,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#567571',
  },
});
