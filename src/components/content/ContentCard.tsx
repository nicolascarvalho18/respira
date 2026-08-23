import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Bookmark, Clock } from 'lucide-react-native';
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
      router.push(`/content/${article.id}`);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Artigo: ${article.title}, tempo de leitura ${article.readTimeMinutes} minutos`}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.categoryBadge, { backgroundColor: colors.highlight }]}>
          <BookOpen size={13} color={colors.primary} style={{ marginRight: 4 }} />
          <Text style={[styles.categoryText, { color: colors.primary }]}>
            {article.categoryName}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.readTime}>
            <Clock size={13} color={colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.readTimeText, { color: colors.textMuted }]}>
              {article.readTimeMinutes} min
            </Text>
          </View>

          {onToggleFavorite && (
            <TouchableOpacity
              onPress={() => onToggleFavorite(article.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={article.isFavorite ? 'Remover dos favoritos' : 'Favoritar artigo'}
              style={{ marginLeft: 8 }}
            >
              <Bookmark
                size={18}
                color={article.isFavorite ? colors.primary : colors.textLight}
                fill={article.isFavorite ? colors.primary : 'none'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{article.title}</Text>
      <Text style={[styles.summary, { color: colors.textMuted }]} numberOfLines={2}>
        {article.summary}
      </Text>

      {/* Barra de progresso de leitura se iniciada */}
      {article.readProgress !== undefined && article.readProgress > 0 && (
        <View style={styles.progressRow}>
          <View style={[styles.progressTrack, { backgroundColor: isDark ? '#2D3740' : '#E2E8F0' }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${article.readProgress}%`, backgroundColor: colors.secondary },
              ]}
            />
          </View>
          <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
            {article.readProgress === 100 ? 'Lido' : `${article.readProgress}%`}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  readTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTimeText: {
    fontSize: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 20,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
