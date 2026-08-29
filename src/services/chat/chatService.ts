import { ChatMessage } from '../../types';
import { INITIAL_CHAT_MESSAGES } from '../../mocks/chat.mock';
import { storage } from '../storage/asyncStorage';
import { logger } from '../../utils/logger';
import { aiAssistantService } from '../../server/services/aiAssistantService';
import { supabase, isSupabaseConfigured } from '../supabase/client';

const CHAT_STORAGE_KEY = 'respira_chat_history';
const CHAT_TEMPORARY_KEY = 'respira_chat_is_temporary';
const CHAT_CONSENT_KEY = 'respira_chat_retention_consent';
const ACTIVE_CONVERSATION_KEY = 'respira_active_conversation_id';

export interface ConversationItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

class ChatService {
  /**
   * Obtém as mensagens da conversa atual.
   */
  async getMessages(conversationId?: string): Promise<ChatMessage[]> {
    const isTemporary = await this.isTemporaryMode();
    if (isTemporary) {
      return INITIAL_CHAT_MESSAGES;
    }

    // 1. Tentar buscar do Supabase se houver conversa e banco configurado
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          let targetConvId = conversationId;
          if (!targetConvId) {
            targetConvId = (await storage.getItem<string>(ACTIVE_CONVERSATION_KEY)) || undefined;
          }

          if (targetConvId) {
            const { data: dbMessages, error } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', targetConvId)
              .order('created_at', { ascending: true });

            if (!error && dbMessages && dbMessages.length > 0) {
              return dbMessages.map((m: any) => ({
                id: m.id,
                sessionId: m.conversation_id,
                sender: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
                text: m.content,
                timestamp: m.created_at,
                actionText: m.action_text,
                actionType: m.action_type,
                actionPayload: m.action_payload,
                isEmergencyAlert: m.is_emergency_alert,
                feedback: m.feedback,
              }));
            }
          }
        }
      } catch (_e) {
        // Fallback para storage local
      }
    }

    const stored = await storage.getItem<ChatMessage[]>(CHAT_STORAGE_KEY);
    if (!stored || stored.length === 0) {
      return INITIAL_CHAT_MESSAGES;
    }
    return stored;
  }

  /**
   * Salva histórico de mensagens localmente e no Supabase.
   */
  async saveMessages(messages: ChatMessage[], conversationId?: string): Promise<void> {
    const isTemporary = await this.isTemporaryMode();
    if (!isTemporary) {
      await storage.setItem(CHAT_STORAGE_KEY, messages);
    }
  }

  /**
   * Limpa todo o histórico da conversa atual.
   */
  async clearHistory(conversationId?: string): Promise<void> {
    await storage.setItem(CHAT_STORAGE_KEY, INITIAL_CHAT_MESSAGES);

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          let targetConvId = conversationId;
          if (!targetConvId) {
            targetConvId = (await storage.getItem<string>(ACTIVE_CONVERSATION_KEY)) || undefined;
          }
          if (targetConvId) {
            await supabase.from('messages').delete().eq('conversation_id', targetConvId);
          }
        }
      } catch (_e) {
        // Ignora erro
      }
    }

    logger.info('Chat history reset to initial message');
  }

  async isTemporaryMode(): Promise<boolean> {
    return (await storage.getItem<boolean>(CHAT_TEMPORARY_KEY)) ?? false;
  }

  async setTemporaryMode(val: boolean): Promise<void> {
    await storage.setItem(CHAT_TEMPORARY_KEY, val);
  }

  async hasRetentionConsent(): Promise<boolean> {
    return (await storage.getItem<boolean>(CHAT_CONSENT_KEY)) ?? true;
  }

  async setRetentionConsent(val: boolean): Promise<void> {
    await storage.setItem(CHAT_CONSENT_KEY, val);
    if (!val) {
      await this.clearHistory();
    }
  }

  /**
   * Envia uma mensagem e gera a resposta inteligente com RAG e botões de ação.
   */
  async sendMessage(
    text: string,
    userId: string = 'user-current',
    conversationId?: string,
    abortSignal?: AbortSignal
  ): Promise<{
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
  }> {
    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const currentMessages = await this.getMessages(conversationId);
    const withUser = [...currentMessages, userMessage];
    await this.saveMessages(withUser, conversationId);

    // Salvar mensagem do usuário no Supabase se houver conversa
    if (isSupabaseConfigured && conversationId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            user_id: user.id,
            role: 'user',
            content: text.trim(),
          });
        }
      } catch (_e) {
        // Fallback local garantido
      }
    }

    // Gerar resposta inteligente no backend / motor semântico
    const aiResult = await aiAssistantService.generateResponse(
      text,
      userId,
      currentMessages.map((m) => ({ sender: m.sender as 'user' | 'assistant', text: m.text })),
      abortSignal
    );

    const assistantMessage: ChatMessage = {
      id: `msg-assistant-${Date.now()}`,
      sender: 'assistant',
      text: aiResult.text,
      timestamp: new Date().toISOString(),
      suggestions: aiResult.suggestions,
      isEmergencyAlert: aiResult.isEmergencyAlert,
      recommendedPracticeId: aiResult.recommendedPracticeId,
      recommendedArticleId: aiResult.recommendedArticleId,
      actionText: aiResult.actionText,
      actionType: aiResult.actionType,
      actionPayload: aiResult.actionPayload,
    };

    const withAssistant = [...withUser, assistantMessage];
    await this.saveMessages(withAssistant, conversationId);

    // Salvar resposta do assistente no Supabase
    if (isSupabaseConfigured && conversationId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            user_id: user.id,
            role: 'assistant',
            content: assistantMessage.text,
            action_text: assistantMessage.actionText,
            action_type: assistantMessage.actionType,
            action_payload: assistantMessage.actionPayload,
            is_emergency_alert: assistantMessage.isEmergencyAlert,
          });
        }
      } catch (_e) {
        // Fallback local garantido
      }
    }

    return { userMessage, assistantMessage };
  }

  /**
   * Registra feedback positivo/negativo na mensagem.
   */
  async recordFeedback(messageId: string, feedback: 'helpful' | 'unhelpful'): Promise<void> {
    const messages = await this.getMessages();
    const updated = messages.map((m) => (m.id === messageId ? { ...m, feedback } : m));
    await this.saveMessages(updated);

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('messages')
            .update({ feedback })
            .eq('id', messageId);
        }
      } catch (_e) {
        // Fallback local garantido
      }
    }
  }
}

export const chatService = new ChatService();
