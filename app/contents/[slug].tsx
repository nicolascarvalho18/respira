import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Share,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Bookmark,
  Clock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Share2,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Wind,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { PageHeader } from '../../src/components/ui/PageHeader';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { AppButton } from '../../src/components/ui/AppButton';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { useToast } from '../../src/components/ui/Toast';
import { useContentStore } from '../../src/store/contentStore';
import { usePracticeStore } from '../../src/store/practiceStore';
import { useTheme } from '../../src/hooks/useTheme';
import { Article } from '../../src/types';
import { formatDate } from '../../src/utils/date';
import { LEGAL_TEXTS } from '../../src/constants/legal';

export default function ArticleDetailSlugScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { articles, toggleFavorite, updateProgress } = useContentStore();
  const { practices } = usePracticeStore();
  const { showToast } = useToast();

  const [article, setArticle] = useState<Article | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isRead, setIsRead] = useState(false);
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (slug && articles.length > 0) {
      const found = articles.find((a) => a.slug === slug || a.id === slug);
      if (found) {
        setArticle(found);
        const existingProgress = found.readProgress || 0;
        setScrollProgress(existingProgress);
        setIsRead(existingProgress >= 90);
      }
    }
  }, [slug, articles]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const totalScrollable = contentSize.height - layoutMeasurement.height;
    if (totalScrollable <= 0) return;

    const currentProgress = Math.min(
      100,
      Math.max(0, Math.round((contentOffset.y / totalScrollable) * 100))
    );

    setScrollProgress(currentProgress);

    if (currentProgress >= 90 && !isRead) {
      setIsRead(true);
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (article) {
        updateProgress(article.id, Math.max(article.readProgress || 0, currentProgress));
      }
    }, 400);
  };

  const handleToggleRead = () => {
    if (!article) return;
    const newStatus = !isRead;
    setIsRead(newStatus);
    const newProg = newStatus ? 100 : 0;
    setScrollProgress(newProg);
    updateProgress(article.id, newProg);
    showToast({
      message: newStatus ? 'Marcado como lido.' : 'Marcado como não lido.',
      type: 'info',
    });
  };

  const handleShare = async () => {
    if (!article) return;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: window.location.href,
        });
      } else {
        await Share.share({
          title: article.title,
          message: `${article.title}\n\n${article.summary}`,
        });
      }
    } catch {
      // Compartilhamento cancelado ou não suportado
    }
  };

  const handleFeedback = (val: 'yes' | 'no') => {
    setFeedback(val);
    showToast({
      message: val === 'yes' ? 'Obrigado pela sua avaliação!' : 'Agradecemos o retorno para melhorar.',
      type: 'info',
    });
  };

  if (!article) {
    return (
      <AppShell>
        <PageHeader showBack title="Conteúdos" />
        <LoadingState message="Carregando texto..." />
      </AppShell>
    );
  }

  const relatedPractices = practices.filter(
    (p) =>
      article.relatedPracticeId === p.id ||
      article.relatedPracticeIds?.includes(p.id)
  );

  const relatedArticles = articles.filter(
    (a) => a.id !== article.id && article.relatedArticleIds?.includes(a.id)
  );

  return (
    <AppShell scrollable={false} contentContainerStyle={{ paddingHorizontal: 0, paddingTop: 0 }}>
      {/* 1. Barra Fina de Progresso no Topo */}
      <View
        style={[
          styles.topProgressBarTrack,
          { backgroundColor: isDark ? colors.surfaceSecondary : '#EAEFF0' },
        ]}
      >
        <View
          style={[
            styles.topProgressBarFill,
            {
              width: `${scrollProgress}%`,
              backgroundColor: isRead ? colors.success : colors.primary,
            },
          ]}
        />
      </View>

      {/* 2. Barra de Navegação Superior */}
      <View style={[styles.navBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar para conteúdos"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.navBtn, { backgroundColor: colors.surfaceSecondary }]}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.navCategory, { color: colors.textSecondary }]} numberOfLines={1}>
          {article.category || article.categoryName}
        </Text>

        <View style={styles.navActionsRow}>
          <TouchableOpacity
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Compartilhar artigo"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.navBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <Share2 size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleFavorite(article.id)}
            accessibilityRole="button"
            accessibilityLabel={article.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.navBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <Bookmark
              size={18}
              color={article.isFavorite ? colors.primary : colors.textMuted}
              fill={article.isFavorite ? colors.primary : 'none'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Área de Leitura com Scroll */}
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={100}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.articleContainer}>
          {/* Metadados e Cabeçalho */}
          <View style={styles.headerBlock}>
            <View style={styles.badgeMetaRow}>
              <Badge
                label={article.category || article.categoryName || 'Artigo'}
                variant="primary"
                size="sm"
              />
              <View style={styles.readTimeRow}>
                <Clock size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
                <Text style={[styles.readTimeText, { color: colors.textMuted }]}>
                  {article.readingTimeMinutes || article.readTimeMinutes || 4} min de leitura
                </Text>
              </View>
            </View>

            <Text style={[styles.title, { color: colors.text }]}>{article.title}</Text>
            <Text style={[styles.summary, { color: colors.textSecondary }]}>{article.summary}</Text>

            <View style={styles.metaFooterRow}>
              <Calendar size={13} color={colors.textMuted} style={{ marginRight: 4 }} />
              <Text style={[styles.metaFooterText, { color: colors.textMuted }]}>
                Revisado em {formatDate(article.updatedAt || article.publishedAt || new Date().toISOString())}
              </Text>
            </View>

            <View
              style={[
                styles.reviewBox,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : '#F0F7F6',
                  borderColor: colors.border,
                },
              ]}
            >
              <ShieldCheck size={16} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.reviewText, { color: colors.primaryDark }]}>
                {article.reviewedBy || 'Conteúdo informativo revisado com base em saúde mental.'}
              </Text>
            </View>
          </View>

          {/* Corpo do Artigo Estruturado */}
          <View style={styles.bodyContent}>
            {article.sections && article.sections.length > 0 ? (
              article.sections.map((section, idx) => (
                <View key={idx} style={styles.sectionBlock}>
                  {section.title && (
                    <Text style={[styles.sectionHeading, { color: colors.text }]}>
                      {section.title}
                    </Text>
                  )}
                  <Text style={[styles.paragraph, { color: colors.text }]}>
                    {section.body}
                  </Text>

                  {section.callout && (
                    <View
                      style={[
                        styles.calloutBox,
                        {
                          backgroundColor: isDark ? colors.surfaceSecondary : colors.highlight,
                          borderLeftColor: colors.primary,
                        },
                      ]}
                    >
                      <Text style={[styles.calloutText, { color: colors.primaryDark }]}>
                        {section.callout}
                      </Text>
                    </View>
                  )}

                  {section.list && section.list.length > 0 && (
                    <View style={styles.listWrap}>
                      {section.list.map((item, itemIdx) => (
                        <View key={itemIdx} style={styles.listItemRow}>
                          <Text style={[styles.bulletDot, { color: colors.primary }]}>•</Text>
                          <Text style={[styles.listText, { color: colors.text }]}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            ) : (
              // Fallback se não tiver seções
              <Text style={[styles.paragraph, { color: colors.text }]}>
                {article.content?.replace(/## /g, '\n\n').replace(/\*\*/g, '')}
              </Text>
            )}
          </View>

          {/* Botão de Marcar como Lido / Não Lido */}
          <View style={[styles.readToggleWrap, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              onPress={handleToggleRead}
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
                    fontWeight: isRead ? '700' : '600',
                  },
                ]}
              >
                {isRead ? 'Artigo lido' : 'Marcar como lido'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bloco de Avaliação de Utilidade */}
          <Card variant="bordered" style={styles.feedbackCard}>
            <Text style={[styles.feedbackTitle, { color: colors.text }]}>
              Este conteúdo foi útil para você?
            </Text>
            <View style={styles.feedbackButtonsRow}>
              <TouchableOpacity
                onPress={() => handleFeedback('yes')}
                accessibilityRole="button"
                accessibilityLabel="Sim, foi útil"
                style={[
                  styles.feedbackBtn,
                  {
                    backgroundColor:
                      feedback === 'yes' ? colors.primary : isDark ? colors.surfaceSecondary : '#FFFFFF',
                    borderColor: feedback === 'yes' ? colors.primary : colors.border,
                  },
                ]}
              >
                <ThumbsUp size={16} color={feedback === 'yes' ? '#FFFFFF' : colors.text} />
                <Text
                  style={[
                    styles.feedbackBtnText,
                    { color: feedback === 'yes' ? '#FFFFFF' : colors.text },
                  ]}
                >
                  Sim
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleFeedback('no')}
                accessibilityRole="button"
                accessibilityLabel="Não, não foi útil"
                style={[
                  styles.feedbackBtn,
                  {
                    backgroundColor:
                      feedback === 'no' ? colors.warning : isDark ? colors.surfaceSecondary : '#FFFFFF',
                    borderColor: feedback === 'no' ? colors.warning : colors.border,
                  },
                ]}
              >
                <ThumbsDown size={16} color={feedback === 'no' ? '#FFFFFF' : colors.text} />
                <Text
                  style={[
                    styles.feedbackBtnText,
                    { color: feedback === 'no' ? '#FFFFFF' : colors.text },
                  ]}
                >
                  Não
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Práticas Relacionadas */}
          {relatedPractices.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Prática Relacionada</Text>
              {relatedPractices.map((rp) => (
                <TouchableOpacity
                  key={rp.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (rp.category === 'breathing') {
                      router.push('/practices/breathing');
                    } else if (rp.id === 'practice-grounding-54321') {
                      router.push('/practices/grounding' as any);
                    } else if (rp.id === 'practice-pmr-relaxation') {
                      router.push('/practices/relaxation' as any);
                    } else {
                      router.push(`/practices/player/${rp.id}`);
                    }
                  }}
                  style={[
                    styles.relatedPracticeCard,
                    {
                      backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={[styles.rpIconCircle, { backgroundColor: colors.highlight }]}>
                    <Wind size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rpTitle, { color: colors.text }]}>{rp.title}</Text>
                    <Text style={[styles.rpSubtitle, { color: colors.textSecondary }]}>
                      {rp.subtitle || rp.description}
                    </Text>
                  </View>
                  <ArrowRight size={18} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Outros Artigos Recomendados */}
          {relatedArticles.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Leia Também</Text>
              {relatedArticles.map((ra) => (
                <TouchableOpacity
                  key={ra.id}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/contents/${ra.slug || ra.id}` as any)}
                  style={[
                    styles.relatedArticleRow,
                    {
                      backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.raTitle, { color: colors.text }]}>{ra.title}</Text>
                    <Text style={[styles.raMeta, { color: colors.textMuted }]}>
                      {ra.readingTimeMinutes || ra.readTimeMinutes || 4} min • {ra.category}
                    </Text>
                  </View>
                  <ArrowRight size={16} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Botão de Voltar aos Conteúdos */}
          <AppButton
            title="Voltar aos Conteúdos"
            variant="outline"
            size="md"
            onPress={() => router.back()}
            style={{ marginTop: 16, marginBottom: 32 }}
          />

          {/* Aviso Legal de Saúde */}
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
        </View>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  topProgressBarTrack: {
    height: 3,
    width: '100%',
  },
  topProgressBarFill: {
    height: '100%',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCategory: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: '50%',
  },
  navActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 96,
    alignItems: 'center',
  },
  articleContainer: {
    width: '100%',
    maxWidth: 720,
  },
  headerBlock: {
    marginBottom: 20,
    gap: 8,
  },
  badgeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  readTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTimeText: {
    fontSize: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
  },
  summary: {
    fontSize: 15,
    lineHeight: 22,
  },
  metaFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaFooterText: {
    fontSize: 12,
  },
  reviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  reviewText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  bodyContent: {
    gap: 20,
    marginVertical: 10,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    marginTop: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
  },
  calloutBox: {
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginVertical: 6,
  },
  calloutText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
  listWrap: {
    gap: 6,
    marginVertical: 6,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  listText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
  },
  readToggleWrap: {
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    marginBottom: 20,
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
  feedbackCard: {
    alignItems: 'center',
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  feedbackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  feedbackBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  relatedSection: {
    marginBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  relatedPracticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  rpIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rpTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  rpSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  relatedArticleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  raTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  raMeta: {
    fontSize: 12,
  },
  disclaimerBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 32,
  },
  disclaimerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
