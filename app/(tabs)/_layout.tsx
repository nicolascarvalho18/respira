import React from 'react';
import { Tabs } from 'expo-router';
import { Home, BookHeart, Wind, BookOpen, User } from 'lucide-react-native';
import { useTheme } from '../../src/hooks/useTheme';

export default function TabLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          tabBarAccessibilityLabel: 'Aba Início',
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: 'Diário',
          tabBarIcon: ({ color, size }) => <BookHeart size={size} color={color} />,
          tabBarAccessibilityLabel: 'Aba Diário de Humor',
        }}
      />
      <Tabs.Screen
        name="practices"
        options={{
          title: 'Práticas',
          tabBarIcon: ({ color, size }) => <Wind size={size} color={color} />,
          tabBarAccessibilityLabel: 'Aba Práticas e Respiração',
        }}
      />
      <Tabs.Screen
        name="content"
        options={{
          title: 'Conteúdos',
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
          tabBarAccessibilityLabel: 'Aba Conteúdos Educativos',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          tabBarAccessibilityLabel: 'Aba Perfil e Configurações',
        }}
      />
    </Tabs>
  );
}
