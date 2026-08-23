import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Award, Flame, Calendar } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

export interface ProgressCardProps {
  totalCheckins: number;
  streakDays?: number;
  averageMood: number;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  totalCheckins,
  streakDays = 3,
  averageMood,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
          borderColor: colors.border,
        },
      ]}
      accessibilityRole="summary"
    >
      <View style={styles.header}>
        <Award size={20} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={[styles.title, { color: colors.text }]}>Seu Cuidado Contínuo</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={[styles.iconBubble, { backgroundColor: colors.highlight }]}>
            <Calendar size={18} color={colors.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{totalCheckins}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Registros</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={[styles.iconBubble, { backgroundColor: '#FFF5F0' }]}>
            <Flame size={18} color={colors.warning} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{streakDays} dias</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Sequência</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={[styles.iconBubble, { backgroundColor: colors.highlight }]}>
            <Text style={{ fontSize: 14 }}>🌿</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {averageMood > 0 ? `${averageMood}/5` : '-'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Média Humor</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
  },
});
