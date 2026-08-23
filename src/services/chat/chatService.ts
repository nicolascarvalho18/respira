import { ChatMessage } from '../../types';
import {
  INITIAL_CHAT_MESSAGES,
  CHAT_RESPONSE_RULES,
  DEFAULT_CHAT_RESPONSE,
} from '../../mocks/chat.mock';
import { storage } from '../storage/asyncStorage';
import { logger } from '../../utils/logger';

const CHAT_STORAGE_KEY = 'respira_chat_history';

class ChatService {
  async getMessages(): Promise<ChatMessage[]> {
    const stored = await storage.getItem<ChatMessage[]>(CHAT_STORAGE_KEY);
    if (!stored || stored.length === 0) {
      return INITIAL_CHAT_MESSAGES;
    }
    return stored;
  }

  async saveMessages(messages: ChatMessage[]): Promise<void> {
    await storage.setItem(CHAT_STORAGE_KEY, messages);
  }

  async clearHistory(): Promise<void> {
    await storage.setItem(CHAT_STORAGE_KEY, INITIAL_CHAT_MESSAGES);
    logger.info('Chat history reset to initial message');
  }

  async sendMessage(text: string): Promise<{
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
  }> {
    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const currentMessages = await this.getMessages();
    const withUser = [...currentMessages, userMessage];
    await this.saveMessages(withUser);

    // Regra simulada de IA com palavras-chave e guardrails éticos
    const lower = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // remove acentos para busca robusta

    let matchedRule = CHAT_RESPONSE_RULES.find((rule) =>
      rule.keywords.some((kw) => {
        const kwNormalized = kw
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return lower.includes(kwNormalized);
      })
    );

    if (!matchedRule) {
      matchedRule = DEFAULT_CHAT_RESPONSE;
    }

    const assistantMessage: ChatMessage = {
      id: `msg-assistant-${Date.now()}`,
      sender: 'assistant',
      text: matchedRule.response,
      timestamp: new Date(Date.now() + 500).toISOString(),
      suggestions: matchedRule.suggestions,
      isEmergencyAlert: matchedRule.isEmergencyAlert,
      recommendedPracticeId: matchedRule.recommendedPracticeId,
      recommendedArticleId: matchedRule.recommendedArticleId,
    };

    const withAssistant = [...withUser, assistantMessage];
    await this.saveMessages(withAssistant);

    return { userMessage, assistantMessage };
  }
}

export const chatService = new ChatService();
