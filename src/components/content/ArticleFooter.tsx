import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ShieldCheck,
  Check,
  ThumbsUp,
  ThumbsDown,
  Clock,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { Article } from '../../types';

export interface ArticleFooterProps {
  article: Article;
  isRead: boolean;
  onToggleRead: () => void;
  feedback: 'yes' | 'no' | null;
  onFeedback: (val: 'yes' | 'no') => void;
  relatedArticles: Article[];
  fontSizeMultiplier?: number;
}

export const ArticleFooter: React.FC<ArticleFooterProps> = ({
  article,
  isRead,
  onToggleRead,
  feedback,
  onFeedback,
  relatedArticles,
  fontSizeMultiplier = 1.0,
}) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  // Determine category-specific notice text
  const getNoticeText = () => {
    const cat = (article.category || '').toLowerCase();
    if (cat.includes('ansiedade')) {
      return 'Este conteúdo é educativo. Se a ansiedade estiver prejudicando suas atividades cotidianas, consulte um psicólogo ou médico de sua confiança.';
    }
    if (cat.includes('sono')) {
      return 'Este conteúdo é educativo. Se a insônia ou dificuldades com o sono forem crônicas, consulte um médico especialista ou psicólogo.';
    }
    if (cat.includes('regulacao') || cat.includes('regulação')) {
      return 'Este conteúdo é educativo. Se a sobrecarga emocional for severa, busque apoio profissional ou ligue 188 (CVV).';
    }
    return 'Este conteúdo é educativo e visa promover a saúde mental, o bem-estar emocional e o autocuidado consciente.';
  };

  return (
    <View style={styles.container}>
      {/* 1. PAINEL DE AVISO EDUCATIVO */}
      <View
        style={[
          styles.noticeCard,
          {
            backgroundColor: isDark ? '#1F2937' : '#EFF6F3',
            borderColor: isDark ? '#334155' : '#D0E5DF',
          },
        ]}
        {...(Platform.OS === 'web' ? ({ role: 'note', 'aria-label': 'Aviso educativo' } as any) : {})}
      >
        <ShieldCheck
          size={20}
          color={isDark ? '#5ECFC3' : '#1F766E'}
          style={styles.noticeIcon}
          aria-hidden={true}
        />
        <View style={styles.noticeContent}>
          <Text
            style={[
              styles.noticeTitle,
              {
                color: isDark ? '#FFFFFF' : '#163F3A',
                fontSize: 15 * fontSizeMultiplier,
              },
            ]}
          >
            Aviso educativo
          </Text>
          <Text
            style={[
              styles.noticeText,
              {
                color: isDark ? '#F1F5F9' : '#37534F',
                fontSize: 13.5 * fontSizeMultiplier,
                lineHeight: 21 * fontSizeMultiplier,
              },
            ]}
          >
            {getNoticeText()}
          </Text>
        </View>
      </View>

      {/* 2. CARD COMBINADO DE CONCLUSÃO E AVALIAÇÃO */}
      <View
        style={[
          styles.actionCard,
          {
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderColor: isDark ? '#334155' : '#E5EBE8',
          },
        ]}
      >
        {/* Linha Superior: Artigo Concluído */}
        <TouchableOpacity
          onPress={onToggleRead}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ selected: isRead }}
          accessibilityLabel={isRead ? 'Artigo concluído. Toque para desmarcar.' : 'Marcar artigo como lido'}
          style={styles.completedRow}
        >
          <View
            style={[
              styles.checkCircle,
              {
                backgroundColor: isDark ? '#5ECFC3' : '#1F766E',
              },
            ]}
          >
            <Check size={15} color={isDark ? '#111827' : '#FFFFFF'} strokeWidth={3} />
          </View>
          <Text
            style={[
              styles.completedText,
              {
                color: isDark ? '#FFFFFF' : '#163F3A',
                fontSize: 16 * fontSizeMultiplier,
              },
            ]}
          >
            Artigo concluído
          </Text>
        </TouchableOpacity>

        {/* Divisor horizontal discreto */}
        <View
          style={[
            styles.cardDivider,
            { backgroundColor: isDark ? '#334155' : '#EDF2EF' },
          ]}
        />

        {/* Linha Inferior: Avaliação */}
        <View style={styles.feedbackRow}>
          <Text
            style={[
              styles.feedbackLabel,
              {
                color: isDark ? '#F1F5F9' : '#37534F',
                fontSize: 14 * fontSizeMultiplier,
              },
            ]}
          >
            Este artigo foi útil?
          </Text>

          <View style={styles.thumbsGroup}>
            <TouchableOpacity
              onPress={() => onFeedback('yes')}
              accessibilityRole="button"
              accessibilityState={{ selected: feedback === 'yes' }}
              accessibilityLabel="Gostei, este artigo foi útil"
              style={[
                styles.thumbBtn,
                {
                  backgroundColor:
                    feedback === 'yes'
                      ? isDark
                        ? '#374151'
                        : '#EFF6F3'
                      : isDark
                      ? '#1F2937'
                      : '#FFFFFF',
                  borderColor:
                    feedback === 'yes'
                      ? isDark
                        ? '#5ECFC3'
                        : '#1F766E'
                      : isDark
                      ? '#4B5563'
                      : '#CAD8D3',
                },
              ]}
            >
              <ThumbsUp
                size={19}
                color={
                  feedback === 'yes'
                    ? isDark
                      ? '#5ECFC3'
                      : '#1F766E'
                    : isDark
                    ? '#94A3B8'
                    : '#596B68'
                }
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onFeedback('no')}
              accessibilityRole="button"
              accessibilityState={{ selected: feedback === 'no' }}
              accessibilityLabel="Não gostei, este artigo não foi útil"
              style={[
                styles.thumbBtn,
                {
                  backgroundColor:
                    feedback === 'no'
                      ? isDark
                        ? '#374151'
                        : '#FDECE5'
                      : isDark
                      ? '#1F2937'
                      : '#FFFFFF',
                  borderColor:
                    feedback === 'no'
                      ? '#D98968'
                      : isDark
                      ? '#4B5563'
                      : '#CAD8D3',
                },
              ]}
            >
              <ThumbsDown
                size={19}
                color={
                  feedback === 'no'
                    ? '#D98968'
                    : isDark
                    ? '#94A3B8'
                    : '#596B68'
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 3. CONTEÚDOS RELACIONADOS */}
      {relatedArticles.length > 0 && (
        <View style={styles.relatedSection}>
          <Text
            accessibilityRole="header"
            aria-level={2}
            style={[
              styles.relatedHeaderTitle,
              {
                color: isDark ? '#FFFFFF' : '#163F3A',
                fontSize: 20 * fontSizeMultiplier,
              },
            ]}
          >
            Conteúdos relacionados
          </Text>

          <View style={styles.relatedGrid}>
            {relatedArticles.map((rel) => (
              <TouchableOpacity
                key={rel.id}
                onPress={() => router.push(`/contents/${rel.slug || rel.id}` as any)}
                activeOpacity={0.85}
                accessibilityRole="link"
                accessibilityLabel={`Ler artigo relacionado: ${rel.title}, ${rel.readingTimeMinutes || 5} minutos de leitura`}
                style={[
                  styles.relatedCard,
                  {
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#E5EBE8',
                  },
                ]}
              >
                <View style={styles.relatedCardBody}>
                  <Text
                    style={[
                      styles.relatedCardCat,
                      { color: isDark ? '#5ECFC3' : '#1F766E' },
                    ]}
                  >
                    {(rel.category || '').toUpperCase()}
                  </Text>
                  <Text
                    style={[
                      styles.relatedCardTitle,
                      {
                        color: isDark ? '#FFFFFF' : '#163F3A',
                        fontSize: 15.5 * fontSizeMultiplier,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {rel.title}
                  </Text>
                  <View style={styles.relatedMetaRow}>
                    <View style={styles.relatedTimeGroup}>
                      <Clock size={14} color="#8C9E9B" style={{ marginRight: 4 }} />
                      <Text style={styles.relatedTimeText}>
                        {rel.readingTimeMinutes || rel.readTimeMinutes || 5} min
                      </Text>
                    </View>
                    <ArrowRight
                      size={18}
                      color={isDark ? '#5ECFC3' : '#1F766E'}
                      strokeWidth={2.2}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 4. BOTÃO PARA VOLTAR */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/content' as any)}
        activeOpacity={0.8}
        accessibilityRole="link"
        accessibilityLabel="Voltar para todos os conteúdos"
        style={[
          styles.backBtn,
          {
            backgroundColor: isDark ? '#1F2937' : '#F5FAF8',
            borderColor: isDark ? '#5ECFC3' : '#1F766E',
          },
        ]}
      >
        <ArrowLeft
          size={18}
          color={isDark ? '#5ECFC3' : '#1F766E'}
          strokeWidth={2.2}
          style={{ marginRight: 8 }}
        />
        <Text
          style={[
            styles.backBtnText,
            { color: isDark ? '#5ECFC3' : '#1F766E' },
          ]}
        >
          Voltar para todos os conteúdos
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 24,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  noticeIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  noticeText: {
    fontWeight: '400',
  },
  actionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  completedText: {
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    marginVertical: 16,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedbackLabel: {
    fontWeight: '500',
  },
  thumbsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumbBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedSection: {
    marginBottom: 28,
  },
  relatedHeaderTitle: {
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  relatedGrid: {
    gap: 12,
  },
  relatedCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  relatedCardBody: {
    flex: 1,
  },
  relatedCardCat: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  relatedCardTitle: {
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 10,
  },
  relatedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  relatedTimeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  relatedTimeText: {
    fontSize: 13,
    color: '#667775',
    fontWeight: '500',
  },
  backBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
