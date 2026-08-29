import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Play,
  Bookmark,
  Share2,
  SlidersHorizontal,
  ArrowRight,
  ShieldAlert,
  Smile,
  Meh,
  Frown,
  Check,
  RotateCcw,
  Clock,
  Activity,
  Headphones,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../ui/Toast';
import { GuidedVideoAudioPlayer } from './GuidedVideoAudioPlayer';
import { PracticeSelectorModal } from './PracticeSelectorModal';
import { usePracticeStore } from '../../store/practiceStore';
import { useAuth } from '../../hooks/useAuth';
import { getPracticeImage, getPracticeAltText } from '../../utils/practiceImages';
import { Practice } from '../../types';

export interface UniversalPracticePlayerProps {
  practice: Practice;
  allPractices: Practice[];
  onSelectPractice: (p: Practice) => void;
  onRecordCompletion: (practiceId: string) => Promise<void>;
  onToggleFavorite: (practiceId: string) => Promise<void>;
  onBack: () => void;
}

export const UniversalPracticePlayer: React.FC<UniversalPracticePlayerProps> = ({
  practice,
  allPractices,
  onSelectPractice,
  onRecordCompletion,
  onToggleFavorite,
  onBack,
}) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const { user } = useAuth();
  const userId = user?.id || 'demo-user-1';

  const {
    userProgress,
    saveProgress,
    recordPostFeeling,
  } = usePracticeStore();

  const currentProgress = userProgress[practice.id];

  const [isPlayerActive, setIsPlayerActive] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedFeeling, setSelectedFeeling] = useState<'calmer' | 'same' | 'uncomfortable' | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [hasRecordedCompletion, setHasRecordedCompletion] = useState(false);
  const [showStickyBottomBar, setShowStickyBottomBar] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  // Práticas Relacionadas (máximo 3)
  const relatedPractices = (practice.relatedPracticeIds || [])
    .map((id) => allPractices.find((p) => p.id === id))
    .filter((p): p is Practice => p !== undefined)
    .slice(0, 3);

  // Próxima prática recomendada
  const currentIndex = allPractices.findIndex((p) => p.id === practice.id);
  const nextPractice =
    practice.nextPracticeId && allPractices.find((p) => p.id === practice.nextPracticeId)
      ? allPractices.find((p) => p.id === practice.nextPracticeId)!
      : allPractices.length > 1
      ? allPractices[(currentIndex + 1) % allPractices.length]
      : null;

  const handleStartOrContinue = () => {
    setIsPlayerActive(true);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleProgressUpdate = async (posSec: number, totalSec: number) => {
    await saveProgress(userId, practice.id, posSec, totalSec, false);
  };

  const handlePlayerComplete = async () => {
    await saveProgress(
      userId,
      practice.id,
      practice.durationMinutes * 60,
      practice.durationMinutes * 60,
      true
    );
    if (!hasRecordedCompletion) {
      setHasRecordedCompletion(true);
      await onRecordCompletion(practice.id);
    }
    setShowCompletionModal(true);
  };

  const handleRestartPractice = () => {
    setShowCompletionModal(false);
    setSelectedFeeling(null);
    setHasRecordedCompletion(false);
    setIsPlayerActive(true);
  };

  const handleSelectNextPractice = () => {
    if (nextPractice && nextPractice.id !== practice.id) {
      setShowCompletionModal(false);
      setSelectedFeeling(null);
      setHasRecordedCompletion(false);
      setIsPlayerActive(false);
      onSelectPractice(nextPractice);
    }
  };

  const handleSelectFeeling = async (feeling: 'calmer' | 'same' | 'uncomfortable') => {
    setSelectedFeeling(feeling);
    await recordPostFeeling(userId, practice.id, feeling);
    showToast({
      message: 'Sensação registrada no seu diário',
      type: 'info',
    });
  };

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({
          title: `${practice.title} — Respira`,
          text: practice.description,
          url: window.location.href,
        });
      } else if (Platform.OS !== 'web') {
        await Share.share({
          message: `${practice.title} no Respira: ${practice.description}`,
          title: practice.title,
        });
      } else {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(window.location.href);
          showToast({ message: 'Link copiado para a área de transferência', type: 'success' });
        }
      }
    } catch (_err) {
      // Compartilhamento cancelado
    }
  };

  // Monitorar rolagem para exibir barra fixa inferior
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    if (scrollY > 280 && !isPlayerActive) {
      if (!showStickyBottomBar) setShowStickyBottomBar(true);
    } else {
      if (showStickyBottomBar) setShowStickyBottomBar(false);
    }
  };

  // Obter rótulo e categoria amigáveis
  const getCategoryLabel = () => {
    switch (practice.category) {
      case 'breathing':
        return 'Respiração';
      case 'guided_meditation':
        return 'Meditação';
      case 'mindfulness':
        return 'Atenção plena';
      case 'body_movement':
        return 'Corpo e movimento';
      case 'morning_routine':
        return 'Rotina matinal';
      case 'bedtime_prep':
        return 'Sono e relaxamento';
      case 'quick_pauses':
        return 'Pausas rápidas';
      default:
        return 'Bem-estar';
    }
  };

  // Descrição humanizada e responsável (sem promessas médicas)
  const getHumanizedDescription = () => {
    if (practice.id === 'practice-heart-coherence' || practice.title.toLowerCase().includes('coerência')) {
      return 'Uma prática de respiração ritmada para ajudar você a desacelerar e observar seu corpo com mais atenção.';
    }
    return practice.description;
  };

  // Etapas da Timeline Vertical Humanizadas
  const getTimelineStages = () => {
    if (practice.stages && practice.stages.length > 0) {
      return practice.stages.map((st) => ({
        stepNumber: String(st.step).padStart(2, '0'),
        title: st.title.replace(/\(\d+s\)/g, '').trim(),
        description: st.instruction,
      }));
    }

    if (practice.id === 'practice-heart-coherence' || practice.category === 'breathing') {
      return [
        {
          stepNumber: '01',
          title: 'Perceba o contato',
          description: 'Repouse uma das mãos sobre o peito e observe o contato suave da respiração.',
        },
        {
          stepNumber: '02',
          title: 'Encontre seu ritmo',
          description: 'Inspire e expire suavemente, sem ultrapassar os seus limites confortáveis.',
        },
        {
          stepNumber: '03',
          title: 'Continue com atenção',
          description: 'Mantenha um ritmo confortável durante a prática, soltando o ar devagar.',
        },
      ];
    }

    return [
      {
        stepNumber: '01',
        title: 'Prepare o ambiente',
        description: 'Sente-se com a coluna apoiada e descanse as mãos onde for mais confortável.',
      },
      {
        stepNumber: '02',
        title: 'Acompanhe a condução',
        description: 'Respire no seu tempo natural seguindo as orientações com tranquilidade.',
      },
      {
        stepNumber: '03',
        title: 'Retorne com calma',
        description: 'Ao finalizar, perceba como seu corpo e sua mente se sentem agora.',
      },
    ];
  };

  // O que você pode perceber (percepções responsáveis)
  const getPerceptions = () => {
    if (practice.benefits && practice.benefits.length > 0) {
      return practice.benefits;
    }
    return [
      'Sensação de ritmo mais lento e organizado.',
      'Maior atenção à respiração e ao momento presente.',
    ];
  };

  // Formatação de data em português
  const formatCompletedDate = (isoDate?: string) => {
    if (!isoDate) return null;
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  };

  const completedCount = currentProgress?.completedCount || practice.completedCount || 0;
  const lastCompletedDate = formatCompletedDate(currentProgress?.lastCompletedAt);
  const hasProgress = currentProgress && currentProgress.progressPercent > 0 && currentProgress.progressPercent < 100;
  const primaryButtonLabel = hasProgress ? 'Continuar prática' : 'Começar prática';
  const initialPosition = currentProgress ? currentProgress.playbackPositionSeconds : 0;

  return (
    <View style={[styles.screenContainer, { backgroundColor: isDark ? '#121E1C' : '#F7F8F4' }]}>
      {/* 1. CABEÇALHO COMPACTO E FIXO */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: isDark ? '#121E1C' : '#F7F8F4',
            borderBottomColor: isDark ? '#1E2F2B' : '#E2E8E5',
          },
        ]}
      >
        <TouchableOpacity
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Voltar às práticas"
          style={styles.headerIconButton}
        >
          <ArrowLeft size={20} color={isDark ? '#F1F5F9' : '#183330'} />
        </TouchableOpacity>

        <Text
          numberOfLines={1}
          style={[styles.headerTitle, { color: isDark ? '#F1F5F9' : '#183330' }]}
        >
          {practice.title}
        </Text>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            onPress={() => onToggleFavorite(practice.id)}
            accessibilityRole="button"
            accessibilityLabel={practice.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            style={styles.headerIconButton}
          >
            <Bookmark
              size={18}
              color="#176F69"
              fill={practice.isFavorite ? '#176F69' : 'transparent'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Compartilhar prática"
            style={styles.headerIconButton}
          >
            <Share2 size={18} color={isDark ? '#A2B5B1' : '#647572'} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsSelectorOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Opções e outras práticas"
            style={styles.headerIconButton}
          >
            <SlidersHorizontal size={18} color={isDark ? '#A2B5B1' : '#647572'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTEÚDO COM ROLAGEM SUAVE */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* 2. REPRODUTOR GUIADO (QUANDO ATIVO) OU APRESENTAÇÃO HERO */}
        {isPlayerActive ? (
          <View style={styles.playerContainer}>
            <GuidedVideoAudioPlayer
              practice={practice}
              initialPositionSeconds={initialPosition}
              onProgressUpdate={handleProgressUpdate}
              onComplete={handlePlayerComplete}
            />

            <TouchableOpacity
              onPress={() => setIsPlayerActive(false)}
              style={styles.minimizePlayerBtn}
            >
              <Text style={styles.minimizePlayerText}>Ver detalhes da prática</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.heroSection}>
            {/* Imagem Realista 16:9 com Cantos de 16px */}
            <View style={styles.heroImageWrapper}>
              <Image
                source={getPracticeImage(practice.id)}
                style={styles.heroImage}
                resizeMode="cover"
                accessibilityLabel={getPracticeAltText(practice.id)}
              />
            </View>

            {/* Chips Discretos de Categoria, Nível e Duração */}
            <View style={styles.chipsRow}>
              <View style={[styles.metaChip, { backgroundColor: isDark ? '#1D3430' : '#E6F1EE' }]}>
                <Text style={[styles.metaChipText, { color: isDark ? '#5ECFC3' : '#176F69' }]}>
                  {getCategoryLabel()}
                </Text>
              </View>

              <View style={[styles.metaChip, { backgroundColor: isDark ? '#1D3430' : '#E6F1EE' }]}>
                <Text style={[styles.metaChipText, { color: isDark ? '#5ECFC3' : '#176F69' }]}>
                  {practice.level}
                </Text>
              </View>

              <View style={[styles.metaChip, { backgroundColor: isDark ? '#1D3430' : '#E6F1EE' }]}>
                <Clock size={12} color={isDark ? '#5ECFC3' : '#176F69'} style={{ marginRight: 4 }} />
                <Text style={[styles.metaChipText, { color: isDark ? '#5ECFC3' : '#176F69' }]}>
                  {practice.durationMinutes} min
                </Text>
              </View>
            </View>

            {/* Título Principal: 32px, Peso 700 */}
            <Text style={[styles.heroTitle, { color: isDark ? '#F1F5F9' : '#183330' }]}>
              {practice.title}
            </Text>

            {/* Descrição Curta Humanizada */}
            <Text style={[styles.heroDescription, { color: isDark ? '#A2B5B1' : '#647572' }]}>
              {getHumanizedDescription()}
            </Text>

            {/* 3. BOTÃO PRINCIPAL (ALTURA 52px, VERDE-PETRÓLEO) */}
            <TouchableOpacity
              onPress={handleStartOrContinue}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={primaryButtonLabel}
              style={styles.primaryActionButton}
            >
              <Play size={18} color="#FFFFFF" fill="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryActionButtonText}>{primaryButtonLabel}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* FEEDBACK PÓS-PRÁTICA (MODAL DISCRETO) */}
        {showCompletionModal && (
          <View style={[styles.postPracticeCard, { backgroundColor: isDark ? '#192A27' : '#FFFFFF', borderColor: '#176F69' }]}>
            <View style={styles.postPracticeHeader}>
              <Check size={20} color="#176F69" />
              <Text style={[styles.postPracticeTitle, { color: isDark ? '#F1F5F9' : '#183330' }]}>
                Prática concluída. Como você está se sentindo agora?
              </Text>
            </View>

            <View style={styles.feelingOptionsRow}>
              <TouchableOpacity
                onPress={() => handleSelectFeeling('calmer')}
                style={[
                  styles.feelingOptionBtn,
                  selectedFeeling === 'calmer' && styles.feelingOptionBtnActive,
                  { backgroundColor: isDark ? '#121E1C' : '#F7F8F4' },
                ]}
              >
                <Smile size={16} color="#176F69" />
                <Text style={[styles.feelingOptionText, { color: isDark ? '#F1F5F9' : '#183330' }]}>
                  Mais tranquilo(a)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSelectFeeling('same')}
                style={[
                  styles.feelingOptionBtn,
                  selectedFeeling === 'same' && styles.feelingOptionBtnActive,
                  { backgroundColor: isDark ? '#121E1C' : '#F7F8F4' },
                ]}
              >
                <Meh size={16} color="#B76B45" />
                <Text style={[styles.feelingOptionText, { color: isDark ? '#F1F5F9' : '#183330' }]}>
                  Igual
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSelectFeeling('uncomfortable')}
                style={[
                  styles.feelingOptionBtn,
                  selectedFeeling === 'uncomfortable' && styles.feelingOptionBtnActive,
                  { backgroundColor: isDark ? '#121E1C' : '#F7F8F4' },
                ]}
              >
                <Frown size={16} color="#B76B45" />
                <Text style={[styles.feelingOptionText, { color: isDark ? '#F1F5F9' : '#183330' }]}>
                  Desconfortável
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.postPracticeActionsRow}>
              {nextPractice && nextPractice.id !== practice.id && (
                <TouchableOpacity
                  onPress={handleSelectNextPractice}
                  style={styles.postNextBtn}
                >
                  <Text style={styles.postNextBtnText}>Próxima: {nextPractice.title}</Text>
                  <ArrowRight size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleRestartPractice}
                style={[styles.postRepeatBtn, { borderColor: isDark ? '#293B37' : '#E2E8E5' }]}
              >
                <RotateCcw size={14} color="#176F69" />
                <Text style={styles.postRepeatBtnText}>Fazer novamente</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 4. SEÇÃO: ANTES DE COMEÇAR (COMPACTA, SEM CARDS GIGANTES) */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#183330' }]}>
            Antes de começar
          </Text>

          <View style={styles.guidelinesList}>
            <View style={styles.guidelineItem}>
              <View style={styles.guidelineDot} />
              <Text style={[styles.guidelineText, { color: isDark ? '#F1F5F9' : '#183330' }]}>
                Encontre uma posição confortável.
              </Text>
            </View>

            <View style={styles.guidelineItem}>
              <View style={styles.guidelineDot} />
              <Text style={[styles.guidelineText, { color: isDark ? '#F1F5F9' : '#183330' }]}>
                Respire sem forçar e siga no seu próprio ritmo.
              </Text>
            </View>
          </View>
        </View>

        {/* 5. SEÇÃO: ETAPAS DA PRÁTICA (TIMELINE VERTICAL ELEGANTE) */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#183330' }]}>
            Etapas da prática
          </Text>

          <View style={styles.timelineContainer}>
            {getTimelineStages().map((stage, idx, arr) => {
              const isLast = idx === arr.length - 1;
              return (
                <View key={stage.stepNumber} style={styles.timelineRow}>
                  {/* Coluna Esquerda: Círculo com Número e Linha Vertical */}
                  <View style={styles.timelineLeftCol}>
                    <View
                      style={[
                        styles.timelineCircle,
                        {
                          backgroundColor: isDark ? '#1D3430' : '#E6F1EE',
                          borderColor: isDark ? '#2D4E47' : '#D2E5E0',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.timelineNumberText,
                          { color: isDark ? '#5ECFC3' : '#176F69' },
                        ]}
                      >
                        {stage.stepNumber}
                      </Text>
                    </View>
                    {!isLast && <View style={[styles.timelineVerticalLine, { backgroundColor: isDark ? '#233733' : '#E2E8E5' }]} />}
                  </View>

                  {/* Coluna Direita: Título e Instrução */}
                  <View style={styles.timelineContentCol}>
                    <Text
                      style={[
                        styles.timelineStageTitle,
                        { color: isDark ? '#F1F5F9' : '#183330' },
                      ]}
                    >
                      {stage.title}
                    </Text>
                    <Text
                      style={[
                        styles.timelineStageDescription,
                        { color: isDark ? '#A2B5B1' : '#647572' },
                      ]}
                    >
                      {stage.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* 6. SEÇÃO: O QUE VOCÊ PODE PERCEBER (LINGUAGEM RESPONSÁVEL) */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#183330' }]}>
            O que você pode perceber
          </Text>

          <View style={styles.perceptionsList}>
            {getPerceptions().map((item, idx) => (
              <View key={idx} style={styles.perceptionItem}>
                <Check size={16} color="#176F69" style={{ marginTop: 2, marginRight: 10 }} />
                <Text style={[styles.perceptionText, { color: isDark ? '#F1F5F9' : '#183330' }]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          <Text style={[styles.perceptionNote, { color: isDark ? '#A2B5B1' : '#647572' }]}>
            Cada pessoa pode perceber a prática de uma maneira diferente.
          </Text>
        </View>

        {/* 7. SEÇÃO: CUIDADOS — "RESPEITE O SEU RITMO" */}
        <View
          style={[
            styles.careWarningCard,
            {
              backgroundColor: isDark ? '#261D18' : '#FFF6F0',
              borderLeftColor: '#B76B45',
            },
          ]}
        >
          <View style={styles.careWarningHeader}>
            <ShieldAlert size={16} color="#B76B45" style={{ marginRight: 8 }} />
            <Text style={styles.careWarningTitle}>Respeite o seu ritmo</Text>
          </View>

          <Text style={[styles.careWarningBody, { color: isDark ? '#E5D0C5' : '#733722' }]}>
            Não force a respiração nem prenda o ar se isso causar desconforto. Se sentir tontura, falta de ar ou mal-estar, interrompa a prática e volte à respiração natural.
          </Text>
        </View>

        {/* 8. SEÇÃO: HISTÓRICO PESSOAL COMPACTO */}
        <View
          style={[
            styles.historyCompactRow,
            {
              backgroundColor: isDark ? '#192A27' : '#FFFFFF',
              borderColor: isDark ? '#293B37' : '#E2E8E5',
            },
          ]}
        >
          <View style={styles.historyLeft}>
            <Activity size={18} color="#176F69" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.historyMainText, { color: isDark ? '#F1F5F9' : '#183330' }]}>
                {completedCount === 0
                  ? 'Você ainda não concluiu esta prática'
                  : `Você concluiu esta prática ${completedCount} ${
                      completedCount === 1 ? 'vez' : 'vezes'
                    }`}
              </Text>
              {lastCompletedDate && (
                <Text style={[styles.historySubText, { color: isDark ? '#A2B5B1' : '#647572' }]}>
                  Última prática em {lastCompletedDate}
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/diary')}
            style={styles.historyLinkBtn}
          >
            <Text style={styles.historyLinkText}>Ver histórico</Text>
            <ChevronRight size={14} color="#176F69" />
          </TouchableOpacity>
        </View>

        {/* 9. SEÇÃO: PRÁTICAS RELACIONADAS (CARDS HORIZONTAIS COMPACTOS) */}
        {relatedPractices.length > 0 && (
          <View style={styles.relatedSection}>
            <View style={styles.relatedHeaderRow}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#183330', marginBottom: 0 }]}>
                Práticas relacionadas
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/practices')}
                style={styles.seeAllLink}
              >
                <Text style={styles.seeAllLinkText}>Ver todas</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.relatedCardsList}>
              {relatedPractices.map((rel) => {
                const relProgress = userProgress[rel.id];
                const hasRelProgress = relProgress && relProgress.progressPercent > 0 && relProgress.progressPercent < 100;

                return (
                  <TouchableOpacity
                    key={rel.id}
                    onPress={() => onSelectPractice(rel)}
                    activeOpacity={0.85}
                    style={[
                      styles.relatedCardItem,
                      {
                        backgroundColor: isDark ? '#192A27' : '#FFFFFF',
                        borderColor: isDark ? '#293B37' : '#E2E8E5',
                      },
                    ]}
                  >
                    {/* Imagem 96x96px */}
                    <Image
                      source={getPracticeImage(rel.id)}
                      style={styles.relatedCardImage}
                      resizeMode="cover"
                      accessibilityLabel={getPracticeAltText(rel.id)}
                    />

                    {/* Informações da Prática */}
                    <View style={styles.relatedCardContent}>
                      <View style={styles.relatedCardTopRow}>
                        <Text
                          numberOfLines={2}
                          style={[
                            styles.relatedCardTitle,
                            { color: isDark ? '#F1F5F9' : '#183330' },
                          ]}
                        >
                          {rel.title}
                        </Text>

                        <TouchableOpacity
                          onPress={() => onToggleFavorite(rel.id)}
                          style={styles.relatedFavBtn}
                          accessibilityLabel={rel.isFavorite ? 'Desfavoritar' : 'Favoritar'}
                        >
                          <Bookmark
                            size={16}
                            color="#176F69"
                            fill={rel.isFavorite ? '#176F69' : 'transparent'}
                          />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.relatedCardMetaRow}>
                        <Headphones size={13} color={isDark ? '#A2B5B1' : '#647572'} />
                        <Text style={[styles.relatedCardMetaText, { color: isDark ? '#A2B5B1' : '#647572' }]}>
                          {rel.durationMinutes} min • {rel.level}
                        </Text>
                      </View>

                      {/* Barra de Progresso quando aplicável */}
                      {hasRelProgress && (
                        <View style={styles.relatedProgressBarBg}>
                          <View
                            style={[
                              styles.relatedProgressBarFill,
                              { width: `${relProgress.progressPercent}%` },
                            ]}
                          />
                        </View>
                      )}

                      <View style={styles.relatedCardBottomRow}>
                        <Text style={styles.relatedActionText}>
                          {hasRelProgress ? 'Continuar' : 'Começar'}
                        </Text>
                        <ArrowRight size={13} color="#176F69" />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* 11. BARRA INFERIOR FIXA NA ROLAGEM (STICKY BOTTOM BAR) */}
      {showStickyBottomBar && !isPlayerActive && (
        <View
          style={[
            styles.stickyBottomBar,
            {
              backgroundColor: isDark ? '#192A27' : '#FFFFFF',
              borderTopColor: isDark ? '#293B37' : '#E2E8E5',
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleStartOrContinue}
            activeOpacity={0.88}
            style={styles.stickyActionButton}
          >
            <Play size={16} color="#FFFFFF" fill="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.stickyActionButtonText}>{primaryButtonLabel}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de Seleção de Outras Atividades */}
      <PracticeSelectorModal
        visible={isSelectorOpen}
        practices={allPractices}
        currentPracticeId={practice.id}
        isActivityInProgress={isPlayerActive}
        onSelectPractice={(p) => {
          setIsSelectorOpen(false);
          setIsPlayerActive(false);
          onSelectPractice(p);
        }}
        onClose={() => setIsSelectorOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    width: '100%',
  },
  headerBar: {
    width: '100%',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 90,
  },
  heroSection: {
    width: '100%',
    marginBottom: 32,
  },
  heroImageWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E6F1EE',
    marginBottom: 16,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroDescription: {
    fontSize: 16,
    lineHeight: 25,
    fontWeight: '400',
    marginBottom: 20,
  },
  primaryActionButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#176F69',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#176F69',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '650' as any,
  },
  playerContainer: {
    width: '100%',
    marginBottom: 24,
  },
  minimizePlayerBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  minimizePlayerText: {
    color: '#176F69',
    fontSize: 13,
    fontWeight: '600',
  },
  postPracticeCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 28,
  },
  postPracticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  postPracticeTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  feelingOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  feelingOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  feelingOptionBtnActive: {
    borderWidth: 1.5,
    borderColor: '#176F69',
  },
  feelingOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  postPracticeActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  postNextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#176F69',
    paddingVertical: 10,
    borderRadius: 12,
  },
  postNextBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  postRepeatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  postRepeatBtnText: {
    color: '#176F69',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionBlock: {
    width: '100%',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '650' as any,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  guidelinesList: {
    gap: 10,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guidelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#176F69',
    marginRight: 10,
  },
  guidelineText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    flex: 1,
  },
  timelineContainer: {
    width: '100%',
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineLeftCol: {
    alignItems: 'center',
    marginRight: 14,
  },
  timelineCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timelineVerticalLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  timelineContentCol: {
    flex: 1,
    paddingBottom: 22,
  },
  timelineStageTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  timelineStageDescription: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  },
  perceptionsList: {
    gap: 10,
    marginBottom: 10,
  },
  perceptionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  perceptionText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    flex: 1,
  },
  perceptionNote: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    marginTop: 4,
  },
  careWarningCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    marginBottom: 32,
  },
  careWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  careWarningTitle: {
    color: '#B76B45',
    fontSize: 15,
    fontWeight: '650' as any,
  },
  careWarningBody: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  },
  historyCompactRow: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  historyLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  historyMainText: {
    fontSize: 14,
    fontWeight: '600',
  },
  historySubText: {
    fontSize: 12,
    marginTop: 2,
  },
  historyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  historyLinkText: {
    color: '#176F69',
    fontSize: 13,
    fontWeight: '600',
  },
  relatedSection: {
    width: '100%',
  },
  relatedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  seeAllLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllLinkText: {
    color: '#176F69',
    fontSize: 13,
    fontWeight: '600',
  },
  relatedCardsList: {
    gap: 12,
  },
  relatedCardItem: {
    width: '100%',
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 10,
    gap: 12,
  },
  relatedCardImage: {
    width: 96,
    height: 96,
    borderRadius: 12,
  },
  relatedCardContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  relatedCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  relatedCardTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    flex: 1,
    marginRight: 6,
  },
  relatedFavBtn: {
    padding: 4,
  },
  relatedCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  relatedCardMetaText: {
    fontSize: 12,
    fontWeight: '400',
  },
  relatedProgressBarBg: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(23, 111, 105, 0.12)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  relatedProgressBarFill: {
    height: '100%',
    backgroundColor: '#176F69',
    borderRadius: 2,
  },
  relatedCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  relatedActionText: {
    color: '#176F69',
    fontSize: 13,
    fontWeight: '600',
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    zIndex: 100,
  },
  stickyActionButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#176F69',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '650' as any,
  },
});
