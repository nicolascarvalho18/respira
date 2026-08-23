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
  Trash2,
  Bot,
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
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useToast } from '../../src/components/ui/Toast';
import { useChatStore } from '../../src/store/chatStore';
import { useTheme } from '../../src/hooks/useTheme';
import { QUICK_SUGGESTIONS } from '../../src/mocks/chat.mock';
import { formatTime } from '../../src/utils/date';
import { chatService } from '../../src/services/chat/chatService';

export default function ChatScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { messages, isTyping, sendMessage, clearHistory } = useChatStore();
  const { showToast } = useToast();

  const [inputText, setInputText] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isTemporary, setIsTemporary] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    chatService.isTemporaryMode().then(setIsTemporary);
  }, []);

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
    showToast({ message: 'Mensagem copiada.', type: 'info' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = async (msgId: string, type: 'up' | 'down') => {
    setFeedbackGiven((prev) => ({ ...prev, [msgId]: type }));
    await chatService.recordFeedback(msgId, type === 'up' ? 'helpful' : 'unhelpful');
    showToast({
      message: type === 'up' ? 'Obrigado pela avaliação positiva!' : 'Agradecemos o retorno para aperfeiçoar as respostas.',
      type: 'info',
    });
  };

  const handleToggleTemporary = async () => {
    const next = !isTemporary;
    setIsTemporary(next);
    await chatService.setTemporaryMode(next);
    showToast({
      message: next ? 'Modo temporário ativado (esta conversa não será salva).' : 'Modo normal ativado.',
      type: 'info',
    });
  };

  const handleRegenerateLast = async () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user');
    if (lastUserMsg && !isTyping) {
      await sendMessage(lastUserMsg.text);
    }
  };

  return (
    <AppShell scrollable={false}>
      {/* 1. Cabeçalho do Chat Compacto */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>

          <View style={[styles.avatarBot, { backgroundColor: colors.highlight }]}>
            <Bot size={20} color={colors.primary} />
          </View>

          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Assistente Respira</Text>
              <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
            </View>
            <Text style={[styles.headerStatus, { color: colors.textMuted }]}>
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
              { backgroundColor: isTemporary ? colors.highlight : colors.surfaceSecondary },
            ]}
          >
            <EyeOff size={16} color={isTemporary ? colors.primary : colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowClearModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Limpar histórico"
            style={[styles.actionHeaderBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <Trash2 size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Área de Mensagens */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContainer}
      >
        {/* Aviso de Privacidade e Limites Éticos */}
        <View
          style={[
            styles.safetyBanner,
            {
              backgroundColor: isDark ? colors.surfaceSecondary : '#F0F7F6',
              borderColor: colors.border,
            },
          ]}
        >
          <ShieldCheck size={14} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.safetyText, { color: colors.textSecondary }]}>
            Este assistente é educativo e não substitui avaliação médica ou psicológica.
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
                <View style={[styles.msgAvatar, { backgroundColor: colors.highlight }]}>
                  <Bot size={14} color={colors.primary} />
                </View>
              )}

              <View style={{ maxWidth: '82%' }}>
                {/* Alerta de Emergência se houver risco clínico */}
                {msg.isEmergencyAlert && (
                  <View
                    style={[
                      styles.alertBadge,
                      {
                        backgroundColor: isDark ? '#3D251C' : '#FFF2EB',
                        borderColor: colors.warning,
                      },
                    ]}
                  >
                    <ShieldAlert size={14} color={colors.warning} style={{ marginRight: 6 }} />
                    <Text style={[styles.alertBadgeText, { color: colors.warning }]}>
                      Precisa de apoio humano imediato? Disque 188 (CVV gratuito)
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
                            backgroundColor: isDark ? colors.surface : '#FFFFFF',
                            borderColor: colors.border,
                          },
                        ],
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      { color: isUser ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {msg.text}
                  </Text>
                  <Text
                    style={[
                      styles.timestampText,
                      { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textMuted },
                    ]}
                  >
                    {formatTime(msg.timestamp)}
                  </Text>
                </View>

                {/* Recomendações de Práticas / Artigos RAG */}
                {!isUser && msg.recommendedPracticeId && (
                  <TouchableOpacity
                    onPress={() => router.push('/practices/breathing')}
                    style={[
                      styles.recActionBtn,
                      {
                        backgroundColor: isDark ? colors.surfaceSecondary : '#F0F9F8',
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Wind size={14} color={colors.primary} />
                    <Text style={[styles.recActionText, { color: colors.primaryDark }]}>
                      Abrir prática recomendada no app
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Barra de Ações da Mensagem do Bot */}
                {!isUser && (
                  <View style={styles.msgActionsRow}>
                    <TouchableOpacity
                      onPress={() => handleCopy(msg.text, msg.id)}
                      accessibilityRole="button"
                      accessibilityLabel="Copiar mensagem"
                      style={styles.msgActionIconBtn}
                    >
                      {isCopied ? (
                        <Check size={13} color={colors.success} />
                      ) : (
                        <Copy size={13} color={colors.textMuted} />
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
                        color={feedback === 'up' ? colors.primary : colors.textMuted}
                        fill={feedback === 'up' ? colors.primary : 'none'}
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
                        color={feedback === 'down' ? colors.warning : colors.textMuted}
                        fill={feedback === 'down' ? colors.warning : 'none'}
                      />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Sugestões Rápidas de Resposta */}
                {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                  <View style={styles.suggestionsList}>
                    {msg.suggestions.map((sug, sIdx) => (
                      <TouchableOpacity
                        key={sIdx}
                        onPress={() => handleSend(sug)}
                        style={[
                          styles.suggestionChip,
                          {
                            backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.suggestionText, { color: colors.primary }]}>
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

        {/* Indicador de Digitação */}
        {isTyping && (
          <View style={[styles.messageRow, styles.botMessageRow]}>
            <View style={[styles.msgAvatar, { backgroundColor: colors.highlight }]}>
              <Bot size={14} color={colors.primary} />
            </View>
            <View
              style={[
                styles.bubble,
                styles.botBubble,
                {
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Escrevendo resposta...</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 3. Barra Inferior de Envio Compacta */}
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
          value={inputText}
          onChangeText={setInputText}
          placeholder="Escreva sua dúvida sobre ansiedade..."
          placeholderTextColor={colors.textMuted}
          onKeyPress={handleKeyDown}
          multiline
          maxLength={1000}
          style={[
            styles.inputField,
            {
              backgroundColor: isDark ? colors.surfaceSecondary : '#F5F8F7',
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
        />

        <TouchableOpacity
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isTyping}
          accessibilityRole="button"
          accessibilityLabel="Enviar mensagem"
          style={[
            styles.sendBtn,
            {
              backgroundColor: inputText.trim() && !isTyping ? colors.primary : colors.surfaceSecondary,
            },
          ]}
        >
          <Send
            size={18}
            color={inputText.trim() && !isTyping ? '#FFFFFF' : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

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
    </AppShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerStatus: {
    fontSize: 11,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
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
  messagesContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
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
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  botBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
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
  },
  msgActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    paddingLeft: 4,
  },
  msgActionIconBtn: {
    padding: 3,
  },
  suggestionsList: {
    marginTop: 6,
    gap: 6,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
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
