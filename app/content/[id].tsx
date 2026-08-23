import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Bookmark,
  Clock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  List,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { PageHeader } from '../../src/components/ui/PageHeader';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
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
  const [isRead, setIsRead] = useState(false);

  useEffect(() => {
    if (id && articles.length > 0) {
      const found = articles.find((a) => a.id === id);
      if (found) {
        setArticle(found);
        setIsRead((found.readProgress || 0) >= 100);
        updateProgress(found.id, 100);
      }
    }
  }, [id, articles, updateProgress]);

  if (!article) {
    return (
      <AppShell>
        <PageHeader showBack title="Artigo" />
        <LoadingState message="Buscando conteúdo educativo..." />
      </AppShell>
    );
  }

  const relatedPractices = practices.filter((p) =>
    article.relatedPracticeIds?.includes(p.id)
  );

  // Extrai títulos dos subtítulos (##) para o índice
  const headings = article.content
    .split('\n\n')
    .filter((p) => p.startsWith('## '))
    .map((p) => p.replace('## ', ''));

  return (
    <AppShell>
      <PageHeader
        showBack
        title={article.categoryName}
        rightAction={
          <TouchableOpacity
            onPress={() => toggleFavorite(article.id)}
            accessibilityRole="button"
            accessibilityLabel={article.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
            style={[styles.favBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <Bookmark
              size={20}
              color={article.isFavorite ? colors.primary : colors.textMuted}
              fill={article.isFavorite ? colors.primary : 'none'}
            />
          </TouchableOpacity>
        }
      />

      {/* Cabeçalho do Artigo */}
      <View style={styles.articleHeader}>
        <Badge label={article.categoryName} variant="primary" size="md" style={{ marginBottom: 10 }} />
        <Text style={[styles.title, { color: colors.text }]}>{article.title}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {article.readTimeMinutes} min de leitura
            </Text>
          </View>
          <Text style={{ color: colors.textMuted }}>•</Text>
          <View style={styles.metaItem}>
            <Calendar size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              Atualizado em {formatDate(article.publishedAt)}
            </Text>
          </View>
        </View>

        {/* Selo de Revisão de Saúde */}
        <View style={[styles.reviewBadge, { backgroundColor: isDark ? colors.surfaceSecondary : '#EBF5F3' }]}>
          <ShieldCheck size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.reviewText, { color: colors.primaryDark }]}>
            Conteúdo educativo fundamentado em literatura científica sobre saúde mental
          </Text>
        </View>
      </View>

      {/* Resumo de Abertura */}
      <Card variant="bordered" style={styles.summaryCard}>
        <Text style={[styles.summaryTitle, { color: colors.primary }]}>Destaques do Artigo:</Text>
        <Text style={[styles.summaryText, { color: colors.text }]}>{article.summary}</Text>
      </Card>

      {/* Índice do Artigo (quando houver múltiplos tópicos) */}
      {headings.length > 0 && (
        <Card variant="bordered" style={styles.tocCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <List size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.tocTitle, { color: colors.text }]}>Neste Artigo</Text>
          </View>
          {headings.map((heading, idx) => (
            <Text key={idx} style={[styles.tocItem, { color: colors.primary }]}>
              {idx + 1}. {heading}
            </Text>
          ))}
        </Card>
      )}

      {/* Corpo Formatado do Conteúdo */}
      <Card variant="bordered" style={styles.contentCard}>
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

        {/* Botão de Marcar como Concluído */}
        <View style={[styles.readToggleWrap, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => {
              setIsRead(!isRead);
              updateProgress(article.id, isRead ? 0 : 100);
            }}
            accessibilityRole="button"
            accessibilityLabel={isRead ? 'Marcar artigo como não lido' : 'Marcar artigo como lido'}
            style={[
              styles.readBtn,
              {
                backgroundColor: isRead ? colors.highlight : colors.surfaceSecondary,
                borderColor: isRead ? colors.primary : colors.border,
              },
            ]}
          >
            <CheckCircle2
              size={18}
              color={isRead ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.readBtnText,
                {
                  color: isRead ? colors.primaryDark : colors.text,
                  fontWeight: isRead ? '700' : '500',
                },
              ]}
            >
              {isRead ? 'Artigo concluído' : 'Marcar leitura como concluída'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Práticas Relacionadas */}
      {relatedPractices.length > 0 && (
        <View style={styles.relatedSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Práticas Recomendadas</Text>

          {relatedPractices.map((rp) => (
            <TouchableOpacity
              key={rp.id}
              activeOpacity={0.8}
              onPress={() => {
                if (rp.category === 'breathing') {
                  router.push('/practices/breathing');
                } else if (rp.id === 'practice-grounding-54321') {
                  router.push('/practices/grounding' as any);
                } else {
                  router.push(`/practices/player/${rp.id}`);
                }
              }}
              style={[
                styles.relatedCard,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
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

      {/* Disclaimer Psicoeducativo */}
      <View
        style={[
          styles.disclaimerBox,
          {
            backgroundColor: isDark ? colors.surfaceSecondary : '#F0F5F4',
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
          {LEGAL_TEXTS.MEDICAL_DISCLAIMER}
        </Text>
      </View>
    </AppShell>
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
  articleHeader: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
  },
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
  },
  reviewText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  summaryCard: {
    gap: 6,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  tocCard: {
    gap: 6,
    marginBottom: 16,
  },
  tocTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  tocItem: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  contentCard: {
    padding: 22,
    gap: 12,
    marginBottom: 20,
  },
  h2: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 6,
  },
  h3: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 26,
  },
  readToggleWrap: {
    paddingTop: 18,
    marginTop: 12,
    borderTopWidth: 1,
  },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  readBtnText: {
    fontSize: 14,
  },
  relatedSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  relatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  relatedTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  relatedSub: {
    fontSize: 12,
    marginTop: 2,
  },
  disclaimerBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 32,
  },
  disclaimerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
