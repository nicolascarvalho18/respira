import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Bot, User as UserIcon, AlertTriangle, ArrowRight } from 'lucide-react-native';
import { ChatMessage } from '../../types';
import { formatTime } from '../../utils/date';
import { useTheme } from '../../hooks/useTheme';

export interface ChatBubbleProps {
  message: ChatMessage;
  onSelectSuggestion?: (text: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onSelectSuggestion }) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const isUser = message.sender === 'user';
  const isEmergency = !!message.isEmergencyAlert;

  const handleRecommendation = () => {
    if (isEmergency) {
      router.push('/support');
    } else if (message.recommendedPracticeId) {
      if (message.recommendedPracticeId.includes('breathing')) {
        router.push('/practices/breathing');
      } else {
        router.push(`/practices/player/${message.recommendedPracticeId}`);
      }
    } else if (message.recommendedArticleId) {
      router.push(`/content/${message.recommendedArticleId}`);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          alignItems: isUser ? 'flex-end' : 'flex-start',
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${isUser ? 'Você' : 'Assistente Educativo'}: ${message.text}`}
    >
      <View style={[styles.messageRow, { flexDirection: isUser ? 'row-reverse' : 'row' }]}>
        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: isUser
                ? colors.primary
                : isEmergency
                  ? colors.warning
                  : colors.highlight,
            },
          ]}
        >
          {isUser ? (
            <UserIcon size={14} color="#FFFFFF" />
          ) : isEmergency ? (
            <AlertTriangle size={14} color="#FFFFFF" />
          ) : (
            <Bot size={14} color={colors.primary} />
          )}
        </View>

        {/* Balão de mensagem */}
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isUser
                ? colors.primary
                : isEmergency
                  ? isDark
                    ? '#3A201A'
                    : '#FFF4EE'
                  : isDark
                    ? colors.surfaceSubtle
                    : '#FFFFFF',
              borderColor: isEmergency ? colors.warning : colors.border,
              borderWidth: isUser ? 0 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              {
                color: isUser
                  ? '#FFFFFF'
                  : isEmergency
                    ? isDark
                      ? '#FFD1C1'
                      : '#8A2B18'
                    : colors.text,
              },
            ]}
          >
            {message.text}
          </Text>

          {/* Atalho de Prática ou Artigo Recomendado */}
          {(message.recommendedPracticeId || message.recommendedArticleId || isEmergency) && (
            <TouchableOpacity
              onPress={handleRecommendation}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Acessar recurso recomendado"
              style={[
                styles.recCard,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                  borderColor: isEmergency ? colors.warning : colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.recText,
                  { color: isEmergency ? colors.warning : colors.primary },
                ]}
              >
                {isEmergency
                  ? 'Acessar Linhas de Apoio Imediato'
                  : message.recommendedPracticeId
                    ? 'Experimentar Prática Sugerida'
                    : 'Ler Artigo Relacionado'}
              </Text>
              <ArrowRight
                size={14}
                color={isEmergency ? colors.warning : colors.primary}
              />
            </TouchableOpacity>
          )}

          <Text
            style={[
              styles.timestamp,
              {
                color: isUser ? 'rgba(255,255,255,0.7)' : colors.textMuted,
                alignSelf: isUser ? 'flex-end' : 'flex-start',
              },
            ]}
          >
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>

      {/* Chips de Sugestões de Respostas */}
      {!isUser && message.suggestions && message.suggestions.length > 0 && onSelectSuggestion && (
        <View style={styles.suggestionsContainer}>
          {message.suggestions.map((sug, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => onSelectSuggestion(sug)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Sugestão: ${sug}`}
              style={[
                styles.suggestionChip,
                {
                  backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text style={[styles.suggestionText, { color: colors.primary }]}>{sug}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: '100%',
  },
  messageRow: {
    alignItems: 'flex-end',
    maxWidth: '88%',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    marginBottom: 4,
  },
  bubble: {
    padding: 14,
    borderRadius: 20,
    maxWidth: '100%',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 6,
  },
  recCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  recText: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 6,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginLeft: 40,
    gap: 6,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
