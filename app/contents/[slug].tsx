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
  ArrowLeft,
  Share2,
  BookOpen,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { useToast } from '../../src/components/ui/Toast';
import { useContentStore } from '../../src/store/contentStore';
import { useTheme } from '../../src/hooks/useTheme';
import { SafeMarkdown } from '../../src/components/ui/SafeMarkdown';
import { Article } from '../../src/types';
import { normalizeText } from '../../src/data/articles';
import { ArticleCoverImage } from '../../src/components/illustrations/ArticleCovers';
import { ArticleFooter } from '../../src/components/content/ArticleFooter';

export default function ArticleDetailSlugScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { articles, toggleFavorite, updateProgress } = useContentStore();
  const { showToast } = useToast();

  const [article, setArticle] = useState<Article | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isRead, setIsRead] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1.0);
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);
  const [showResumeBanner, setShowResumeBanner] = useState(false);

  const scrollViewRef = useRef<ScrollView | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (slug && articles.length > 0) {
      const found = articles.find((a) => a.slug === slug || a.id === slug);
      if (found) {
        setArticle(found);
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          document.title = `${found.title} — Respira`;
        }
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

  // Clean trailing notice from markdown body so ArticleFooter handles it
  const bodyMarkdown = (article.content || '')
    .replace(/\n\n(\*|<em>|<strong>)?Aviso[\s\S]*$/i, '')
    .trim();

  // Artwork
  const renderCoverIllustration = () => {
    return (
      <ArticleCoverImage
        slug={article.slug || article.id}
        category={article.category}
        height={220}
        borderRadius={16}
      />
    );
  };

  return (
    <AppShell scrollable={false}>
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
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: isDark ? colors.background : '#FAFAF7' },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageInnerContainer}>
          {/* 1. Barra de Ações Superior */}
          <View style={styles.navBarRow}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/content' as any)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="link"
              accessibilityLabel="Voltar para a biblioteca de conteúdos"
              style={[
                styles.iconCircleBtn,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : '#F2F6F5',
                  borderColor: isDark ? colors.border : '#DCE5E2',
                },
              ]}
            >
              <ArrowLeft size={18} color={isDark ? colors.text : '#163F3A'} />
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
                  <Text style={[styles.fontBtnText, { color: isDark ? colors.text : '#163F3A' }]}>
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
                  <Text style={[styles.fontBtnText, { color: isDark ? colors.text : '#163F3A' }]}>
                    A+
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Favoritar */}
              <TouchableOpacity
                onPress={() => toggleFavorite(article.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityState={{ selected: !!article.isFavorite }}
                accessibilityLabel={
                  article.isFavorite
                    ? `Remover artigo ${article.title} dos favoritos`
                    : `Favoritar artigo: ${article.title}`
                }
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
                  color="#1F766E"
                  fill={article.isFavorite ? '#1F766E' : 'transparent'}
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
                <Share2 size={18} color={isDark ? colors.text : '#163F3A'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Banner "Continuar de onde parou" */}
          {showResumeBanner && (
            <View
              style={[
                styles.resumeBanner,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : '#EFF6F3',
                  borderColor: isDark ? colors.border : '#D0E5DF',
                },
              ]}
            >
              <BookOpen size={16} color="#1F766E" style={{ marginRight: 8 }} />
              <Text style={[styles.resumeBannerText, { color: isDark ? colors.text : '#163F3A' }]}>
                Você já leu {scrollProgress}% deste artigo.
              </Text>
              <TouchableOpacity
                onPress={() => setShowResumeBanner(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar aviso de continuação de leitura"
                style={styles.resumeCloseBtn}
              >
                <Text style={styles.resumeCloseBtnText}>Entendi</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 2. Cabeçalho do Artigo */}
          <View style={styles.articleHeaderBlock}>
            <View style={styles.headerMetaRow}>
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>
                  {(article.category || '').toUpperCase()}
                </Text>
              </View>
              <View style={styles.readTimeMeta}>
                <Clock size={13} color="#8C9E9B" style={{ marginRight: 4 }} />
                <Text style={styles.readTimeMetaText}>
                  {article.readingTimeMinutes || article.readTimeMinutes || 5} min de leitura
                </Text>
              </View>
            </View>

            {/* H1 Semântico */}
            <Text
              accessibilityRole="header"
              aria-level={1}
              style={[
                styles.mainTitle,
                {
                  color: isDark ? colors.text : '#163F3A',
                  fontSize: 26 * fontSizeMultiplier,
                  lineHeight: 34 * fontSizeMultiplier,
                },
              ]}
            >
              {article.title}
            </Text>

            <Text
              style={[
                styles.summaryText,
                {
                  color: isDark ? colors.textMuted : '#596B68',
                  fontSize: 15 * fontSizeMultiplier,
                  lineHeight: 23 * fontSizeMultiplier,
                },
              ]}
            >
              {article.summary}
            </Text>

            {/* Ilustração Temática de Capa */}
            <View style={styles.coverIllustrationWrap}>
              {renderCoverIllustration()}
            </View>
          </View>

          {/* 3. Corpo do Artigo Renderizado com SafeMarkdown */}
          <View style={styles.bodyWrapper}>
            <SafeMarkdown
              content={bodyMarkdown}
              fontSizeMultiplier={fontSizeMultiplier}
            />
          </View>

          {/* 4. Parte Final do Artigo: Novo Footer Padronizado */}
          <ArticleFooter
            article={article}
            isRead={isRead}
            onToggleRead={handleToggleRead}
            feedback={feedback}
            onFeedback={handleFeedback}
            relatedArticles={relatedArticles}
            fontSizeMultiplier={fontSizeMultiplier}
          />
        </View>
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
    backgroundColor: '#1F766E',
  },
  scrollContent: {
    paddingBottom: 60,
    minHeight: '100%',
    alignItems: 'center',
  },
  pageInnerContainer: {
    width: '100%',
    maxWidth: 1000,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  navBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  fontBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  resumeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  resumeBannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  resumeCloseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#1F766E',
    borderRadius: 6,
  },
  resumeCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  articleHeaderBlock: {
    marginBottom: 24,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  catBadge: {
    backgroundColor: '#EFF6F3',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1F766E',
    letterSpacing: 0.5,
  },
  readTimeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTimeMetaText: {
    fontSize: 12,
    color: '#8C9E9B',
    fontWeight: '500',
  },
  mainTitle: {
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  summaryText: {
    marginBottom: 18,
  },
  coverIllustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    width: '100%',
  },
  bodyWrapper: {
    marginBottom: 10,
  },
});
