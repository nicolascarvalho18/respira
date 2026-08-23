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
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Send,
  HeartHandshake,
  RefreshCw,
  Bot,
  ShieldAlert,
  ArrowLeft,
  Bookmark,
  Wind,
  Check,
  Copy,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useToast } from '../../src/components/ui/Toast';
import { useChatStore } from '../../src/store/chatStore';
import { useTheme } from '../../src/hooks/useTheme';
import { QUICK_SUGGESTIONS } from '../../src/mocks/chat.mock';
import { formatTime } from '../../src/utils/date';

export default function ChatScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { messages, isTyping, sendMessage, clearHistory } = useChatStore();
  const { showToast } = useToast();

  const [inputText, setInputText] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

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
    showToast({ message: 'Mensagem copiada para a área de transferência.', type: 'info' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (msgId: string, type: 'up' | 'down') => {
    setFeedbackGiven((prev) => ({ ...prev, [msgId]: type }));
    showToast({
      message: type === 'up' ? 'Obrigado pelo retorno positivo!' : 'Obrigado pelo feedback.',
      type: 'info',
    });
  };

  return (
    <AppShell scrollable={false}>
      {/* 1. Cabeçalho do Chat */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={[styles.avatarBot, { backgroundColor: colors.highlight }]}>
            <Bot size={22} color={colors.primary} />
          </View>

          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Assistente Respira</Text>
              <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
            </View>
            <Text style={[styles.headerStatus, { color: colors.textMuted }]}>
              Psicoeducação e acolhimento
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => router.push('/support')}
            accessibilityRole="button"
            accessibilityLabel="Apoio Imediato SOS"
            style={[
              styles.sosHeaderBtn,
              {
                backgroundColor: isDark ? '#3D251C' : '#FFF2EB',
                borderColor: colors.warning,
              },
            ]}
          >
            <HeartHandshake size={16} color={colors.warning} />
            <Text style={[styles.sosHeaderText, { color: colors.warning }]}>Apoio Imediato</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowClearModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Nova conversa / limpar histórico"
            style={[styles.clearBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <RefreshCw size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Aviso de Limites Éticos */}
      <View
        style={[
          styles.ethicalNotice,
          {
            backgroundColor: isDark ? colors.surfaceSecondary : colors.highlight,
            borderColor: colors.border,
          },
        ]}
      >
        <ShieldAlert size={16} color={colors.primary} style={{ marginRight: 8, marginTop: 1 }} />
        <Text style={[styles.ethicalText, { color: colors.primaryDark }]}>
          Assistente educativo de bem-estar: não substitui consultas médicas, psicoterapia ou serviços de emergência.
        </Text>
      </View>

      {/* 3. Área de Mensagens */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContainer}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const feedback = feedbackGiven[msg.id];

          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                isUser ? styles.userMessageRow : styles.botMessageRow,
              ]}
            >
              {!isUser && (
                <View style={[styles.msgBotAvatar, { backgroundColor: colors.highlight }]}>
                  <Bot size={16} color={colors.primary} />
                </View>
              )}

              <View style={[styles.bubbleWrapper, isUser && { alignItems: 'flex-end' }]}>
                <View
                  style={[
                    styles.bubble,
                    isUser
                      ? [styles.userBubble, { backgroundColor: colors.primary }]
                      : [
                          styles.botBubble,
                          {
                            backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                            borderColor: msg.isEmergencyAlert ? colors.warning : colors.border,
                          },
                        ],
                  ]}
                >
                  {/* Alerta de Emergência se detectado */}
                  {msg.isEmergencyAlert && (
                    <View
                      style={[
                        styles.emergencyCard,
                        {
                          backgroundColor: isDark ? '#3D251C' : '#FFF4EE',
                          borderColor: colors.warning,
                        },
                      ]}
                    >
                      <HeartHandshake size={20} color={colors.warning} style={{ marginRight: 8 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.emergencyTitle, { color: colors.warning }]}>
                          Linha de Apoio Emocional Gratuito
                        </Text>
                        <Text style={[styles.emergencySub, { color: isDark ? '#F5DDD6' : '#733722' }]}>
                          Ligue para o CVV no número 188 (disponível 24 horas).
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Texto da Mensagem */}
                  <Text
                    style={[
                      styles.messageText,
                      { color: isUser ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {msg.text}
                  </Text>

                  {/* Card RAG de Prática Recomendada */}
                  {msg.recommendedPracticeId && (
                    <TouchableOpacity
                      onPress={() => router.push('/practices/breathing')}
                      activeOpacity={0.85}
                      style={[
                        styles.ragCard,
                        {
                          backgroundColor: isDark ? colors.surface : colors.highlight,
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <Wind size={18} color={colors.primary} style={{ marginRight: 8 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.ragTitle, { color: colors.primaryDark }]}>
                          Prática Recomendada: Respiração 4-7-8
                        </Text>
                        <Text style={[styles.ragSub, { color: colors.textMuted }]}>
                          Toque para iniciar o exercício guiado
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {/* Card RAG de Artigo Recomendado */}
                  {msg.recommendedArticleId && (
                    <TouchableOpacity
                      onPress={() => router.push('/content/article-sleep-and-stress')}
                      activeOpacity={0.85}
                      style={[
                        styles.ragCard,
                        {
                          backgroundColor: isDark ? colors.surface : colors.highlight,
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <Bookmark size={18} color={colors.primary} style={{ marginRight: 8 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.ragTitle, { color: colors.primaryDark }]}>
                          Artigo: Sono, Descanso e Regulação Emocional
                        </Text>
                        <Text style={[styles.ragSub, { color: colors.textMuted }]}>
                          Toque para abrir a leitura completa
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Rodapé da Mensagem: Horário, Ações de Copiar e Feedback */}
                <View style={styles.msgFooterRow}>
                  <Text style={[styles.msgTime, { color: colors.textMuted }]}>
                    {formatTime(msg.timestamp)}
                  </Text>

                  {!isUser && (
                    <View style={styles.botActionsRow}>
                      <TouchableOpacity
                        onPress={() => handleCopy(msg.text, msg.id)}
                        accessibilityLabel="Copiar mensagem"
                        style={styles.actionIconBtn}
                      >
                        {copiedId === msg.id ? (
                          <Check size={14} color={colors.success} />
                        ) : (
                          <Copy size={14} color={colors.textMuted} />
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleFeedback(msg.id, 'up')}
                        accessibilityLabel="Mensagem útil"
                        style={styles.actionIconBtn}
                      >
                        <ThumbsUp
                          size={14}
                          color={feedback === 'up' ? colors.primary : colors.textMuted}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleFeedback(msg.id, 'down')}
                        accessibilityLabel="Mensagem não útil"
                        style={styles.actionIconBtn}
                      >
                        <ThumbsDown
                          size={14}
                          color={feedback === 'down' ? colors.warning : colors.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}

        {/* Indicador de Digitação / Streaming */}
        {isTyping && (
          <View style={styles.typingRow}>
            <View style={[styles.msgBotAvatar, { backgroundColor: colors.highlight }]}>
              <Bot size={16} color={colors.primary} />
            </View>
            <View
              style={[
                styles.typingBubble,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.typingText, { color: colors.textMuted }]}>
                Refletindo e redigindo orientação...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 4. Sugestões Iniciais */}
      {messages.length <= 1 && (
        <View style={styles.suggestionsContainer}>
          <Text style={[styles.suggestionsTitle, { color: colors.textMuted }]}>
            Sugestões para iniciar:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            {QUICK_SUGGESTIONS.map((prompt, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleSend(prompt)}
                style={[
                  styles.suggestionChip,
                  {
                    backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.suggestionChipText, { color: colors.primary }]}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 5. Barra de Entrada de Mensagem */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderTopColor: colors.border,
          },
        ]}
      >
        <TextInput
          placeholder="Digite sua dúvida ou como está se sentindo... (Shift+Enter para nova linha)"
          placeholderTextColor={colors.textLight}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={600}
          onKeyPress={handleKeyDown}
          style={[
            styles.textInput,
            {
              backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          accessibilityLabel="Campo de mensagem para o assistente"
        />

        <TouchableOpacity
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isTyping}
          accessibilityRole="button"
          accessibilityLabel="Enviar mensagem"
          style={[
            styles.sendButton,
            {
              backgroundColor: inputText.trim() && !isTyping ? colors.primary : colors.borderStrong,
            },
          ]}
        >
          <Send size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Diálogo de Limpeza de Conversa */}
      <ConfirmDialog
        visible={showClearModal}
        title="Iniciar nova conversa?"
        message="O histórico local de mensagens desta conversa será reiniciado."
        confirmTitle="Nova Conversa"
        cancelTitle="Cancelar"
        onConfirm={async () => {
          setShowClearModal(false);
          await clearHistory();
          showToast({ message: 'Conversa reiniciada.', type: 'info' });
        }}
        onCancel={() => setShowClearModal(false)}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerStatus: {
    fontSize: 12,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sosHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 4,
  },
  sosHeaderText: {
    fontSize: 12,
    fontWeight: '700',
  },
  clearBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ethicalNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  ethicalText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  messagesContainer: {
    flexGrow: 1,
    paddingVertical: 12,
    gap: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    width: '100%',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  botMessageRow: {
    justifyContent: 'flex-start',
  },
  msgBotAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  bubbleWrapper: {
    maxWidth: '85%',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  botBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1.5,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  emergencyTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  emergencySub: {
    fontSize: 11,
    marginTop: 2,
  },
  ragCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 10,
  },
  ragTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  ragSub: {
    fontSize: 11,
    marginTop: 2,
  },
  msgFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  msgTime: {
    fontSize: 11,
  },
  botActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtn: {
    padding: 4,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 8,
  },
  typingText: {
    fontSize: 13,
  },
  suggestionsContainer: {
    paddingBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    marginRight: 8,
  },
  suggestionChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
