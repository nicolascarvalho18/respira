import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, Bookmark } from 'lucide-react-native';
import { Article } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { ArticleCoverImage } from '../illustrations/ArticleCovers';
import { normalizeText } from '../../data/articles';

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

  const getCategoryTheme = () => {
    const cat = normalizeText(article.category || article.categoryName || 'Geral');
    if (cat.includes('sono')) {
      return { label: 'SONO', color: isDark ? '#A78BFA' : '#5A489B' };
    }
    if (cat.includes('ansiedade')) {
      return { label: 'ANSIEDADE', color: isDark ? '#FB923C' : '#C85A32' };
    }
    if (cat.includes('regulacao') || cat.includes('atencao')) {
      return { label: 'REGULAÇÃO', color: isDark ? '#60A5FA' : '#2D6A9F' };
    }
    return { label: 'BEM-ESTAR', color: isDark ? '#68D391' : '#2E7D5B' };
  };

  const categoryTheme = getCategoryTheme();
  const readTime = article.readingTimeMinutes || article.readTimeMinutes || 5;

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderColor: isDark ? '#334155' : '#E5EAE8',
        },
      ]}
    >
      {/* 1. Link Principal clicável do card */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        accessibilityRole="link"
        accessibilityLabel={`Ler artigo: ${article.title}, categoria ${categoryTheme.label}, tempo de leitura ${readTime} minutos`}
        style={styles.clickableArea}
      >
        {/* Capa Ilustrada Exclusiva do Artigo (4:3) */}
        <View style={styles.coverWrapper}>
          <ArticleCoverImage
            slug={article.slug || article.id}
            category={article.category}
            height={115}
            borderRadius={0}
          />
        </View>

        {/* Informações Editoriais do Card */}
        <View style={styles.bodyContent}>
          <Text style={[styles.categoryLabel, { color: categoryTheme.color }]}>
            {categoryTheme.label}
          </Text>

          <Text
            numberOfLines={2}
            style={[
              styles.articleTitle,
              { color: isDark ? '#FFFFFF' : '#17332F' },
            ]}
          >
            {article.title}
          </Text>

          <View style={styles.footerRow}>
            <View style={styles.timeWrap}>
              <Clock size={13} color={isDark ? '#E2E8F0' : '#708885'} strokeWidth={1.8} />
              <Text style={[styles.timeText, { color: isDark ? '#E2E8F0' : '#708885' }]}>
                {readTime} min
              </Text>
            </View>

            {onToggleFavorite && (
              <TouchableOpacity
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => onToggleFavorite(article.id)}
                accessibilityRole="button"
                accessibilityLabel={
                  article.isFavorite
                    ? `Remover ${article.title} dos favoritos`
                    : `Salvar ${article.title} nos favoritos`
                }
                style={styles.favBtn}
              >
                <Bookmark
                  size={16}
                  color={
                    article.isFavorite
                      ? isDark
                        ? '#5ECFC3'
                        : '#247B74'
                      : isDark
                      ? '#E2E8F0'
                      : '#8C9E9B'
                  }
                  fill={article.isFavorite ? (isDark ? '#5ECFC3' : '#247B74') : 'none'}
                  strokeWidth={1.8}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  clickableArea: {
    width: '100%',
  },
  coverWrapper: {
    width: '100%',
    height: 115,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    overflow: 'hidden',
  },
  bodyContent: {
    padding: 10,
    gap: 4,
  },
  categoryLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  articleTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 18,
    minHeight: 36,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5EAE8',
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  favBtn: {
    padding: 2,
  },
});
