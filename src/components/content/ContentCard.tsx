import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Bookmark, Clock, CheckCircle2 } from 'lucide-react-native';
import { Article } from '../../types';
import { useTheme } from '../../hooks/useTheme';

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

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Artigo: ${article.title}, tempo de leitura ${article.readingTimeMinutes || article.readTimeMinutes || 4} minutos`}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderColor: colors.border,
        },
      ]}
    >
      {/* Linha superior: Categoria e Metadados */}
      <View style={styles.topRow}>
        <View style={[styles.categoryBadge, { backgroundColor: colors.highlight }]}>
          <BookOpen size={12} color={colors.primary} style={{ marginRight: 4 }} />
          <Text style={[styles.categoryText, { color: colors.primaryDark }]}>
            {article.category || article.categoryName || 'Geral'}
          </Text>
        </View>

        <View style={styles.topRightRow}>
          <View style={styles.readTime}>
            <Clock size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.readTimeText, { color: colors.textMuted }]}>
              {article.readingTimeMinutes || article.readTimeMinutes || 4} min
            </Text>
          </View>

          {onToggleFavorite && (
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
                size={17}
                color={article.isFavorite ? colors.primary : colors.textLight}
                fill={article.isFavorite ? colors.primary : 'none'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Título e Resumo */}
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={3}>
        {article.title}
      </Text>
      <Text style={[styles.summary, { color: colors.textSecondary }]} numberOfLines={2}>
        {article.summary}
      </Text>

      {/* Barra de Progresso quando iniciado */}
      {progress > 0 && (
        <View style={styles.progressFooter}>
          <View style={styles.progressTrackWrap}>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: isDark ? colors.surfaceSecondary : '#EAEFF0' },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, progress)}%`,
                    backgroundColor: isCompleted ? colors.success : colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressPercent, { color: colors.textMuted }]}>
              {isCompleted ? 'Lido' : `${progress}%`}
            </Text>
          </View>

          <Text style={[styles.continueText, { color: colors.primary }]}>
            {isCompleted ? 'Revisitar' : 'Continuar'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 12,
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTimeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  favButton: {
    padding: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
  },
  progressFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F4',
  },
  progressTrackWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
    gap: 6,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '600',
  },
  continueText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
