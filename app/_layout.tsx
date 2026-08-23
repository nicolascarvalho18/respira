import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/store/authStore';
import { useThemeStore } from '../src/store/themeStore';
import { useMoodStore } from '../src/store/moodStore';
import { useContentStore } from '../src/store/contentStore';
import { usePracticeStore } from '../src/store/practiceStore';
import { useChatStore } from '../src/store/chatStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
  },
});

export default function RootLayout() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const initializeTheme = useThemeStore((state) => state.initializeTheme);
  const fetchRecords = useMoodStore((state) => state.fetchRecords);
  const fetchArticles = useContentStore((state) => state.fetchArticles);
  const fetchPractices = usePracticeStore((state) => state.fetchPractices);
  const fetchMessages = useChatStore((state) => state.fetchMessages);

  useEffect(() => {
    // Inicialização global de tema, autenticação e dados
    async function bootstrap() {
      await Promise.all([
        initializeTheme(),
        initializeAuth(),
        fetchRecords(),
        fetchArticles(),
        fetchPractices(),
        fetchMessages(),
      ]);
    }

    bootstrap();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
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
        <Stack.Screen name="practices/breathing" />
        <Stack.Screen name="practices/player/[id]" />
        <Stack.Screen name="content/[id]" />
        <Stack.Screen name="mood/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="mood/edit/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="admin/index" />
      </Stack>
    </QueryClientProvider>
  );
}
