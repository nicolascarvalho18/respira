import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  MessageCircle,
  User as UserIcon,
  AlertTriangle,
  ArrowRight,
  Play,
  BookOpen,
  Headphones,
  HeartHandshake,
  Phone,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react-native';
import { ChatMessage } from '../../types';
import { formatTime } from '../../utils/date';
import { useTheme } from '../../hooks/useTheme';

export interface ChatBubbleProps {
  message: ChatMessage;
  onSelectSuggestion?: (text: string) => void;
  onFeedback?: (messageId: string, rating: 'helpful' | 'unhelpful') => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  onSelectSuggestion,
  onFeedback,
}) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [copied, setCopied] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<'helpful' | 'unhelpful' | undefined>(message.feedback);

  const isUser = message.sender === 'user';
  const isEmergency = !!message.isEmergencyAlert;

  const handleAction = () => {
    if (message.actionType === 'call_helpline') {
      const phoneNumber = message.actionPayload || '188';
      Linking.openURL(`tel:${phoneNumber}`).catch(() => {
        router.push('/support');
      });
      return;
    }

    if (message.actionType === 'open_practice' && message.actionPayload) {
      if (message.actionPayload.includes('breathing')) {
        router.push('/practices/breathing');
      } else {
        router.push(`/practices/player/${message.actionPayload}` as any);
      }
      return;
    }

    if (message.actionType === 'open_article' && message.actionPayload) {
      router.push(`/content/${message.actionPayload}` as any);
      return;
    }

    if (message.actionType === 'open_mood') {
      router.push('/momentos' as any);
      return;
    }

    if (message.actionType === 'open_soundscape') {
      router.push('/soundscape' as any);
      return;
    }

    if (message.actionType === 'open_profile') {
      router.push('/(tabs)/profile' as any);
      return;
    }

    // Fallbacks legados
    if (isEmergency) {
      router.push('/support');
    } else if (message.recommendedPracticeId) {
      router.push('/practices/breathing');
    } else if (message.recommendedArticleId) {
      router.push(`/content/${message.recommendedArticleId}` as any);
    }
  };

  const handleCopy = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(message.text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRating = (rating: 'helpful' | 'unhelpful') => {
    setLocalFeedback(rating);
    if (onFeedback) {
      onFeedback(message.id, rating);
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
      accessibilityLabel={`${isUser ? 'Você' : 'Assistente'}: ${message.text}`}
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
                  ? colors.error
                  : isDark
                    ? '#223431'
                    : colors.highlight,
            },
          ]}
        >
          {isUser ? (
            <UserIcon size={14} color="#FFFFFF" aria-hidden={true} />
          ) : isEmergency ? (
            <AlertTriangle size={14} color="#FFFFFF" aria-hidden={true} />
          ) : (
            <MessageCircle size={14} color={isDark ? '#5ECFC3' : colors.primary} aria-hidden={true} />
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
                    ? '#3A1E1D'
                    : '#FDF2F2'
                  : isDark
                    ? colors.surface
                    : '#FFFFFF',
              borderColor: isEmergency ? colors.error : isDark ? colors.border : '#E0E5E2',
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
                      ? '#FCA5A5'
                      : '#991B1B'
                    : colors.text,
              },
            ]}
          >
            {message.text}
          </Text>

          {/* Botão de Ação Interativa Recomendada */}
          {(message.actionText || message.recommendedPracticeId || message.recommendedArticleId || isEmergency) && (
            <TouchableOpacity
              onPress={handleAction}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={message.actionText || 'Acessar recurso recomendado'}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isEmergency
                    ? isDark
                      ? '#7F1D1D'
                      : '#DC2626'
                    : isDark
                      ? '#243A36'
                      : '#EDF7F5',
                  borderColor: isEmergency ? '#EF4444' : colors.primary,
                },
              ]}
            >
              <View style={styles.actionBtnContent}>
                {message.actionType === 'call_helpline' || isEmergency ? (
                  <Phone size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                ) : message.actionType === 'open_soundscape' ? (
                  <Headphones size={14} color={isDark ? '#5ECFC3' : colors.primary} style={{ marginRight: 6 }} />
                ) : message.actionType === 'open_article' ? (
                  <BookOpen size={14} color={isDark ? '#5ECFC3' : colors.primary} style={{ marginRight: 6 }} />
                ) : (
                  <Play size={14} color={isDark ? '#5ECFC3' : colors.primary} style={{ marginRight: 6 }} />
                )}

                <Text
                  style={[
                    styles.actionBtnText,
                    {
                      color: isEmergency ? '#FFFFFF' : isDark ? '#5ECFC3' : colors.primary,
                    },
                  ]}
                >
                  {message.actionText ||
                    (isEmergency
                      ? 'Ligar para CVV (188)'
                      : message.recommendedPracticeId
                        ? 'Iniciar Respiração'
                        : 'Ler Conteúdo')}
                </Text>
              </View>
              <ArrowRight
                size={14}
                color={isEmergency ? '#FFFFFF' : isDark ? '#5ECFC3' : colors.primary}
              />
            </TouchableOpacity>
          )}

          {/* Rodapé: Horário e Ações (Copiar / Avaliar) */}
          <View style={styles.bubbleFooter}>
            <Text
              style={[
                styles.timestamp,
                {
                  color: isUser ? 'rgba(255,255,255,0.7)' : colors.textMuted,
                },
              ]}
            >
              {formatTime(message.timestamp)}
            </Text>

            {!isUser && (
              <View style={styles.footerActions}>
                <TouchableOpacity
                  onPress={handleCopy}
                  style={styles.iconAction}
                  accessibilityLabel="Copiar mensagem"
                >
                  {copied ? (
                    <Check size={12} color={colors.primary} />
                  ) : (
                    <Copy size={12} color={colors.textMuted} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleRating('helpful')}
                  style={styles.iconAction}
                  accessibilityLabel="Mensagem útil"
                >
                  <ThumbsUp
                    size={12}
                    color={localFeedback === 'helpful' ? colors.primary : colors.textMuted}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleRating('unhelpful')}
                  style={styles.iconAction}
                  accessibilityLabel="Mensagem não útil"
                >
                  <ThumbsDown
                    size={12}
                    color={localFeedback === 'unhelpful' ? colors.error : colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Chips de Sugestões de Respostas */}
      {!isUser && message.suggestions && message.suggestions.length > 0 && onSelectSuggestion && (
        <View style={styles.suggestionsContainer}>
          {message.suggestions.slice(0, 3).map((sug, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => onSelectSuggestion(sug)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Sugestão: ${sug}`}
              style={[
                styles.suggestionChip,
                {
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  borderColor: isDark ? colors.border : '#DCE4E1',
                },
              ]}
            >
              <Text style={[styles.suggestionText, { color: isDark ? '#5ECFC3' : colors.primary }]}>
                {sug}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    width: '100%',
  },
  messageRow: {
    alignItems: 'flex-end',
    maxWidth: '90%',
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
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    borderRadius: 18,
    maxWidth: '100%',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 4,
  },
  actionBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 6,
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timestamp: {
    fontSize: 10,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  iconAction: {
    padding: 2,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    marginLeft: 40,
    gap: 6,
  },
  suggestionChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
