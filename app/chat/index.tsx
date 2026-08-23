import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Send, HeartHandshake, RefreshCw, Bot, ShieldAlert } from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { ChatBubble } from '../../src/components/chat/ChatBubble';
import { ConfirmationModal } from '../../src/components/ui/ConfirmationModal';
import { useChatStore } from '../../src/store/chatStore';
import { useTheme } from '../../src/hooks/useTheme';
import { QUICK_SUGGESTIONS } from '../../src/mocks/chat.mock';

export default function ChatScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { messages, isTyping, sendMessage, clearHistory } = useChatStore();

  const [inputText, setInputText] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const message = textToSend || inputText;
    if (!message.trim()) return;

    setInputText('');
    await sendMessage(message);
  };

  return (
    <ScreenContainer scrollable={false} withSafeArea>
      {/* Cabeçalho do Chat com Atalho SOS e Novo Chat */}
      <AppHeader
        showBack
        title="Assistente Educativo"
        subtitle="Informação e apoio ao bem-estar"
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push('/support')}
              accessibilityRole="button"
              accessibilityLabel="Apoio Imediato SOS"
              style={[styles.sosButton, { backgroundColor: isDark ? '#3A201A' : '#FFF0EA', borderColor: colors.warning }]}
            >
              <HeartHandshake size={16} color={colors.warning} />
              <Text style={[styles.sosText, { color: colors.warning }]}>Apoio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowClearModal(true)}
              accessibilityRole="button"
              accessibilityLabel="Reiniciar conversa"
              style={[styles.headerIconBtn, { backgroundColor: colors.surfaceSubtle }]}
            >
              <RefreshCw size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Aviso Fixo sobre Limites do Assistente */}
      <View
        style={[
          styles.disclaimerBanner,
          {
            backgroundColor: isDark ? colors.surfaceSubtle : colors.highlight,
            borderColor: colors.border,
          },
        ]}
      >
        <ShieldAlert size={16} color={colors.primary} style={{ marginRight: 8, marginTop: 1 }} />
        <Text style={[styles.disclaimerText, { color: colors.primaryDark }]}>
          Assistente de IA educativo: não substitui psicólogos, médicos ou serviços de emergência.
        </Text>
      </View>

      {/* Lista de Mensagens */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContainer}
      >
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            onSelectSuggestion={(sug) => handleSend(sug)}
          />
        ))}

        {/* Indicador de Digitação */}
        {isTyping && (
          <View style={styles.typingRow}>
            <View style={[styles.typingAvatar, { backgroundColor: colors.highlight }]}>
              <Bot size={14} color={colors.primary} />
            </View>
            <View
              style={[
                styles.typingBubble,
                {
                  backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.typingText, { color: colors.textMuted }]}>
                Refletindo e digitando...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sugestões Rápidas de Início se houver poucas mensagens */}
      {messages.length <= 1 && (
        <View style={styles.quickPromptsSection}>
          <Text style={[styles.quickPromptsTitle, { color: colors.textMuted }]}>
            Sugestões para conversar:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            {QUICK_SUGGESTIONS.map((prompt, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleSend(prompt)}
                style={[
                  styles.quickPromptChip,
                  {
                    backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.quickPromptText, { color: colors.primary }]}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Barra de Entrada de Mensagem */}
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
          placeholder="Digite sua dúvida ou como está se sentindo..."
          placeholderTextColor={colors.textLight}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          style={[
            styles.textInput,
            {
              backgroundColor: isDark ? colors.surfaceSubtle : '#F8FAFC',
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          accessibilityLabel="Campo de mensagem para o assistente educativo"
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

      {/* Modal de Limpeza de Conversa */}
      <ConfirmationModal
        visible={showClearModal}
        title="Reiniciar conversa?"
        message="O histórico local de mensagens desta conversa será reiniciado."
        confirmTitle="Reiniciar"
        cancelTitle="Cancelar"
        onConfirm={async () => {
          setShowClearModal(false);
          await clearHistory();
        }}
        onCancel={() => setShowClearModal(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  sosText: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  messagesContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 24,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  typingAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  typingText: {
    fontSize: 13,
  },
  quickPromptsSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  quickPromptsTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickPromptChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
  },
  quickPromptText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 20,
    borderWidth: 1,
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
