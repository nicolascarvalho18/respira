import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bookmark, Clock, ArrowRight } from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { useContentStore } from '../../src/store/contentStore';
import { usePracticeStore } from '../../src/store/practiceStore';
import { useTheme } from '../../src/hooks/useTheme';
import { Article } from '../../src/types';
import { formatDate } from '../../src/utils/date';
import { LEGAL_TEXTS } from '../../src/constants/legal';

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { articles, toggleFavorite, updateProgress } = useContentStore();
  const { practices } = usePracticeStore();

  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    if (id && articles.length > 0) {
      const found = articles.find((a) => a.id === id);
      if (found) {
        setArticle(found);
        updateProgress(found.id, 100);
      }
    }
  }, [id, articles, updateProgress]);

  if (!article) {
    return (
      <ScreenContainer>
        <AppHeader showBack title="Carregando Artigo" />
        <LoadingState message="Buscando conteúdo educativo..." />
      </ScreenContainer>
    );
  }

  const relatedPractices = practices.filter((p) =>
    article.relatedPracticeIds?.includes(p.id)
  );

  return (
    <ScreenContainer scrollable>
      <AppHeader
        showBack
        title={article.categoryName}
        rightAction={
          <TouchableOpacity
            onPress={() => toggleFavorite(article.id)}
            accessibilityRole="button"
            accessibilityLabel={article.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
            style={[styles.favBtn, { backgroundColor: colors.surfaceSubtle }]}
          >
            <Bookmark
              size={20}
              color={article.isFavorite ? colors.primary : colors.textLight}
              fill={article.isFavorite ? colors.primary : 'none'}
            />
          </TouchableOpacity>
        }
      />

      <View style={styles.header}>
        <View style={[styles.categoryBadge, { backgroundColor: colors.highlight }]}>
          <Text style={[styles.categoryText, { color: colors.primaryDark }]}>
            {article.categoryName}
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{article.title}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {article.readTimeMinutes} min de leitura
            </Text>
          </View>
          <Text style={{ color: colors.textMuted }}>•</Text>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {formatDate(article.publishedAt)}
          </Text>
        </View>
      </View>

      {/* Resumo de Abertura */}
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: isDark ? colors.surfaceSubtle : colors.highlight,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.summaryText, { color: colors.primaryDark }]}>{article.summary}</Text>
      </View>

      {/* Conteúdo Formatado em Parágrafos e Seções */}
      <View
        style={[
          styles.contentCard,
          {
            backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
            borderColor: colors.border,
          },
        ]}
      >
        {article.content.split('\n\n').map((paragraph, index) => {
          if (paragraph.startsWith('## ')) {
            return (
              <Text key={index} style={[styles.h2, { color: colors.text }]}>
                {paragraph.replace('## ', '')}
              </Text>
            );
          }
          if (paragraph.startsWith('### ')) {
            return (
              <Text key={index} style={[styles.h3, { color: colors.primary }]}>
                {paragraph.replace('### ', '')}
              </Text>
            );
          }
          return (
            <Text key={index} style={[styles.bodyText, { color: colors.text }]}>
              {paragraph.replace(/\*\*(.*?)\*\*/g, '$1')}
            </Text>
          );
        })}
      </View>

      {/* Práticas Relacionadas */}
      {relatedPractices.length > 0 && (
        <View style={styles.relatedSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Práticas Recomendadas</Text>

          {relatedPractices.map((rp) => (
            <TouchableOpacity
              key={rp.id}
              activeOpacity={0.7}
              onPress={() => {
                if (rp.category === 'breathing') {
                  router.push('/practices/breathing');
                } else {
                  router.push(`/practices/player/${rp.id}`);
                }
              }}
              style={[
                styles.relatedCard,
                {
                  backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.relatedTitle, { color: colors.text }]}>{rp.title}</Text>
                <Text style={[styles.relatedSub, { color: colors.textMuted }]}>
                  {rp.durationMinutes} min • {rp.level}
                </Text>
              </View>
              <ArrowRight size={18} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Disclaimer de Psicoeducação */}
      <View style={[styles.disclaimerBox, { backgroundColor: isDark ? colors.surfaceSubtle : '#F8FAFC' }]}>
        <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
          {LEGAL_TEXTS.MEDICAL_DISCLAIMER}
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  favBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginVertical: 14,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  contentCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
  },
  h2: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 8,
  },
  h3: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
  relatedSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  relatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  relatedSub: {
    fontSize: 12,
    marginTop: 2,
  },
  disclaimerBox: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 28,
  },
  disclaimerText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
