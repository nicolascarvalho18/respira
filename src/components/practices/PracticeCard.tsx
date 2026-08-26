import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import {
  Bookmark,
  Play,
  CheckCircle2,
  Video,
  Headphones,
  Sparkles,
  Wind,
  Activity,
  Compass,
  Square,
  Heart,
  Clock,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { Practice, UserPracticeProgress } from '../../types';
import { formatTimesRealized } from '../../utils/grammar';

export interface PracticeCardProps {
  practice: Practice;
  progress?: UserPracticeProgress;
  onPress: () => void;
  onToggleFavorite: (id: string) => void;
}

export const PracticeCard: React.FC<PracticeCardProps> = ({
  practice,
  progress,
  onPress,
  onToggleFavorite,
}) => {
  const { colors, isDark } = useTheme();

  const isCompleted = (progress?.status === 'completed') || (practice.completedCount && practice.completedCount > 0);
  const progressPercent = progress ? progress.progressPercent : 0;
  const hasStarted = progress && progress.status === 'started' && progressPercent > 0 && progressPercent < 100;

  const getFormatBadge = () => {
    switch (practice.format) {
      case 'video':
        return { label: 'Vídeo', icon: Video, bg: '#E7F3EF', color: '#2F7F7C' };
      case 'audio':
        return { label: 'Áudio', icon: Headphones, bg: '#F2EBF9', color: '#6A4C93' };
      case 'interactive':
      default:
        return { label: 'Interativo', icon: Sparkles, bg: '#FFF4EE', color: '#D98968' };
    }
  };

  const formatBadge = getFormatBadge();
  const FormatIcon = formatBadge.icon;

  const getFallbackIcon = () => {
    switch (practice.category) {
      case 'breathing':
        return Wind;
      case 'body_movement':
        return Activity;
      case 'mindfulness_focus':
      case 'mindfulness':
        return Compass;
      case 'sleep':
      case 'bedtime_prep':
        return Heart;
      case 'quick_pauses':
        return Clock;
      default:
        return Sparkles;
    }
  };

  const FallbackIcon = getFallbackIcon();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${practice.title}: ${practice.durationMinutes} minutos, ${practice.level}, formato ${formatBadge.label}`}
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderColor: isDark ? colors.border : '#EBF1EF',
        },
        Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined,
      ]}
    >
      {/* 1. Miniatura Visual com Selo de Formato */}
      <View style={styles.thumbnailWrapper}>
        {practice.thumbnailUrl ? (
          <Image
            source={{ uri: practice.thumbnailUrl }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.fallbackThumbnail, { backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF' }]}>
            <FallbackIcon size={26} color="#2F7F7C" />
          </View>
        )}

        {/* Selo de Formato (Vídeo / Áudio / Interativo) */}
        <View style={[styles.formatBadge, { backgroundColor: formatBadge.bg }]}>
          <FormatIcon size={11} color={formatBadge.color} style={{ marginRight: 3 }} />
          <Text style={[styles.formatBadgeText, { color: formatBadge.color }]}>
            {formatBadge.label}
          </Text>
        </View>

        {/* Selo de Concluída */}
        {isCompleted && (
          <View style={styles.completedBadge}>
            <CheckCircle2 size={12} color="#FFFFFF" />
            <Text style={styles.completedBadgeText}>Concluída</Text>
          </View>
        )}
      </View>

      {/* 2. Conteúdo Central */}
      <View style={styles.centerCol}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, { color: isDark ? colors.text : '#173D3B' }]}
            numberOfLines={2}
          >
            {practice.title}
          </Text>
        </View>

        <Text
          style={[styles.description, { color: isDark ? colors.textMuted : '#667775' }]}
          numberOfLines={2}
        >
          {practice.subtitle || practice.description}
        </Text>

        {/* Metadados: Duração, Nível e Realizações */}
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: isDark ? colors.textMuted : '#567571' }]}>
            {practice.durationMinutes} min • {practice.level}
          </Text>

          {practice.completedCount && practice.completedCount > 0 ? (
            <Text style={[styles.completionsText, { color: '#2F7F7C' }]}>
              {formatTimesRealized(practice.completedCount)}
            </Text>
          ) : null}
        </View>

        {/* Barra de Progresso quando iniciada */}
        {hasStarted ? (
          <View style={styles.progressRow}>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressPercentText}>{progressPercent}%</Text>
          </View>
        ) : null}
      </View>

      {/* 3. Ações à Direita (Favorito e Play) */}
      <View style={styles.actionsCol}>
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
          <Play size={13} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  thumbnailWrapper: {
    width: 90,
    height: 90,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E7F3EF',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  fallbackThumbnail: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  formatBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  completedBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    backgroundColor: 'rgba(47, 127, 124, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  completedBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  centerCol: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    marginBottom: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  completionsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  progressBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#EBF1EF',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2F7F7C',
    borderRadius: 2,
  },
  progressPercentText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2F7F7C',
  },
  actionsCol: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 76,
    paddingLeft: 2,
  },
  favBtn: {
    padding: 4,
  },
  circlePlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2F7F7C',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
