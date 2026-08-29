import { create } from 'zustand';
import { ChatMessage } from '../types';
import { chatService } from '../services/chat/chatService';

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  currentAbortController: AbortController | null;

  // Actions
  fetchMessages: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  regenerateResponse: () => Promise<void>;
  stopGeneration: () => void;
  clearHistory: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isTyping: false,
  isStreaming: false,
  isLoading: false,
  error: null,
  currentAbortController: null,

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

    // Cancela requisição anterior se houver
    if (get().currentAbortController) {
      get().currentAbortController?.abort();
    }

    const abortController = new AbortController();

    try {
      const userMsg: ChatMessage = {
        id: `msg-user-${Date.now()}`,
        sender: 'user',
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };

      set({
        messages: [...get().messages, userMsg],
        isTyping: true,
        isStreaming: true,
        currentAbortController: abortController,
        error: null,
      });

      const { assistantMessage } = await chatService.sendMessage(
        text,
        'user-current',
        undefined,
        abortController.signal
      );

      // Simulação suave de streaming / progressive display
      const fullText = assistantMessage.text;
      const tempAssistantId = assistantMessage.id;

      const baseAssistantMsg: ChatMessage = {
        ...assistantMessage,
        text: '',
      };

      set({
        messages: [...get().messages.filter((m) => m.id !== userMsg.id), userMsg, baseAssistantMsg],
        isTyping: false,
      });

      // Revelação progressiva rápida (15ms por bloco de caracteres)
      const chunkSize = Math.max(3, Math.floor(fullText.length / 25));
      let currentLength = 0;

      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (abortController.signal.aborted) {
            clearInterval(interval);
            resolve();
            return;
          }

          currentLength += chunkSize;
          if (currentLength >= fullText.length) {
            currentLength = fullText.length;
            clearInterval(interval);
            resolve();
          }

          const partialText = fullText.slice(0, currentLength);
          set({
            messages: get().messages.map((m) =>
              m.id === tempAssistantId ? { ...m, text: partialText } : m
            ),
          });
        }, 20);
      });

      set({
        messages: get().messages.map((m) =>
          m.id === tempAssistantId ? { ...m, text: fullText } : m
        ),
        isStreaming: false,
        isTyping: false,
        currentAbortController: null,
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        set({ isStreaming: false, isTyping: false, currentAbortController: null });
        return;
      }
      set({
        isStreaming: false,
        isTyping: false,
        currentAbortController: null,
        error: err.message || 'Erro ao enviar mensagem',
      });
    }
  },

  regenerateResponse: async () => {
    const messages = get().messages;
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user');
    if (!lastUserMsg) return;

    // Remove a última mensagem do assistente se existir
    const filtered = [...messages];
    if (filtered.length > 0 && filtered[filtered.length - 1].sender === 'assistant') {
      filtered.pop();
    }

    set({ messages: filtered });
    await get().sendMessage(lastUserMsg.text);
  },

  stopGeneration: () => {
    const controller = get().currentAbortController;
    if (controller) {
      controller.abort();
    }
    set({
      isStreaming: false,
      isTyping: false,
      currentAbortController: null,
    });
  },

  clearHistory: async () => {
    try {
      await chatService.clearHistory();
      const initial = await chatService.getMessages();
      set({ messages: initial, error: null });
    } catch (err: any) {
      set({ error: err.message || 'Erro ao limpar histórico' });
    }
  },
}));
