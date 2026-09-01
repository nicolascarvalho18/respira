import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../src/components/ui/Toast';
import { useAuthStore } from '../src/store/authStore';
import { useMoodStore } from '../src/store/moodStore';
import { useContentStore } from '../src/store/contentStore';
import { usePracticeStore } from '../src/store/practiceStore';
import { useChatStore } from '../src/store/chatStore';
import { useThemeStore } from '../src/store/themeStore';
import { notificationService } from '../src/services/notifications/notificationService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function RootLayout() {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const initializeTheme = useThemeStore((s) => s.initializeTheme);
  const fetchRecords = useMoodStore((s) => s.fetchRecords);
  const fetchPractices = usePracticeStore((s) => s.fetchPractices);
  const fetchArticles = useContentStore((s) => s.fetchArticles);
  const fetchMessages = useChatStore((s) => s.fetchMessages);

  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = 'pt-BR';
      document.documentElement.setAttribute('data-theme', mode);

      // Injetar variáveis CSS e regras de alto contraste do tema escuro
      const styleId = 'respira-dark-theme-style';
      let styleTag = document.getElementById(styleId);
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = `
        :root {
          --text-primary: #1F2927;
          --text-secondary: #68736F;
          --text-muted: #8F9B97;
          --icon-default: #8F9B97;
          --placeholder: #8F9B97;
          --bg-main: #F7F8F5;
        }
        [data-theme="dark"] {
          --text-primary: #FFFFFF;
          --text-secondary: #F1F5F9;
          --text-muted: #E2E8F0;
          --icon-default: #E2E8F0;
          --placeholder: #CBD5E1;
          --bg-main: #121918;
        }
        body {
          background-color: var(--bg-main);
        }
      `;
    }
  }, [mode]);

  useEffect(() => {
    async function bootstrap() {
      await initializeTheme();
      await initializeAuth();
      notificationService.registerServiceWorker();
      await Promise.all([
        fetchRecords(),
        fetchPractices(),
        fetchArticles(),
        fetchMessages(),
      ]);
    }
    bootstrap();
  }, [
    initializeAuth,
    initializeTheme,
    fetchRecords,
    fetchPractices,
    fetchArticles,
    fetchMessages,
  ]);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="chat/index"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="support/index"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="practices/breathing"
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="practices/grounding"
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="practices/relaxation"
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="practices/player/[id]"
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="content/[id]"
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="contents/[slug]"
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="mood/new"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="mood/edit/[id]"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="admin/index"
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
        </Stack>
      </ToastProvider>
    </QueryClientProvider>
  );
}
