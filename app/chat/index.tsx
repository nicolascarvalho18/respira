import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Linking,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Send,
  Trash2,
  MessageCircle,
  ShieldAlert,
  ArrowLeft,
  Wind,
  Check,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Square,
  ShieldCheck,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Play,
  Headphones,
  BookOpen,
  Phone,
  ArrowRight,
} from 'lucide-react-native';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useToast } from '../../src/components/ui/Toast';
import { useChatStore } from '../../src/store/chatStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { formatTime } from '../../src/utils/date';
import { chatService } from '../../src/services/chat/chatService';

export default function ChatScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();
  const {
    messages,
    isTyping,
    isStreaming,
    fetchMessages,
    sendMessage,
    regenerateResponse,
    stopGeneration,
    clearHistory,
  } = useChatStore();
  const { showToast } = useToast();

  const [inputText, setInputText] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'helpful' | 'unhelpful'>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isTemporary, setIsTemporary] = useState(false);
  const [isBannerCollapsed, setIsBannerCollapsed] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Assistente Inteligente — Respira';
    }
    fetchMessages();
    chatService.isTemporaryMode().then(setIsTemporary);
  }, []);

  // Rolagem automática inteligente (somente quando o usuário estiver próximo do final)
  useEffect(() => {
    if (isNearBottom) {
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isTyping, isStreaming, isNearBottom]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 120;
    const isClose = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    setIsNearBottom(isClose);
  };

  const handleSend = async (textToSend?: string) => {
    const message = textToSend || inputText;
    if (!message.trim() || isTyping || isStreaming) return;

    setInputText('');
    await sendMessage(message);
  };

  const handleKeyDown = (e: any) => {
    if (Platform.OS === 'web' && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text: string, msgId: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(msgId);
    showToast({ message: 'Mensagem copiada.', type: 'info' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = async (msgId: string, rating: 'helpful' | 'unhelpful') => {
    setFeedbackGiven((prev) => ({ ...prev, [msgId]: rating }));
    await chatService.recordFeedback(msgId, rating);
    showToast({
      message:
        rating === 'helpful'
          ? 'Obrigado pelo retorno positivo!'
          : 'Agradecemos o feedback para aprimorar as respostas.',
      type: 'info',
    });
  };

  const handleToggleTemporary = async () => {
    const next = !isTemporary;
    setIsTemporary(next);
    await chatService.setTemporaryMode(next);
    showToast({
      message: next
        ? 'Modo temporário ativado (conversa não será persistida).'
        : 'Modo normal ativado.',
      type: 'info',
    });
  };

  const handleAction = (actionType?: string, actionPayload?: string) => {
    if (!actionType && !actionPayload) return;

    if (actionType === 'call_helpline') {
      Linking.openURL(`tel:${actionPayload || '188'}`).catch(() => router.push('/support'));
      return;
    }
    if (actionType === 'open_practice') {
      if (actionPayload?.includes('breathing')) {
        router.push('/practices/breathing');
      } else {
        router.push(`/practices/player/${actionPayload}` as any);
      }
      return;
    }
    if (actionType === 'open_article') {
      router.push(`/content/${actionPayload}` as any);
      return;
    }
    if (actionType === 'open_mood') {
      router.push('/momentos' as any);
      return;
    }
    if (actionType === 'open_soundscape') {
      router.push('/soundscape' as any);
      return;
    }
    if (actionType === 'open_profile') {
      router.push('/(tabs)/profile' as any);
      return;
    }
  };

  // Sugestões inteligentes dinâmicas por horário
  const getDynamicSuggestions = (): string[] => {
    const hour = new Date().getHours();
    if (hour >= 20 || hour < 5) {
      return [
        'Estou com dificuldade para dormir',
        'Ouvir um som tranquilo de chuva',
        'Respiração 4-7-8 para relaxar',
        'Como desacelerar os pensamentos?',
      ];
    }
    if (hour >= 5 && hour < 12) {
      return [
        'Quero uma prática para começar o dia',
        'Respiração para foco e clareza',
        'Registrar como estou no diário',
        'Como funciona o Respira?',
      ];
    }
    return [
      'Quero uma pausa de 3 minutos',
      'Estou me sentindo ansioso(a)',
      'Como diminuir a sobrecarga mental?',
      'Quero contar como foi meu dia',
    ];
  };

  const dynamicSuggestions = getDynamicSuggestions();

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? colors.background : '#F7F8F5' },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.keyboardContainer}
      >
        <View
          style={[
            styles.chatWrapper,
            isDesktop && styles.chatWrapperDesktop,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E0E5E2',
            },
          ]}
        >
          {/* 1. Cabeçalho do Chat */}
          <View
            style={[
              styles.header,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderBottomColor: isDark ? colors.border : '#EBF1EF',
              },
            ]}
          >
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
                style={[
                  styles.backBtn,
                  { backgroundColor: isDark ? colors.surfaceSecondary : '#EDF7F5' },
                ]}
              >
                <ArrowLeft size={18} color={isDark ? colors.text : colors.primary} />
              </TouchableOpacity>

              <View style={[styles.avatarBot, { backgroundColor: colors.primary }]}>
                <MessageCircle size={18} color="#FFFFFF" aria-hidden={true} />
              </View>

              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text
                    accessibilityRole="header"
                    aria-level={1}
                    style={[styles.headerTitle, { color: isDark ? colors.text : '#173D3B' }]}
                  >
                    Assistente Respira
                  </Text>
                  <View style={styles.onlineDot} />
                </View>
                <Text style={[styles.headerStatus, { color: isDark ? colors.textMuted : '#667775' }]}>
                  {isTemporary ? 'Modo Temporário Ativo' : 'Acolhimento e Psicoeducação'}
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={handleToggleTemporary}
                accessibilityRole="button"
                accessibilityLabel="Alternar conversa temporária"
                style={[
                  styles.actionHeaderBtn,
                  {
                    backgroundColor: isTemporary
                      ? colors.primary
                      : isDark
                      ? colors.surfaceSecondary
                      : '#F2F6F5',
                  },
                ]}
              >
                <EyeOff
                  size={16}
                  color={isTemporary ? '#FFFFFF' : isDark ? colors.textMuted : '#667775'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowClearModal(true)}
                accessibilityRole="button"
                accessibilityLabel="Limpar conversa"
                style={[
                  styles.actionHeaderBtn,
                  { backgroundColor: isDark ? colors.surfaceSecondary : '#F2F6F5' },
                ]}
              >
                <Trash2 size={16} color={isDark ? colors.textMuted : '#667775'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. Área de Mensagens */}
          <ScrollView
            ref={scrollViewRef}
            onScroll={handleScroll}
            scrollEventThrottle={100}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesContainer}
            style={styles.messagesScrollView}
          >
            {/* Banner Educativo Compacto e Recolhível */}
            <TouchableOpacity
              onPress={() => setIsBannerCollapsed(!isBannerCollapsed)}
              activeOpacity={0.85}
              style={[
                styles.safetyBanner,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : '#EDF7F5',
                  borderColor: isDark ? colors.border : '#CBE8E2',
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <ShieldCheck size={14} color={colors.primary} style={{ marginRight: 6 }} />
                <Text
                  numberOfLines={isBannerCollapsed ? 1 : undefined}
                  style={[styles.safetyText, { color: isDark ? colors.textMuted : '#476965' }]}
                >
                  {isBannerCollapsed
                    ? 'Aviso educativo sobre o assistente (toque para ler)'
                    : 'Acolhimento e psicoeducação. Não substitui consulta médica ou psicológica.'}
                </Text>
              </View>
              {isBannerCollapsed ? (
                <ChevronDown size={14} color={colors.primary} />
              ) : (
                <ChevronUp size={14} color={colors.primary} />
              )}
            </TouchableOpacity>

            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const feedback = feedbackGiven[msg.id] || msg.feedback;
              const isCopied = copiedId === msg.id;

              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    isUser ? styles.userMessageRow : styles.botMessageRow,
                  ]}
                >
                  {!isUser && (
                    <View
                      style={[
                        styles.msgAvatar,
                        {
                          backgroundColor: msg.isEmergencyAlert
                            ? colors.error
                            : isDark
                            ? '#243A36'
                            : colors.primary,
                        },
                      ]}
                    >
                      {msg.isEmergencyAlert ? (
                        <ShieldAlert size={14} color="#FFFFFF" />
                      ) : (
                        <MessageCircle
                          size={14}
                          color={isDark ? '#5ECFC3' : '#FFFFFF'}
                          aria-hidden={true}
                        />
                      )}
                    </View>
                  )}

                  <View style={styles.bubbleCol}>
                    {/* Alerta de Emergência */}
                    {msg.isEmergencyAlert && (
                      <View
                        style={[
                          styles.alertBadge,
                          {
                            backgroundColor: isDark ? '#3D1C1B' : '#FDF2F2',
                            borderColor: isDark ? '#7F1D1D' : '#FCA5A5',
                          },
                        ]}
                      >
                        <ShieldAlert size={14} color="#DC2626" style={{ marginRight: 6 }} />
                        <Text style={[styles.alertBadgeText, { color: '#DC2626' }]}>
                          Apoio gratuito 24h: Ligue 188 (CVV) ou 192 (SAMU)
                        </Text>
                      </View>
                    )}

                    {/* Balão da Mensagem */}
                    <View
                      style={[
                        styles.bubble,
                        isUser
                          ? [styles.userBubble, { backgroundColor: colors.primary }]
                          : [
                              styles.botBubble,
                              {
                                backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                                borderColor: isDark ? colors.border : '#E0E5E2',
                              },
                            ],
                      ]}
                    >
                      <Text
                        style={[
                          styles.bubbleText,
                          { color: isUser ? '#FFFFFF' : isDark ? colors.text : '#173D3B' },
                        ]}
                      >
                        {msg.text}
                      </Text>

                      <Text
                        style={[
                          styles.timestampText,
                          {
                            color: isUser
                              ? 'rgba(255,255,255,0.75)'
                              : isDark
                              ? colors.textMuted
                              : '#8C9E9B',
                          },
                        ]}
                      >
                        {formatTime(msg.timestamp)}
                      </Text>
                    </View>

                    {/* Botão de Ação RAG Interativa */}
                    {(msg.actionText || msg.recommendedPracticeId || msg.isEmergencyAlert) && (
                      <TouchableOpacity
                        onPress={() =>
                          handleAction(
                            msg.actionType || (msg.isEmergencyAlert ? 'call_helpline' : 'open_practice'),
                            msg.actionPayload || msg.recommendedPracticeId || '188'
                          )
                        }
                        activeOpacity={0.85}
                        style={[
                          styles.actionBtn,
                          {
                            backgroundColor: msg.isEmergencyAlert
                              ? isDark
                                ? '#7F1D1D'
                                : '#DC2626'
                              : isDark
                              ? '#243A36'
                              : '#EDF7F5',
                            borderColor: msg.isEmergencyAlert ? '#EF4444' : colors.primary,
                          },
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          {msg.isEmergencyAlert || msg.actionType === 'call_helpline' ? (
                            <Phone size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                          ) : msg.actionType === 'open_soundscape' ? (
                            <Headphones
                              size={14}
                              color={isDark ? '#5ECFC3' : colors.primary}
                              style={{ marginRight: 6 }}
                            />
                          ) : msg.actionType === 'open_article' ? (
                            <BookOpen
                              size={14}
                              color={isDark ? '#5ECFC3' : colors.primary}
                              style={{ marginRight: 6 }}
                            />
                          ) : (
                            <Play
                              size={14}
                              color={isDark ? '#5ECFC3' : colors.primary}
                              style={{ marginRight: 6 }}
                            />
                          )}

                          <Text
                            style={[
                              styles.actionBtnText,
                              {
                                color: msg.isEmergencyAlert
                                  ? '#FFFFFF'
                                  : isDark
                                  ? '#5ECFC3'
                                  : colors.primary,
                              },
                            ]}
                          >
                            {msg.actionText ||
                              (msg.isEmergencyAlert
                                ? 'Ligar para CVV (188)'
                                : 'Iniciar Exercício')}
                          </Text>
                        </View>
                        <ArrowRight
                          size={14}
                          color={msg.isEmergencyAlert ? '#FFFFFF' : isDark ? '#5ECFC3' : colors.primary}
                        />
                      </TouchableOpacity>
                    )}

                    {/* Barra de Ações (Copiar, Avaliar) */}
                    {!isUser && (
                      <View style={styles.msgActionsRow}>
                        <TouchableOpacity
                          onPress={() => handleCopy(msg.text, msg.id)}
                          accessibilityRole="button"
                          accessibilityLabel="Copiar mensagem"
                          style={styles.msgActionIconBtn}
                        >
                          {isCopied ? (
                            <Check size={13} color={colors.primary} />
                          ) : (
                            <Copy size={13} color={isDark ? colors.textMuted : '#8C9E9B'} />
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleFeedback(msg.id, 'helpful')}
                          accessibilityRole="button"
                          accessibilityLabel="Mensagem útil"
                          style={styles.msgActionIconBtn}
                        >
                          <ThumbsUp
                            size={13}
                            color={feedback === 'helpful' ? colors.primary : isDark ? colors.textMuted : '#8C9E9B'}
                            fill={feedback === 'helpful' ? colors.primary : 'none'}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleFeedback(msg.id, 'unhelpful')}
                          accessibilityRole="button"
                          accessibilityLabel="Mensagem não útil"
                          style={styles.msgActionIconBtn}
                        >
                          <ThumbsDown
                            size={13}
                            color={feedback === 'unhelpful' ? colors.error : isDark ? colors.textMuted : '#8C9E9B'}
                            fill={feedback === 'unhelpful' ? colors.error : 'none'}
                          />
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Sugestões da Mensagem */}
                    {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                      <View style={styles.suggestionsList}>
                        {msg.suggestions.slice(0, 3).map((sug, sIdx) => (
                          <TouchableOpacity
                            key={sIdx}
                            onPress={() => !isTyping && !isStreaming && handleSend(sug)}
                            disabled={isTyping || isStreaming}
                            accessibilityRole="button"
                            accessibilityLabel={`Enviar sugestão: ${sug}`}
                            style={[
                              styles.suggestionChip,
                              {
                                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                                borderColor: isDark ? colors.border : '#E0E5E2',
                                opacity: isTyping || isStreaming ? 0.6 : 1,
                              },
                            ]}
                          >
                            <MessageCircle
                              size={12}
                              color={isDark ? '#5ECFC3' : colors.primary}
                              style={{ marginRight: 5 }}
                            />
                            <Text
                              style={[
                                styles.suggestionText,
                                { color: isDark ? '#5ECFC3' : colors.primary },
                              ]}
                            >
                              {sug}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Indicador de Digitação / Streaming */}
            {(isTyping || isStreaming) && (
              <View style={[styles.messageRow, styles.botMessageRow]}>
                <View
                  style={[
                    styles.msgAvatar,
                    { backgroundColor: isDark ? '#243A36' : colors.primary },
                  ]}
                >
                  <MessageCircle size={14} color="#FFFFFF" aria-hidden={true} />
                </View>
                <View
                  style={[
                    styles.bubble,
                    styles.botBubble,
                    {
                      backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFA',
                      borderColor: isDark ? colors.border : '#EBF1EF',
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={{ fontSize: 13, color: isDark ? colors.textMuted : '#667775' }}>
                      Assistente digitando...
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Sugestões Dinâmicas no Início de Conversa */}
            {messages.length <= 2 && !isTyping && !isStreaming && (
              <View style={styles.startSuggestionsSection}>
                <Text style={[styles.startSuggestionsTitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  Sugestões para agora:
                </Text>
                <View style={styles.startSuggestionsGrid}>
                  {dynamicSuggestions.map((sug, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleSend(sug)}
                      style={[
                        styles.startSuggestionCard,
                        {
                          backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                          borderColor: isDark ? colors.border : '#E0E5E2',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.startSuggestionCardText,
                          { color: isDark ? colors.text : '#173D3B' },
                        ]}
                      >
                        {sug}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* 3. Barra Inferior de Digitação, Parar e Regenerar */}
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderTopColor: isDark ? colors.border : '#EBF1EF',
              },
            ]}
          >
            {/* Botão de Regenerar Resposta */}
            {messages.length > 1 && !isTyping && !isStreaming && (
              <TouchableOpacity
                onPress={() => regenerateResponse()}
                accessibilityRole="button"
                accessibilityLabel="Tentar novamente"
                style={[
                  styles.sideInputBtn,
                  { backgroundColor: isDark ? colors.surfaceSecondary : '#EDF7F5' },
                ]}
              >
                <RotateCcw size={16} color={isDark ? '#5ECFC3' : colors.primary} />
              </TouchableOpacity>
            )}

            {/* Campo de Entrada de Mensagem */}
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Digite sua mensagem..."
              placeholderTextColor={isDark ? colors.placeholder : '#8C9E9B'}
              onKeyPress={handleKeyDown}
              multiline
              maxLength={1000}
              accessibilityLabel="Campo de mensagem para o assistente"
              style={[
                styles.inputField,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : '#F7F9F8',
                  borderColor: isDark ? colors.border : '#DCE5E2',
                  color: isDark ? colors.text : '#173D3B',
                },
              ]}
            />

            {/* Botão de Parar Geração ou Enviar */}
            {isTyping || isStreaming ? (
              <TouchableOpacity
                onPress={() => stopGeneration()}
                accessibilityRole="button"
                accessibilityLabel="Parar resposta"
                style={[styles.sendBtn, { backgroundColor: colors.error }]}
              >
                <Square size={16} color="#FFFFFF" fill="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => handleSend()}
                disabled={!inputText.trim()}
                accessibilityRole="button"
                accessibilityLabel="Enviar mensagem"
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor:
                      inputText.trim() ? colors.primary : isDark ? colors.surfaceSecondary : '#EBF1EF',
                  },
                ]}
              >
                <Send
                  size={17}
                  color={inputText.trim() ? '#FFFFFF' : isDark ? colors.textMuted : '#8C9E9B'}
                  aria-hidden={true}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal de Confirmação para Limpar Histórico */}
      <ConfirmDialog
        visible={showClearModal}
        title="Limpar histórico?"
        message="Deseja apagar as mensagens desta conversa?"
        confirmTitle="Limpar"
        cancelTitle="Cancelar"
        onConfirm={async () => {
          setShowClearModal(false);
          await clearHistory();
          showToast({ message: 'Histórico apagado.', type: 'info' });
        }}
        onCancel={() => setShowClearModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  chatWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  chatWrapperDesktop: {
    maxWidth: 860,
    alignSelf: 'center',
    borderRadius: 20,
    marginVertical: 12,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  headerStatus: {
    fontSize: 11,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesScrollView: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    gap: 12,
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  safetyText: {
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  botMessageRow: {
    justifyContent: 'flex-start',
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bubbleCol: {
    maxWidth: '82%',
    gap: 4,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  userBubble: {
    borderTopRightRadius: 4,
    borderColor: 'transparent',
  },
  botBubble: {
    borderTopLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
  },
  timestampText: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 4,
  },
  alertBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  msgActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  msgActionIconBtn: {
    padding: 3,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  startSuggestionsSection: {
    marginTop: 16,
    gap: 8,
  },
  startSuggestionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  startSuggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  startSuggestionCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  startSuggestionCardText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  sideInputBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  inputField: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
});
