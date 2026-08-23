import { ChatMessage } from '../../types';
import { INITIAL_CHAT_MESSAGES } from '../../mocks/chat.mock';
import { storage } from '../storage/asyncStorage';
import { logger } from '../../utils/logger';
import { aiAssistantService } from '../../server/services/aiAssistantService';

const CHAT_STORAGE_KEY = 'respira_chat_history';
const CHAT_TEMPORARY_KEY = 'respira_chat_is_temporary';
const CHAT_CONSENT_KEY = 'respira_chat_retention_consent';

class ChatService {
  async getMessages(): Promise<ChatMessage[]> {
    const isTemporary = await this.isTemporaryMode();
    if (isTemporary) {
      return INITIAL_CHAT_MESSAGES;
    }

    const stored = await storage.getItem<ChatMessage[]>(CHAT_STORAGE_KEY);
    if (!stored || stored.length === 0) {
      return INITIAL_CHAT_MESSAGES;
    }
    return stored;
  }

  async saveMessages(messages: ChatMessage[]): Promise<void> {
    const isTemporary = await this.isTemporaryMode();
    if (!isTemporary) {
      await storage.setItem(CHAT_STORAGE_KEY, messages);
    }
  }

  async clearHistory(): Promise<void> {
    await storage.setItem(CHAT_STORAGE_KEY, INITIAL_CHAT_MESSAGES);
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

  async sendMessage(
    text: string,
    userId: string = 'user-demo-1'
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

    const currentMessages = await this.getMessages();
    const withUser = [...currentMessages, userMessage];
    await this.saveMessages(withUser);

    // Call backend AI service with PII scrubbing, crisis guardrails and RAG
    const aiResult = await aiAssistantService.generateResponse(
      text,
      userId,
      currentMessages.map((m) => ({ sender: m.sender as 'user' | 'assistant', text: m.text }))
    );

    const assistantMessage: ChatMessage = {
      id: `msg-assistant-${Date.now()}`,
      sender: 'assistant',
      text: aiResult.text,
      timestamp: new Date(Date.now() + 400).toISOString(),
      suggestions: aiResult.suggestions,
      isEmergencyAlert: aiResult.isEmergencyAlert,
      recommendedPracticeId: aiResult.recommendedPracticeId,
      recommendedArticleId: aiResult.recommendedArticleId,
    };

    const withAssistant = [...withUser, assistantMessage];
    await this.saveMessages(withAssistant);

    return { userMessage, assistantMessage };
  }

  async recordFeedback(messageId: string, feedback: 'helpful' | 'unhelpful'): Promise<void> {
    const messages = await this.getMessages();
    const updated = messages.map((m) => (m.id === messageId ? { ...m, feedback } : m));
    await this.saveMessages(updated);
  }
}

export const chatService = new ChatService();
