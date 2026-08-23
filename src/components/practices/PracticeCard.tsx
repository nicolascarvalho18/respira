import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Wind,
  Square,
  Heart,
  Compass,
  Activity,
  Clock,
  Bookmark,
  Play,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { Practice } from '../../types';
import { formatTimesRealized } from '../../utils/grammar';

export interface PracticeCardProps {
  practice: Practice;
  onPress: () => void;
  onToggleFavorite: (id: string) => void;
}

export const PracticeCard: React.FC<PracticeCardProps> = ({
  practice,
  onPress,
  onToggleFavorite,
}) => {
  const { colors, isDark } = useTheme();

  const getIconConfig = () => {
    switch (practice.id) {
      case 'practice-breathing-478':
        return {
          icon: Wind,
          color: '#2F7F7C',
          bg: '#E2F4F2',
        };
      case 'practice-breathing-box':
        return {
          icon: Square,
          color: '#2C648E',
          bg: '#E3EEF8',
        };
      case 'practice-breathing-cardiac':
        return {
          icon: Heart,
          color: '#D98968',
          bg: '#FDECE5',
        };
      case 'practice-grounding-54321':
        return {
          icon: Compass,
          color: '#4A7A3E',
          bg: '#E9F2E6',
        };
      case 'practice-pmr-relaxation':
        return {
          icon: Activity,
          color: '#634E99',
          bg: '#EAE6F2',
        };
      case 'practice-quick-pause':
        return {
          icon: Clock,
          color: '#C87A24',
          bg: '#FBF1E6',
        };
      default:
        return {
          icon: Sparkles,
          color: '#2F7F7C',
          bg: '#E2F4F2',
        };
    }
  };

  const { icon: IconComponent, color: iconColor, bg: iconBg } = getIconConfig();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${practice.title}: ${practice.durationMinutes} minutos, ${practice.level}`}
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderColor: isDark ? colors.border : '#EBF1EF',
        },
        Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined,
      ]}
    >
      {/* 1. Ícone Quadrado Arredondado */}
      <View style={[styles.iconBox, { backgroundColor: isDark ? colors.surfaceSecondary : iconBg }]}>
        <IconComponent size={22} color={iconColor} strokeWidth={2.2} />
      </View>

      {/* 2. Conteúdo Central */}
      <View style={styles.centerCol}>
        <Text style={[styles.title, { color: '#173D3B' }]} numberOfLines={1}>
          {practice.title}
        </Text>

        <Text style={[styles.subtitle, { color: '#667775' }]} numberOfLines={1}>
          {practice.subtitle || practice.description}
        </Text>

        <View style={styles.metaRow}>
          <Text style={[styles.metaTimeLevel, { color: '#567571' }]}>
            {practice.durationMinutes} min • {practice.level}
          </Text>

          <Text style={[styles.metaCompletions, { color: '#8C9E9B' }]}>
            {formatTimesRealized(practice.completedCount || 0)}
          </Text>
        </View>
      </View>

      {/* 3. Ações Direitas (Favorito + Botão Circular Iniciar) */}
      <View style={styles.rightActionsCol}>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavorite(practice.id);
          }}
          accessibilityRole="button"
          accessibilityLabel={
            practice.isFavorite
              ? `Remover ${practice.title} dos favoritos`
              : `Adicionar ${practice.title} aos favoritos`
          }
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.favBtn}
        >
          <Bookmark
            size={18}
            color="#2F7F7C"
            fill={practice.isFavorite ? '#2F7F7C' : 'transparent'}
          />
        </TouchableOpacity>

        <View style={styles.circlePlayBtn}>
          <Play size={14} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCol: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  metaTimeLevel: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaCompletions: {
    fontSize: 11,
  },
  rightActionsCol: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingLeft: 4,
  },
  favBtn: {
    padding: 2,
  },
  circlePlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2F7F7C',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
