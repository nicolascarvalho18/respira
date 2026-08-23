import { create } from 'zustand';
import { ChatMessage } from '../types';
import { chatService } from '../services/chat/chatService';

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMessages: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isTyping: false,
  isLoading: false,
  error: null,

  fetchMessages: async () => {
    try {
      set({ isLoading: true, error: null });
      const messages = await chatService.getMessages();
      set({ messages, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Erro ao carregar mensagens' });
    }
  },

  sendMessage: async (text: string) => {
    if (!text.trim()) return;

    try {
      // Adiciona mensagem do usuário imediatamente
      const userMsg: ChatMessage = {
        id: `msg-user-temp-${Date.now()}`,
        sender: 'user',
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };

      set({
        messages: [...get().messages, userMsg],
        isTyping: true,
      });

      // Simulação do tempo de resposta da IA
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { assistantMessage } = await chatService.sendMessage(text);

      const current = get().messages.filter((m) => m.id !== userMsg.id);
      set({
        messages: [...current, userMsg, assistantMessage],
        isTyping: false,
      });
    } catch (err: any) {
      set({ isTyping: false, error: err.message || 'Erro ao enviar mensagem' });
    }
  },

  clearHistory: async () => {
    try {
      await chatService.clearHistory();
      const initial = await chatService.getMessages();
      set({ messages: initial });
    } catch (err: any) {
      set({ error: err.message || 'Erro ao limpar histórico' });
    }
  },
}));
