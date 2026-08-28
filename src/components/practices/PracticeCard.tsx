import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
  ViewStyle,
} from 'react-native';
import { Bookmark } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { Practice, UserPracticeProgress } from '../../types';
import { getPracticeImage, getPracticeAltText } from '../../utils/practiceImages';

export interface PracticeCardProps {
  practice: Practice;
  progress?: UserPracticeProgress;
  variant?: 'horizontal' | 'vertical' | 'list';
  onPress: () => void;
  onToggleFavorite: (id: string) => void;
  style?: ViewStyle;
}

export const PracticeCard: React.FC<PracticeCardProps> = ({
  practice,
  progress,
  variant = 'horizontal',
  onPress,
  onToggleFavorite,
  style,
}) => {
  const { colors, isDark } = useTheme();

  const progressPercent = progress ? progress.progressPercent : 0;
  const hasStarted =
    (progress && progress.status === 'started' && progressPercent > 0 && progressPercent < 100) ||
    (progress && progress.playbackPositionSeconds > 0 && progressPercent < 100);

  const getFormatLabel = () => {
    switch (practice.format) {
      case 'video':
        return 'Vídeo';
      case 'audio':
        return 'Áudio';
      case 'interactive':
      default:
        return 'Áudio';
    }
  };

  const formatLabel = getFormatLabel();
  const metaText = `${practice.durationMinutes} min · ${practice.level} · ${formatLabel}`;
  const imageSource = getPracticeImage(practice.id);
  const imageAlt = getPracticeAltText(practice.id);

  // VERTICAL CARD (for "Práticas rápidas" horizontal scroll)
  if (variant === 'vertical') {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${practice.title}, ${metaText}`}
        style={[
          styles.verticalCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#DFE4E1',
          },
          Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined,
          style,
        ]}
      >
        <View style={styles.verticalImageWrap}>
          <Image
            source={imageSource}
            accessibilityLabel={imageAlt}
            style={styles.verticalImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.verticalContent}>
          <View style={styles.verticalTextCol}>
            <Text
              style={[styles.cardTitle, { color: isDark ? colors.text : '#1F2927' }]}
              numberOfLines={2}
            >
              {practice.title}
            </Text>
            <Text
              style={[styles.metaText, { color: isDark ? colors.textMuted : '#68736F' }]}
              numberOfLines={1}
            >
              {metaText}
            </Text>
          </View>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onToggleFavorite(practice.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={
              practice.isFavorite
                ? `Remover ${practice.title} dos favoritos`
                : `Salvar ${practice.title} nos favoritos`
            }
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.bookmarkBtn}
          >
            <Bookmark
              size={20}
              color={practice.isFavorite ? '#247B74' : isDark ? colors.textMuted : '#68736F'}
              fill={practice.isFavorite ? '#247B74' : 'transparent'}
              strokeWidth={1.75}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  // HORIZONTAL CARD (for "Continue de onde parou", "Novidades" and general catalog list)
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${practice.title}, ${metaText}`}
      style={[
        styles.horizontalCard,
        {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderColor: isDark ? colors.border : '#DFE4E1',
        },
        Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined,
        style,
      ]}
    >
      {/* Miniatura Fotográfica 4:3 */}
      <View style={styles.horizontalImageWrap}>
        <Image
          source={imageSource}
          accessibilityLabel={imageAlt}
          style={styles.horizontalImage}
          resizeMode="cover"
        />
      </View>

      {/* Conteúdo à Direita */}
      <View style={styles.horizontalContent}>
        <View style={styles.horizontalHeaderRow}>
          <Text
            style={[styles.cardTitle, { color: isDark ? colors.text : '#1F2927', flex: 1, marginRight: 8 }]}
            numberOfLines={2}
          >
            {practice.title}
          </Text>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onToggleFavorite(practice.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={
              practice.isFavorite
                ? `Remover ${practice.title} dos favoritos`
                : `Salvar ${practice.title} nos favoritos`
            }
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.bookmarkBtn}
          >
            <Bookmark
              size={20}
              color={practice.isFavorite ? '#247B74' : isDark ? colors.textMuted : '#68736F'}
              fill={practice.isFavorite ? '#247B74' : 'transparent'}
              strokeWidth={1.75}
            />
          </TouchableOpacity>
        </View>

        <Text
          style={[styles.metaText, { color: isDark ? colors.textMuted : '#68736F' }]}
          numberOfLines={1}
        >
          {metaText}
        </Text>

        {/* Barra de Progresso e Ação Continuar (somente quando iniciado) */}
        {hasStarted ? (
          <View style={styles.progressBlock}>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${Math.max(15, progressPercent || 45)}%` }]} />
            </View>
            <Text style={styles.continueActionText}>Continuar</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Horizontal Card
  horizontalCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    minHeight: 96,
  },
  horizontalImageWrap: {
    width: 120,
    height: '100%',
    backgroundColor: '#ECEFEE',
  },
  horizontalImage: {
    width: '100%',
    height: '100%',
    minHeight: 96,
  },
  horizontalContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  horizontalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  // Vertical Card (Práticas Rápidas)
  verticalCard: {
    width: 154,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: 12,
  },
  verticalImageWrap: {
    width: '100%',
    height: 115, // 4:3 proportion for 154 width
    backgroundColor: '#ECEFEE',
  },
  verticalImage: {
    width: '100%',
    height: '100%',
  },
  verticalContent: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 64,
  },
  verticalTextCol: {
    flex: 1,
    marginRight: 6,
  },

  // Tipografia dos Cards
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
    letterSpacing: -0.1,
  },
  bookmarkBtn: {
    padding: 2,
  },

  // Progresso
  progressBlock: {
    marginTop: 8,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#E7EBE9',
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#247B74',
    borderRadius: 2,
  },
  continueActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#247B74',
  },
});
