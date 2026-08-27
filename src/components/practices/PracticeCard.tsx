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
  PlayCircle,
  Volume2,
  Activity,
  Wind,
  Leaf,
  Smile,
  Compass,
  Clock,
  Heart,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { Practice, UserPracticeProgress } from '../../types';
import { formatTimesRealized } from '../../utils/grammar';
import { PracticeThumbnail } from './PracticeThumbnail';

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
        return { label: 'Com vídeo', icon: PlayCircle, bg: '#E7F3EF', color: '#2F7F7C' };
      case 'audio':
        return { label: 'Com áudio', icon: Volume2, bg: '#F2EBF9', color: '#6A4C93' };
      case 'interactive':
      default:
        return { label: 'Guiado', icon: Activity, bg: '#FFF4EE', color: '#D98968' };
    }
  };

  const formatBadge = getFormatBadge();
  const FormatIcon = formatBadge.icon;

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
      {/* 1. Miniatura Visual com Ilustração Específica e Selo de Formato */}
      <View style={styles.thumbnailWrapper}>
        <PracticeThumbnail
          practiceId={practice.id}
          category={practice.category}
          title={practice.title}
          isDark={isDark}
        />

        {/* Selo de Formato (Com vídeo / Com áudio / Guiado) */}
        <View style={[styles.formatBadge, { backgroundColor: formatBadge.bg }]}>
          <FormatIcon size={10} color={formatBadge.color} style={{ marginRight: 3 }} aria-hidden={true} />
          <Text style={[styles.formatBadgeText, { color: formatBadge.color }]}>
            {formatBadge.label}
          </Text>
        </View>

        {/* Selo de Concluída */}
        {isCompleted && (
          <View style={styles.completedBadge}>
            <CheckCircle2 size={11} color="#FFFFFF" aria-hidden={true} />
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
            aria-hidden={true}
          />
        </TouchableOpacity>

        <View style={styles.circlePlayBtn}>
          <Play size={13} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} aria-hidden={true} />
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
    width: 86,
    height: 86,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E7F3EF',
  },
  formatBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  formatBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
  },
  completedBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    right: 5,
    backgroundColor: 'rgba(47, 127, 124, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  completedBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '700',
  },
  centerCol: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    marginBottom: 2,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 19,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 5,
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
    height: 74,
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
