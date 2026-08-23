import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, TrendingDown, Info } from 'lucide-react-native';
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
        <View style={styles.badgeRow}>
          <Sparkles size={13} color="#2F7F7C" style={{ marginRight: 4 }} />
          <Text style={styles.badgeText}>INSIGHT BASEADO NOS SEUS REGISTROS</Text>
        </View>
      </View>

      {/* Título do Insight */}
      <Text style={[styles.title, { color: '#173D3B' }]}>
        {topInsight.title}
      </Text>

      {/* Descrição Cuidadosa */}
      <Text style={[styles.description, { color: '#567571' }]}>
        {topInsight.description}
      </Text>

      {/* Rodapé Metadados */}
      <View style={styles.footerRow}>
        <Info size={11} color="#8C9E9B" style={{ marginRight: 4 }} />
        <Text style={styles.footerText}>
          Baseado em {topInsight.sampleSize} registros • {topInsight.periodDescription}
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
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2F7F7C',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#8C9E9B',
  },
});
