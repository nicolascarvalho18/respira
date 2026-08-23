import React, { useEffect, useState, useRef } from 'react';
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
  CheckCircle2,
  Share2,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Type,
  BookOpen,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { useToast } from '../../src/components/ui/Toast';
import { useContentStore } from '../../src/store/contentStore';
import { useTheme } from '../../src/hooks/useTheme';
import { Article } from '../../src/types';
import { normalizeText } from '../../src/data/articles';
import {
  NightSkyMoonThumb,
  SageLeavesThumb,
  WarmSunHillsThumb,
  RiverHillsThumb,
} from '../../src/components/illustrations/ArticleThumbnails';

export default function ArticleDetailSlugScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { articles, toggleFavorite, updateProgress } = useContentStore();
  const { showToast } = useToast();

  const [article, setArticle] = useState<Article | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isRead, setIsRead] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1.0); // 0.9, 1.0, 1.15, 1.3
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);
  const [showResumeBanner, setShowResumeBanner] = useState(false);

  const scrollViewRef = useRef<ScrollView | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (slug && articles.length > 0) {
      const found = articles.find((a) => a.slug === slug || a.id === slug);
      if (found) {
        setArticle(found);
        const existingProgress = found.readProgress || 0;
        setScrollProgress(existingProgress);
        setIsRead(existingProgress >= 90);
        if (existingProgress > 10 && existingProgress < 90) {
          setShowResumeBanner(true);
        }
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
      if (article) {
        updateProgress(article.id, 100);
      }
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
    } catch (_err) {
      // Ignored
    }
  };

  const handleFeedback = (val: 'yes' | 'no') => {
    setFeedback(val);
    showToast({
      message:
        val === 'yes'
          ? 'Obrigado pela sua avaliação!'
          : 'Agradecemos o retorno para melhorar.',
      type: 'info',
    });
  };

  if (!article) {
    return (
      <AppShell>
        <LoadingState message="Carregando conteúdo..." />
      </AppShell>
    );
  }

  // 3 Related Articles
  const relatedArticles: Article[] = articles
    .filter((a) => a.id !== article.id)
    .filter((a) => {
      if (article.relatedArticleIds?.includes(a.slug) || article.relatedArticleIds?.includes(a.id)) {
        return true;
      }
      return normalizeText(a.category) === normalizeText(article.category);
    })
    .slice(0, 3);

  // Artwork
  const renderCoverIllustration = () => {
    const cat = normalizeText(article.category || '');
    if (cat.includes('sono')) {
      return <NightSkyMoonThumb size={110} borderRadius={16} />;
    }
    if (cat.includes('regulacao') || cat.includes('atencao')) {
      return <SageLeavesThumb size={110} borderRadius={16} />;
    }
    if (cat.includes('ansiedade')) {
      return <WarmSunHillsThumb size={110} borderRadius={16} />;
    }
    return <RiverHillsThumb size={110} borderRadius={16} />;
  };

  return (
    <AppShell>
      {/* Barra de Progresso de Leitura Fixa no Topo */}
      <View style={styles.topProgressTrack}>
        <View
          style={[
            styles.topProgressBar,
            { width: `${Math.min(100, Math.max(0, scrollProgress))}%` },
          ]}
        />
      </View>

      <ScrollView
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Barra de Ações Superior */}
        <View style={styles.navBarRow}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/content' as any)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Voltar para conteúdos"
            style={[
              styles.iconCircleBtn,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F2F6F5',
                borderColor: isDark ? colors.border : '#DCE5E2',
              },
            ]}
          >
            <ArrowLeft size={18} color={isDark ? colors.text : '#173D3B'} />
          </TouchableOpacity>

          <View style={styles.topActionsGroup}>
            {/* Ajuste de Tamanho de Fonte */}
            <View style={styles.fontControlsRow}>
              <TouchableOpacity
                onPress={() =>
                  setFontSizeMultiplier((prev) => Math.max(0.85, prev - 0.1))
                }
                style={[
                  styles.fontBtn,
                  {
                    backgroundColor: isDark ? colors.surfaceSecondary : '#F2F6F5',
                    borderColor: isDark ? colors.border : '#DCE5E2',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Diminuir tamanho do texto"
              >
                <Text style={[styles.fontBtnText, { color: isDark ? colors.text : '#173D3B' }]}>
                  A-
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  setFontSizeMultiplier((prev) => Math.min(1.35, prev + 0.1))
                }
                style={[
                  styles.fontBtn,
                  {
                    backgroundColor: isDark ? colors.surfaceSecondary : '#F2F6F5',
                    borderColor: isDark ? colors.border : '#DCE5E2',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Aumentar tamanho do texto"
              >
                <Text style={[styles.fontBtnText, { color: isDark ? colors.text : '#173D3B' }]}>
                  A+
                </Text>
              </TouchableOpacity>
            </View>

            {/* Favoritar */}
            <TouchableOpacity
              onPress={() => toggleFavorite(article.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Favoritar artigo"
              style={[
                styles.iconCircleBtn,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : '#F2F6F5',
                  borderColor: isDark ? colors.border : '#DCE5E2',
                },
              ]}
            >
              <Bookmark
                size={18}
                color="#2F7F7C"
                fill={article.isFavorite ? '#2F7F7C' : 'transparent'}
              />
            </TouchableOpacity>

            {/* Compartilhar */}
            <TouchableOpacity
              onPress={handleShare}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Compartilhar artigo"
              style={[
                styles.iconCircleBtn,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : '#F2F6F5',
                  borderColor: isDark ? colors.border : '#DCE5E2',
                },
              ]}
            >
              <Share2 size={18} color={isDark ? colors.text : '#173D3B'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Banner "Continuar de onde parou" */}
        {showResumeBanner && (
          <View
            style={[
              styles.resumeBanner,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
                borderColor: isDark ? colors.border : '#C7E5DC',
              },
            ]}
          >
            <BookOpen size={16} color="#2F7F7C" style={{ marginRight: 8 }} />
            <Text style={[styles.resumeBannerText, { color: isDark ? colors.text : '#173D3B' }]}>
              Você já leu {scrollProgress}% deste artigo.
            </Text>
            <TouchableOpacity
              onPress={() => setShowResumeBanner(false)}
              style={styles.resumeCloseBtn}
            >
              <Text style={styles.resumeCloseBtnText}>Entendi</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 2. Cabeçalho do Artigo com Categoria e Capa */}
        <View style={styles.articleHeaderBlock}>
          <View style={styles.headerMetaRow}>
            <View style={styles.catBadge}>
              <Text style={styles.catBadgeText}>
                {article.category.toUpperCase()}
              </Text>
            </View>
            <View style={styles.readTimeMeta}>
              <Clock size={12} color="#8C9E9B" style={{ marginRight: 4 }} />
              <Text style={styles.readTimeMetaText}>
                {article.readingTimeMinutes || 5} min de leitura
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.mainTitle,
              { color: isDark ? colors.text : '#173D3B', fontSize: 24 * fontSizeMultiplier },
            ]}
          >
            {article.title}
          </Text>

          <Text
            style={[
              styles.summaryText,
              { color: isDark ? colors.textMuted : '#667775', fontSize: 14 * fontSizeMultiplier },
            ]}
          >
            {article.summary}
          </Text>

          {/* Ilustração Temática de Capa */}
          <View style={styles.coverIllustrationWrap}>
            {renderCoverIllustration()}
          </View>
        </View>

        {/* 3. Corpo Completo do Artigo */}
        <View style={styles.bodyWrapper}>
          {article.content?.split('\n\n').map((paragraph, pIdx) => {
            const trimmed = paragraph.trim();

            if (trimmed.startsWith('### ')) {
              return (
                <Text
                  key={pIdx}
                  style={[
                    styles.subheading,
                    {
                      color: isDark ? colors.text : '#173D3B',
                      fontSize: 18 * fontSizeMultiplier,
                    },
                  ]}
                >
                  {trimmed.replace('### ', '')}
                </Text>
              );
            }

            if (trimmed.startsWith('## ')) {
              return (
                <Text
                  key={pIdx}
                  style={[
                    styles.sectionHeading,
                    {
                      color: isDark ? colors.text : '#173D3B',
                      fontSize: 20 * fontSizeMultiplier,
                    },
                  ]}
                >
                  {trimmed.replace('## ', '')}
                </Text>
              );
            }

            if (trimmed.startsWith('*Aviso:') || trimmed.startsWith('> ')) {
              return (
                <View
                  key={pIdx}
                  style={[
                    styles.calloutBox,
                    {
                      backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
                      borderColor: isDark ? colors.border : '#C7E5DC',
                    },
                  ]}
                >
                  <ShieldCheck size={16} color="#2F7F7C" style={{ marginRight: 8 }} />
                  <Text
                    style={[
                      styles.calloutText,
                      {
                        color: isDark ? colors.text : '#567571',
                        fontSize: 13 * fontSizeMultiplier,
                      },
                    ]}
                  >
                    {trimmed.replace('*Aviso:', 'Aviso:').replace('> ', '')}
                  </Text>
                </View>
              );
            }

            return (
              <Text
                key={pIdx}
                style={[
                  styles.paragraph,
                  {
                    color: isDark ? colors.text : '#2C4A47',
                    fontSize: 15 * fontSizeMultiplier,
                    lineHeight: 24 * fontSizeMultiplier,
                  },
                ]}
              >
                {trimmed}
              </Text>
            );
          })}
        </View>

        {/* 4. Ações de Finalização: Marcar como Lido e Avaliação */}
        <View
          style={[
            styles.footerActionCard,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#DCE5E2',
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleToggleRead}
            activeOpacity={0.85}
            style={[
              styles.markReadBtn,
              isRead && { backgroundColor: '#E7F3EF', borderColor: '#2F7F7C' },
            ]}
          >
            <CheckCircle2
              size={18}
              color={isRead ? '#2F7F7C' : '#FFFFFF'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.markReadBtnText,
                isRead && { color: '#2F7F7C' },
              ]}
            >
              {isRead ? 'Artigo concluído' : 'Marcar como lido'}
            </Text>
          </TouchableOpacity>

          {/* Feedback */}
          <View style={styles.feedbackRow}>
            <Text style={[styles.feedbackLabel, { color: isDark ? colors.textMuted : '#667775' }]}>
              Este artigo foi útil para você?
            </Text>
            <View style={styles.thumbsGroup}>
              <TouchableOpacity
                onPress={() => handleFeedback('yes')}
                style={[
                  styles.thumbBtn,
                  feedback === 'yes' && { backgroundColor: '#E7F3EF' },
                ]}
              >
                <ThumbsUp
                  size={16}
                  color={feedback === 'yes' ? '#2F7F7C' : '#8C9E9B'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleFeedback('no')}
                style={[
                  styles.thumbBtn,
                  feedback === 'no' && { backgroundColor: '#FDECE5' },
                ]}
              >
                <ThumbsDown
                  size={16}
                  color={feedback === 'no' ? '#D98968' : '#8C9E9B'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 5. Artigos Relacionados */}
        {relatedArticles.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={[styles.relatedTitle, { color: isDark ? colors.text : '#173D3B' }]}>
              Conteúdos Relacionados
            </Text>
            <View style={styles.relatedCardsList}>
              {relatedArticles.map((rel) => (
                <TouchableOpacity
                  key={rel.id}
                  onPress={() => router.push(`/contents/${rel.slug || rel.id}` as any)}
                  activeOpacity={0.8}
                  style={[
                    styles.relatedCard,
                    {
                      backgroundColor: isDark ? colors.surface : '#FFFFFF',
                      borderColor: isDark ? colors.border : '#EBF1EF',
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.relatedCardCat}>{rel.category.toUpperCase()}</Text>
                    <Text
                      style={[styles.relatedCardTitle, { color: isDark ? colors.text : '#173D3B' }]}
                      numberOfLines={2}
                    >
                      {rel.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <Clock size={10} color="#8C9E9B" style={{ marginRight: 3 }} />
                      <Text style={styles.relatedCardTime}>
                        {rel.readingTimeMinutes || 5} min
                      </Text>
                    </View>
                  </View>
                  <ArrowRight size={16} color="#2F7F7C" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Botão Final: Voltar à Biblioteca */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/content' as any)}
          style={[
            styles.backToLibraryBtn,
            {
              backgroundColor: isDark ? colors.surfaceSecondary : '#F2F6F5',
              borderColor: isDark ? colors.border : '#DCE5E2',
            },
          ]}
        >
          <ArrowLeft size={16} color="#2F7F7C" style={{ marginRight: 6 }} />
          <Text style={styles.backToLibraryBtnText}>Voltar para todos os conteúdos</Text>
        </TouchableOpacity>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  topProgressTrack: {
    height: 3,
    backgroundColor: '#E7F1EE',
    width: '100%',
  },
  topProgressBar: {
    height: '100%',
    backgroundColor: '#2F7F7C',
  },
  scrollContent: {
    paddingBottom: 60,
  },
  navBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 8,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fontControlsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  fontBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  fontBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Resume Banner
  resumeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 16,
  },
  resumeBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  resumeCloseBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#2F7F7C',
    borderRadius: 6,
  },
  resumeCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Header Block
  articleHeaderBlock: {
    marginBottom: 20,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  catBadge: {
    backgroundColor: '#E7F3EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2F7F7C',
    letterSpacing: 0.5,
  },
  readTimeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTimeMetaText: {
    fontSize: 11,
    color: '#8C9E9B',
  },
  mainTitle: {
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 32,
    marginBottom: 8,
  },
  summaryText: {
    lineHeight: 22,
    marginBottom: 16,
  },
  coverIllustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },

  // Body
  bodyWrapper: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  subheading: {
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  paragraph: {
    marginBottom: 16,
  },
  calloutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginVertical: 16,
  },
  calloutText: {
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },

  // Footer Actions
  footerActionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F7F7C',
    borderWidth: 1,
    borderColor: '#2F7F7C',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  markReadBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 8,
  },
  feedbackLabel: {
    fontSize: 12,
  },
  thumbsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  thumbBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Related
  relatedSection: {
    marginBottom: 20,
  },
  relatedTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  relatedCardsList: {
    gap: 8,
  },
  relatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  relatedCardCat: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2F7F7C',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  relatedCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  relatedCardTime: {
    fontSize: 10,
    color: '#8C9E9B',
  },

  // Back to Library Button
  backToLibraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  backToLibraryBtnText: {
    color: '#2F7F7C',
    fontSize: 13,
    fontWeight: '700',
  },
});
