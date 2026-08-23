import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, Bookmark, CheckCircle2 } from 'lucide-react-native';
import { Article } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import {
  NightSkyMoonThumb,
  SageLeavesThumb,
  WarmSunHillsThumb,
  RiverHillsThumb,
} from '../illustrations/ArticleThumbnails';

export interface ContentCardProps {
  article: Article;
  onToggleFavorite?: (id: string) => void;
  onPress?: () => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  article,
  onToggleFavorite,
  onPress,
}) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/contents/${article.slug || article.id}` as any);
    }
  };

  const progress = article.readProgress || 0;
  const isCompleted = progress >= 90;

  // Choose the thumbnail matching the topic
  const renderThumbnail = () => {
    const slug = (article.slug || article.id || '').toLowerCase();
    const cat = (article.category || '').toLowerCase();

    if (slug.includes('dormir') || slug.includes('sono') || cat.includes('sono')) {
      return <NightSkyMoonThumb size={62} borderRadius={12} />;
    }
    if (slug.includes('5-4-3-2-1') || slug.includes('grounding') || cat.includes('regulação')) {
      return <SageLeavesThumb size={62} borderRadius={12} />;
    }
    if (slug.includes('mitos') || slug.includes('ansiedade') || cat.includes('ansiedade')) {
      return <WarmSunHillsThumb size={62} borderRadius={12} />;
    }
    return <RiverHillsThumb size={62} borderRadius={12} />;
  };

  const getCategoryDisplay = () => {
    const cat = (article.category || article.categoryName || 'Geral').toUpperCase();
    if (cat.includes('SONO')) return 'SONO';
    if (cat.includes('ANSIEDADE')) return 'ANSIEDADE';
    if (cat.includes('REGULAÇÃO') || cat.includes('ATENÇÃO')) return 'REGULAÇÃO';
    if (cat.includes('BEM-ESTAR')) return 'BEM-ESTAR';
    return cat;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Artigo: ${article.title}, tempo de leitura ${article.readingTimeMinutes || article.readTimeMinutes || 4} minutos`}
      style={[
        styles.cardRow,
        {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderBottomColor: isDark ? colors.border : '#EBF1EF',
        },
        Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined,
      ]}
    >
      {/* 1. Miniatura Artística */}
      <View style={styles.thumbWrapper}>
        {renderThumbnail()}
      </View>

      {/* 2. Conteúdo Central Editorial */}
      <View style={styles.centerContent}>
        <Text style={styles.categoryLabel}>
          {getCategoryDisplay()}
        </Text>

        <Text style={[styles.title, { color: '#173D3B' }]} numberOfLines={1}>
          {article.title}
        </Text>

        <Text style={[styles.summary, { color: '#667775' }]} numberOfLines={1}>
          {article.summary}
        </Text>

        {/* Rodapé: Tempo de leitura e barra de progresso */}
        <View style={styles.footerRow}>
          <View style={styles.readTimeRow}>
            <Clock size={11} color="#8C9E9B" style={{ marginRight: 3 }} />
            <Text style={styles.readTimeText}>
              {article.readingTimeMinutes || article.readTimeMinutes || 4} min
            </Text>
          </View>

          {/* Progresso Parcial (ex: 60% concluído) */}
          {progress > 0 && !isCompleted && (
            <View style={styles.progressPartialRow}>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, progress)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressPercentText}>
                {progress}% concluído
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 3. Ação Direita: Checkmark concluído ou Marcador Favorito */}
      <View style={styles.rightActionWrap}>
        {isCompleted ? (
          <View style={styles.completedBadge}>
            <CheckCircle2 size={20} color="#2F7F7C" />
          </View>
        ) : (
          onToggleFavorite && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onToggleFavorite(article.id);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={article.isFavorite ? 'Remover dos favoritos' : 'Favoritar artigo'}
              style={styles.favButton}
            >
              <Bookmark
                size={18}
                color="#2F7F7C"
                fill={article.isFavorite ? '#2F7F7C' : 'transparent'}
              />
            </TouchableOpacity>
          )
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  thumbWrapper: {
    width: 62,
    height: 62,
    borderRadius: 12,
    overflow: 'hidden',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2F7F7C',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  summary: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  readTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTimeText: {
    fontSize: 11,
    color: '#8C9E9B',
    fontWeight: '500',
  },
  progressPartialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressBarTrack: {
    width: 60,
    height: 3.5,
    backgroundColor: '#E7F1EE',
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
  rightActionWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  favButton: {
    padding: 4,
  },
  completedBadge: {
    padding: 2,
  },
});
