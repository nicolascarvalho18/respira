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
  showSummary?: boolean;
  coverHeight?: number;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  article,
  onToggleFavorite,
  onPress,
  showSummary = true,
  coverHeight = 160,
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
      return { label: 'Sono', color: isDark ? '#A78BFA' : '#5A489B' };
    }
    if (cat.includes('ansiedade')) {
      return { label: 'Ansiedade', color: isDark ? '#FB923C' : '#C85A32' };
    }
    if (cat.includes('regulacao') || cat.includes('atencao')) {
      return { label: 'Regulação', color: isDark ? '#60A5FA' : '#2D6A9F' };
    }
    return { label: 'Bem-estar', color: isDark ? '#68D391' : '#2E7D5B' };
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
      {/* 1. Área Clicável Principal do Card */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handlePress}
        accessibilityRole="link"
        accessibilityLabel={`Ler artigo: ${article.title}, categoria ${categoryTheme.label}, tempo de leitura ${readTime} minutos`}
        style={styles.clickableArea}
      >
        {/* Capa Ilustrada Exclusiva do Artigo */}
        <View style={[styles.coverWrapper, { height: coverHeight }]}>
          <ArticleCoverImage
            slug={article.slug || article.id}
            category={article.category}
            height={coverHeight}
            borderRadius={0}
          />
        </View>

        {/* Informações Editoriais */}
        <View style={styles.bodyContent}>
          {/* Categoria e Tempo */}
          <View style={styles.topMetaRow}>
            <Text style={[styles.categoryLabel, { color: categoryTheme.color }]}>
              {categoryTheme.label.toUpperCase()}
            </Text>
            <View style={styles.dotSeparator} />
            <View style={styles.timeInlineWrap}>
              <Clock size={12} color={isDark ? '#CBD5E1' : '#708885'} strokeWidth={1.8} />
              <Text style={[styles.timeInlineText, { color: isDark ? '#CBD5E1' : '#708885' }]}>
                {readTime} min
              </Text>
            </View>
          </View>

          {/* Título do Artigo (em até 2 linhas completas) */}
          <Text
            numberOfLines={2}
            style={[
              styles.articleTitle,
              { color: isDark ? '#FFFFFF' : '#17332F' },
            ]}
          >
            {article.title}
          </Text>

          {/* Resumo do Artigo (em até 2 linhas) */}
          {showSummary && article.summary ? (
            <Text
              numberOfLines={2}
              style={[
                styles.articleSummary,
                { color: isDark ? '#F1F5F9' : '#5F706C' },
              ]}
            >
              {article.summary}
            </Text>
          ) : null}

          {/* Rodapé com Ação de Favorito e Leitura */}
          <View style={styles.footerRow}>
            <Text style={[styles.readPromptText, { color: isDark ? '#5ECFC3' : '#247B74' }]}>
              Ler artigo
            </Text>

            {onToggleFavorite && (
              <TouchableOpacity
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
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
                  size={18}
                  color={
                    article.isFavorite
                      ? isDark
                        ? '#5ECFC3'
                        : '#247B74'
                      : isDark
                      ? '#CBD5E1'
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
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  clickableArea: {
    width: '100%',
  },
  coverWrapper: {
    width: '100%',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#F8FAF9',
  },
  bodyContent: {
    padding: 14,
    gap: 6,
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#8C9E9B',
  },
  timeInlineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeInlineText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  articleTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  articleSummary: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5EAE8',
  },
  readPromptText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  favBtn: {
    padding: 4,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
