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
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Send,
  HeartHandshake,
  Trash2,
  Bot,
  MessageCircle,
  ShieldAlert,
  ArrowLeft,
  Bookmark,
  Wind,
  Check,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Square,
  ShieldCheck,
  EyeOff,
  Sparkles,
} from 'lucide-react-native';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useToast } from '../../src/components/ui/Toast';
import { useChatStore } from '../../src/store/chatStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { QUICK_SUGGESTIONS } from '../../src/mocks/chat.mock';
import { formatTime } from '../../src/utils/date';
import { chatService } from '../../src/services/chat/chatService';

export default function ChatScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();
  const { messages, isTyping, sendMessage, clearHistory } = useChatStore();
  const { showToast } = useToast();

  const [inputText, setInputText] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isTemporary, setIsTemporary] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Assistente IA — Respira';
    }
    chatService.isTemporaryMode().then(setIsTemporary);
  }, []);

  // Leva o usuário automaticamente para a mensagem mais recente ao abrir ou ao receber mensagens
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages.length, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const message = textToSend || inputText;
    if (!message.trim() || isTyping) return;

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
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(msgId);
    showToast({ message: 'Mensagem copiada.', type: 'info' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = async (msgId: string, type: 'up' | 'down') => {
    setFeedbackGiven((prev) => ({ ...prev, [msgId]: type }));
    await chatService.recordFeedback(msgId, type === 'up' ? 'helpful' : 'unhelpful');
    showToast({
      message:
        type === 'up'
          ? 'Obrigado pela avaliação positiva!'
          : 'Agradecemos o retorno para aperfeiçoar as respostas.',
      type: 'info',
    });
  };

  const handleToggleTemporary = async () => {
    const next = !isTemporary;
    setIsTemporary(next);
    await chatService.setTemporaryMode(next);
    showToast({
      message: next
        ? 'Modo temporário ativado (esta conversa não será salva).'
        : 'Modo normal ativado.',
      type: 'info',
    });
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? colors.background : '#F7F9F7' },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.keyboardContainer}
      >
        {/* Painel Centralizado Responsivo */}
        <View
          style={[
            styles.chatWrapper,
            isDesktop && styles.chatWrapperDesktop,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#DCE5E2',
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
                  { backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF' },
                ]}
              >
                <ArrowLeft size={18} color={isDark ? colors.text : '#173D3B'} />
              </TouchableOpacity>

              <View style={[styles.avatarBot, { backgroundColor: '#2F7F7C' }]}>
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
                  {isTemporary ? 'Modo Temporário' : 'Psicoeducação e acolhimento'}
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
                      ? '#2F7F7C'
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
                accessibilityLabel="Limpar histórico"
                style={[
                  styles.actionHeaderBtn,
                  { backgroundColor: isDark ? colors.surfaceSecondary : '#F2F6F5' },
                ]}
              >
                <Trash2 size={16} color={isDark ? colors.textMuted : '#667775'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. Área de Mensagens com Rolagem Própria */}
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesContainer}
            style={styles.messagesScrollView}
          >
            {/* Aviso Educativo e Ético */}
            <View
              style={[
                styles.safetyBanner,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : '#F0F7F6',
                  borderColor: isDark ? colors.border : '#D8EBE4',
                },
              ]}
            >
              <ShieldCheck size={14} color="#2F7F7C" style={{ marginRight: 6, marginTop: 1 }} />
              <Text style={[styles.safetyText, { color: isDark ? colors.textMuted : '#567571' }]}>
                Este assistente oferece acolhimento e psicoeducação. Não constitui laudo clínico nem
                substitui avaliação psicológica ou médica.
              </Text>
            </View>

            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const feedback = feedbackGiven[msg.id];
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
                    <View style={[styles.msgAvatar, { backgroundColor: '#2F7F7C' }]}>
                      <Bot size={13} color="#FFFFFF" />
                    </View>
                  )}

                  <View style={styles.bubbleCol}>
                    {/* Alerta de Emergência se houver risco clínico */}
                    {msg.isEmergencyAlert && (
                      <View
                        style={[
                          styles.alertBadge,
                          {
                            backgroundColor: isDark ? '#3D251C' : '#FFF2EB',
                            borderColor: '#F2B5A0',
                          },
                        ]}
                      >
                        <ShieldAlert size={14} color="#D98968" style={{ marginRight: 6 }} />
                        <Text style={[styles.alertBadgeText, { color: '#D98968' }]}>
                          Precisa de apoio humano imediato? Disque 188 (CVV gratuito 24h)
                        </Text>
                      </View>
                    )}

                    {/* Balão da Mensagem com Quebra de Linha Automática */}
                    <View
                      style={[
                        styles.bubble,
                        isUser
                          ? styles.userBubble
                          : [
                              styles.botBubble,
                              {
                                backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFA',
                                borderColor: isDark ? colors.border : '#EBF1EF',
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

                    {/* Recomendações de Práticas / Artigos */}
                    {!isUser && msg.recommendedPracticeId && (
                      <TouchableOpacity
                        onPress={() => router.push('/practices/player/practice-breathing-guided' as any)}
                        style={[
                          styles.recActionBtn,
                          {
                            backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
                            borderColor: '#2F7F7C',
                          },
                        ]}
                      >
                        <Wind size={14} color="#2F7F7C" />
                        <Text style={styles.recActionText}>
                          Abrir exercício de respiração guiada
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Barra de Ações da Mensagem da IA */}
                    {!isUser && (
                      <View style={styles.msgActionsRow}>
                        <TouchableOpacity
                          onPress={() => handleCopy(msg.text, msg.id)}
                          accessibilityRole="button"
                          accessibilityLabel="Copiar mensagem"
                          style={styles.msgActionIconBtn}
                        >
                          {isCopied ? (
                            <Check size={13} color="#2F7F7C" />
                          ) : (
                            <Copy size={13} color={isDark ? colors.textMuted : '#8C9E9B'} />
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleFeedback(msg.id, 'up')}
                          accessibilityRole="button"
                          accessibilityLabel="Mensagem útil"
                          style={styles.msgActionIconBtn}
                        >
                          <ThumbsUp
                            size={13}
                            color={feedback === 'up' ? '#2F7F7C' : isDark ? colors.textMuted : '#8C9E9B'}
                            fill={feedback === 'up' ? '#2F7F7C' : 'none'}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleFeedback(msg.id, 'down')}
                          accessibilityRole="button"
                          accessibilityLabel="Mensagem não útil"
                          style={styles.msgActionIconBtn}
                        >
                          <ThumbsDown
                            size={13}
                            color={feedback === 'down' ? '#D9534F' : isDark ? colors.textMuted : '#8C9E9B'}
                            fill={feedback === 'down' ? '#D9534F' : 'none'}
                          />
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Sugestões Rápidas de Resposta */}
                    {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                      <View
                        style={styles.suggestionsList}
                        aria-label="Sugestões de perguntas e ações"
                        {...(Platform.OS === 'web' ? ({ role: 'group' } as any) : {})}
                      >
                        {msg.suggestions.map((sug, sIdx) => (
                          <TouchableOpacity
                            key={sIdx}
                            onPress={() => !isTyping && handleSend(sug)}
                            disabled={isTyping}
                            accessibilityRole="button"
                            accessibilityLabel={`Enviar sugestão: ${sug}`}
                            {...(Platform.OS === 'web' ? ({ type: 'button' } as any) : {})}
                            style={[
                              styles.suggestionChip,
                              {
                                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                                borderColor: isDark ? colors.border : '#DCE5E2',
                                opacity: isTyping ? 0.6 : 1,
                              },
                            ]}
                          >
                            <MessageCircle size={12} color="#2F7F7C" style={{ marginRight: 5 }} aria-hidden={true} />
                            <Text style={styles.suggestionText}>{sug}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Indicador de Digitação */}
            {isTyping && (
              <View style={[styles.messageRow, styles.botMessageRow]}>
                <View style={[styles.msgAvatar, { backgroundColor: '#2F7F7C' }]}>
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
                    <ActivityIndicator size="small" color="#2F7F7C" />
                    <Text style={{ fontSize: 13, color: isDark ? colors.textMuted : '#667775' }}>
                      Escrevendo resposta...
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* 3. Barra Inferior de Digitação e Envio */}
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderTopColor: isDark ? colors.border : '#EBF1EF',
              },
            ]}
          >
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Escreva uma dúvida ou conte como você está se sentindo..."
              placeholderTextColor="#8C9E9B"
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

            <TouchableOpacity
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isTyping}
              accessibilityRole="button"
              accessibilityLabel="Enviar mensagem"
              {...(Platform.OS === 'web' ? ({ type: 'button' } as any) : {})}
              style={[
                styles.sendBtn,
                {
                  backgroundColor:
                    inputText.trim() && !isTyping ? '#2F7F7C' : isDark ? colors.surfaceSecondary : '#EBF1EF',
                },
              ]}
            >
              <Send
                size={17}
                color={inputText.trim() && !isTyping ? '#FFFFFF' : '#8C9E9B'}
                aria-hidden={true}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal de Confirmação para Limpar Histórico */}
      <ConfirmDialog
        visible={showClearModal}
        title="Limpar conversa?"
        message="As mensagens anteriores serão apagadas deste dispositivo."
        confirmTitle="Limpar"
        cancelTitle="Cancelar"
        onConfirm={async () => {
          setShowClearModal(false);
          await clearHistory();
          showToast({ message: 'Histórico de conversa apagado.', type: 'info' });
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
  headerStatus: {
    fontSize: 11,
    marginTop: 1,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#2F7F7C',
  },
  headerRight: {
    flexDirection: 'row',
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  safetyText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    width: '100%',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  botMessageRow: {
    justifyContent: 'flex-start',
  },
  msgAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  bubbleCol: {
    maxWidth: '85%',
    flexShrink: 1,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    flexShrink: 1,
  },
  userBubble: {
    backgroundColor: '#2F7F7C',
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  botBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
    flexShrink: 1,
  },
  timestampText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  alertBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  recActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
    gap: 6,
  },
  recActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2F7F7C',
  },
  msgActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    paddingLeft: 4,
  },
  msgActionIconBtn: {
    padding: 4,
  },
  suggestionsList: {
    marginTop: 8,
    gap: 6,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2F7F7C',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  inputField: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
