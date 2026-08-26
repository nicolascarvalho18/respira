import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, Info, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { CorrelationInsight } from '../../services/analytics/correlationInsightsService';
import { useTheme } from '../../hooks/useTheme';

export interface CorrelationInsightsCardProps {
  insights: CorrelationInsight[];
}

export const CorrelationInsightsCard: React.FC<CorrelationInsightsCardProps> = ({
  insights,
}) => {
  const { colors, isDark } = useTheme();

  if (!insights || insights.length === 0) return null;

  const topInsight = insights[0];

  const getBadgeConfig = () => {
    switch (topInsight.confidence) {
      case 'consistent_pattern':
        return {
          label: 'TENDÊNCIA IDENTIFICADA',
          color: '#2F7F7C',
          bg: '#E7F3EF',
          icon: CheckCircle2,
        };
      case 'preliminary_observation':
        return {
          label: 'OBSERVAÇÃO PRELIMINAR',
          color: '#2F7F7C',
          bg: '#E7F3EF',
          icon: Sparkles,
        };
      case 'insufficient_data':
      default:
        return {
          label: 'DADOS PRELIMINARES',
          color: '#D98968',
          bg: '#FFF4EE',
          icon: AlertCircle,
        };
    }
  };

  const badge = getBadgeConfig();
  const BadgeIcon = badge.icon;

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
          borderColor: isDark ? colors.border : '#D8EBE4',
        },
      ]}
    >
      {/* Topo com Ícone e Badge */}
      <View style={styles.topRow}>
        <View style={[styles.badgeRow, { backgroundColor: badge.bg }]}>
          <BadgeIcon size={12} color={badge.color} style={{ marginRight: 4 }} />
          <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>

      {/* Título do Insight */}
      <Text
        accessibilityRole="header"
        aria-level={3}
        style={[styles.title, { color: isDark ? colors.text : '#173D3B' }]}
      >
        {topInsight.title}
      </Text>

      {/* Descrição Cuidadosa */}
      <Text style={[styles.description, { color: isDark ? colors.textMuted : '#4A6562' }]}>
        {topInsight.description}
      </Text>

      {/* Rodapé com Amostra e Aviso Legal */}
      <View style={styles.footerRow}>
        <Info size={11} color="#8C9E9B" style={{ marginRight: 4, marginTop: 1 }} />
        <Text style={styles.footerText}>
          {topInsight.sampleSize} registros em {topInsight.distinctDays} dias distintos • {topInsight.disclaimer}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: 'rgba(47, 127, 124, 0.15)',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 10,
    color: '#667775',
    lineHeight: 14,
    flex: 1,
  },
});
