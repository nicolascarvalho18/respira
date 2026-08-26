import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Play,
  Bookmark,
  Sparkles,
  CheckCircle2,
  ListFilter,
  ArrowRight,
  ShieldAlert,
  Smile,
  Meh,
  Frown,
  Download,
  Check,
  RotateCcw,
  Clock,
  Heart,
  HelpCircle,
  Activity,
  Layers,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../ui/Toast';
import { AppButton } from '../ui/AppButton';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { GuidedVideoAudioPlayer } from './GuidedVideoAudioPlayer';
import { PracticeCard } from './PracticeCard';
import { PracticeSelectorModal } from './PracticeSelectorModal';
import { usePracticeStore } from '../../store/practiceStore';
import { useAuth } from '../../hooks/useAuth';
import { Practice, UserPracticeProgress } from '../../types';

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
    toggleOfflineDownload,
    downloadedIds,
  } = usePracticeStore();

  const currentProgress = userProgress[practice.id];
  const isDownloaded = downloadedIds.includes(practice.id);

  const [isPlayerActive, setIsPlayerActive] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedFeeling, setSelectedFeeling] = useState<'calmer' | 'same' | 'uncomfortable' | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Related practices lookup
  const relatedPractices = (practice.relatedPracticeIds || [])
    .map((id) => allPractices.find((p) => p.id === id))
    .filter((p): p is Practice => p !== undefined);

  const handleStartOrContinue = () => {
    setIsPlayerActive(true);
  };

  const handleProgressUpdate = async (posSec: number, totalSec: number) => {
    await saveProgress(userId, practice.id, posSec, totalSec, false);
  };

  const handlePlayerComplete = async () => {
    await saveProgress(userId, practice.id, practice.durationMinutes * 60, practice.durationMinutes * 60, true);
    setShowCompletionModal(true);
  };

  const handleSelectFeeling = async (feeling: 'calmer' | 'same' | 'uncomfortable') => {
    setSelectedFeeling(feeling);
    await recordPostFeeling(userId, practice.id, feeling);
    showToast({
      message: 'Sensação registrada no seu histórico com sucesso.',
      type: 'info',
    });
  };

  const handleDownloadToggle = async () => {
    const isNowDownloaded = await toggleOfflineDownload(practice.id);
    showToast({
      message: isNowDownloaded
        ? 'Prática disponibilizada para acesso offline.'
        : 'Download offline removido.',
      type: 'info',
    });
  };

  const getObjectiveLabel = () => {
    switch (practice.objective) {
      case 'relax':
        return 'Relaxar';
      case 'sleep_better':
        return 'Dormir melhor';
      case 'regain_focus':
        return 'Recuperar o foco';
      case 'relieve_tension':
        return 'Aliviar a tensão';
      case 'take_a_pause':
        return 'Fazer uma pausa';
      default:
        return 'Bem-estar e calma';
    }
  };

  const initialPosition = currentProgress ? currentProgress.playbackPositionSeconds : 0;
  const hasExistingProgress = currentProgress && currentProgress.progressPercent > 0 && currentProgress.progressPercent < 100;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Barra Superior com Voltar, Favoritar e Download Offline */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Voltar às práticas"
          style={[styles.backBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF' }]}
        >
          <ArrowLeft size={18} color={isDark ? colors.text : '#173D3B'} />
          <Text style={[styles.backBtnText, { color: isDark ? colors.text : '#173D3B' }]}>
            Práticas
          </Text>
        </TouchableOpacity>

        <View style={styles.topRightActions}>
          <TouchableOpacity
            onPress={handleDownloadToggle}
            accessibilityRole="button"
            accessibilityLabel={isDownloaded ? 'Remover download offline' : 'Baixar para acesso offline'}
            style={[
              styles.iconActionBtn,
              isDownloaded && { backgroundColor: '#E7F3EF', borderColor: '#2F7F7C' },
              { backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
            ]}
          >
            {isDownloaded ? (
              <Check size={16} color="#2F7F7C" />
            ) : (
              <Download size={16} color={isDark ? colors.textMuted : '#667775'} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onToggleFavorite(practice.id)}
            accessibilityRole="button"
            accessibilityLabel={practice.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            style={[
              styles.iconActionBtn,
              { backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
            ]}
          >
            <Bookmark
              size={16}
              color="#2F7F7C"
              fill={practice.isFavorite ? '#2F7F7C' : 'transparent'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsSelectorOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Alternar atividade"
            style={[
              styles.iconActionBtn,
              { backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
            ]}
          >
            <ListFilter size={16} color={isDark ? colors.textMuted : '#667775'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Reprodutor de Vídeo / Áudio / Interativo */}
      <View style={styles.playerWrapper}>
        <GuidedVideoAudioPlayer
          practice={practice}
          initialPositionSeconds={initialPosition}
          onProgressUpdate={handleProgressUpdate}
          onComplete={handlePlayerComplete}
        />
      </View>

      {/* 3. Título e Metadados da Prática */}
      <View style={styles.headerInfo}>
        <View style={styles.badgeRow}>
          <Badge label={practice.level} variant="success" size="sm" />
          <Badge label={getObjectiveLabel()} variant="info" size="sm" />
          <Text style={[styles.durationMeta, { color: isDark ? colors.textMuted : '#667775' }]}>
            {practice.durationMinutes} minutos
          </Text>
        </View>

        <Text style={[styles.title, { color: isDark ? colors.text : '#173D3B' }]}>
          {practice.title}
        </Text>

        <Text style={[styles.description, { color: isDark ? colors.textMuted : '#567571' }]}>
          {practice.description}
        </Text>
      </View>

      {/* 4. Confirmação Pós-Prática Discreta */}
      {showCompletionModal && (
        <Card
          variant="bordered"
          style={[
            styles.completionCard,
            { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: '#2F7F7C' },
          ]}
        >
          <View style={styles.completionHeaderRow}>
            <CheckCircle2 size={22} color="#2F7F7C" />
            <Text style={[styles.completionTitle, { color: isDark ? colors.text : '#173D3B' }]}>
              Prática concluída. Como você está se sentindo agora?
            </Text>
          </View>

          <Text style={[styles.completionSub, { color: isDark ? colors.textMuted : '#667775' }]}>
            Reconhecer seu estado auxilia no acompanhamento pessoal do seu bem-estar:
          </Text>

          <View style={styles.feelingsOptionRow}>
            <TouchableOpacity
              onPress={() => handleSelectFeeling('calmer')}
              style={[
                styles.feelingBtn,
                selectedFeeling === 'calmer' && styles.feelingBtnSelected,
                { backgroundColor: isDark ? colors.surfaceSecondary : '#F7F9F8' },
              ]}
            >
              <Smile size={18} color="#2F7F7C" />
              <Text style={[styles.feelingBtnText, { color: isDark ? colors.text : '#173D3B' }]}>
                Mais tranquilo(a)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSelectFeeling('same')}
              style={[
                styles.feelingBtn,
                selectedFeeling === 'same' && styles.feelingBtnSelected,
                { backgroundColor: isDark ? colors.surfaceSecondary : '#F7F9F8' },
              ]}
            >
              <Meh size={18} color="#D98968" />
              <Text style={[styles.feelingBtnText, { color: isDark ? colors.text : '#173D3B' }]}>
                Igual
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSelectFeeling('uncomfortable')}
              style={[
                styles.feelingBtn,
                selectedFeeling === 'uncomfortable' && styles.feelingBtnSelected,
                { backgroundColor: isDark ? colors.surfaceSecondary : '#F7F9F8' },
              ]}
            >
              <Frown size={18} color="#D9534F" />
              <Text style={[styles.feelingBtnText, { color: isDark ? colors.text : '#173D3B' }]}>
                Ainda desconfortável
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 12, width: '100%', gap: 8 }}>
            <AppButton
              title="Registrar no Diário de Humor"
              leftIcon={<Smile size={16} color="#FFFFFF" />}
              onPress={() => router.push('/mood/new')}
              size="sm"
            />
          </View>
        </Card>
      )}

      {/* 5. Orientações Antes de Começar */}
      {practice.guidelinesBeforeStarting && practice.guidelinesBeforeStarting.length > 0 && (
        <Card
          variant="bordered"
          style={[
            styles.sectionCard,
            { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Clock size={16} color="#2F7F7C" />
            <Text style={[styles.sectionHeading, { color: isDark ? colors.text : '#173D3B' }]}>
              Orientações antes de começar
            </Text>
          </View>

          <View style={{ gap: 8, marginTop: 8 }}>
            {practice.guidelinesBeforeStarting.map((guide, idx) => (
              <View key={idx} style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={[styles.bulletText, { color: isDark ? colors.text : '#3A504E' }]}>
                  {guide}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* 6. Etapas da Atividade */}
      {practice.stages && practice.stages.length > 0 && (
        <Card
          variant="bordered"
          style={[
            styles.sectionCard,
            { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Layers size={16} color="#2F7F7C" />
            <Text style={[styles.sectionHeading, { color: isDark ? colors.text : '#173D3B' }]}>
              Etapas da atividade
            </Text>
          </View>

          <View style={{ gap: 10, marginTop: 10 }}>
            {practice.stages.map((st) => (
              <View
                key={st.step}
                style={[
                  styles.stageCard,
                  { backgroundColor: isDark ? colors.surfaceSecondary : '#F7F9F8' },
                ]}
              >
                <View style={styles.stageNumberCircle}>
                  <Text style={styles.stageNumberText}>{st.step}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stageTitle, { color: isDark ? colors.text : '#173D3B' }]}>
                    {st.title}
                  </Text>
                  <Text style={[styles.stageInstruction, { color: isDark ? colors.textMuted : '#567571' }]}>
                    {st.instruction}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* 7. Benefícios (sem promessas médicas) */}
      {practice.benefits && practice.benefits.length > 0 && (
        <Card
          variant="bordered"
          style={[
            styles.sectionCard,
            { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Heart size={16} color="#2F7F7C" />
            <Text style={[styles.sectionHeading, { color: isDark ? colors.text : '#173D3B' }]}>
              Benefícios para o seu bem-estar
            </Text>
          </View>

          <View style={{ gap: 6, marginTop: 8 }}>
            {practice.benefits.map((b, idx) => (
              <View key={idx} style={styles.benefitRow}>
                <Check size={14} color="#2F7F7C" style={{ marginTop: 2 }} />
                <Text style={[styles.benefitText, { color: isDark ? colors.text : '#3A504E' }]}>
                  {b}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* 8. Cuidados e Limitações Físicas */}
      {practice.careAndLimitations && practice.careAndLimitations.length > 0 && (
        <View
          style={[
            styles.careAlertCard,
            {
              backgroundColor: isDark ? '#2D201A' : '#FFF5F0',
              borderColor: isDark ? '#5C382A' : '#F7D0C0',
            },
          ]}
        >
          <ShieldAlert size={18} color="#D98968" style={{ marginTop: 1, marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.careTitle, { color: '#D98968' }]}>
              Cuidados e Limitações
            </Text>
            {practice.careAndLimitations.map((care, idx) => (
              <Text key={idx} style={[styles.careText, { color: isDark ? '#E5D0C5' : '#733722' }]}>
                • {care}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* 9. Histórico Pessoal de Conclusões */}
      <Card
        variant="bordered"
        style={[
          styles.sectionCard,
          { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
        ]}
      >
        <View style={styles.historyRow}>
          <Activity size={16} color="#2F7F7C" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.historyLabel, { color: isDark ? colors.text : '#173D3B' }]}>
              Histórico pessoal nesta prática
            </Text>
            <Text style={[styles.historyMeta, { color: isDark ? colors.textMuted : '#667775' }]}>
              Concluída {currentProgress?.completedCount || practice.completedCount || 0} vezes • Última vez: {currentProgress?.lastCompletedAt ? new Date(currentProgress.lastCompletedAt).toLocaleDateString('pt-BR') : 'Ainda não realizada'}
            </Text>
          </View>
        </View>
      </Card>

      {/* 10. Práticas Relacionadas */}
      {relatedPractices.length > 0 && (
        <View style={styles.relatedSection}>
          <Text style={[styles.relatedHeading, { color: isDark ? colors.text : '#173D3B' }]}>
            Práticas relacionadas
          </Text>

          <View style={{ gap: 10 }}>
            {relatedPractices.map((rel) => (
              <PracticeCard
                key={rel.id}
                practice={rel}
                progress={userProgress[rel.id]}
                onPress={() => onSelectPractice(rel)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </View>
        </View>
      )}

      {/* Modal de Seleção Dinâmica */}
      <PracticeSelectorModal
        visible={isSelectorOpen}
        practices={allPractices}
        currentPracticeId={practice.id}
        isActivityInProgress={isPlayerActive}
        onClose={() => setIsSelectorOpen(false)}
        onSelectPractice={(p) => {
          setIsSelectorOpen(false);
          onSelectPractice(p);
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerWrapper: {
    marginBottom: 16,
  },
  headerInfo: {
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  durationMeta: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  completionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  completionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  completionTitle: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  completionSub: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  feelingsOptionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  feelingBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  feelingBtnSelected: {
    borderColor: '#2F7F7C',
    backgroundColor: '#E7F3EF',
  },
  feelingBtnText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#2F7F7C',
    marginTop: 7,
  },
  bulletText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  stageCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 10,
  },
  stageNumberCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2F7F7C',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stageNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stageTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  stageInstruction: {
    fontSize: 12,
    lineHeight: 17,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  benefitText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  careAlertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  careTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  careText: {
    fontSize: 12,
    lineHeight: 17,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  historyMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  relatedSection: {
    marginTop: 10,
  },
  relatedHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
});
