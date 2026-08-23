import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Home, BookOpen, Wind, Library, User } from 'lucide-react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          display: isDesktop ? 'none' : 'flex',
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => <Home size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: 'Diário',
          tabBarLabel: 'Diário',
          tabBarIcon: ({ color, size }) => <BookOpen size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="practices"
        options={{
          title: 'Práticas',
          tabBarLabel: 'Práticas',
          tabBarIcon: ({ color, size }) => <Wind size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="content"
        options={{
          title: 'Conteúdos',
          tabBarLabel: 'Conteúdos',
          tabBarIcon: ({ color, size }) => <Library size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => <User size={size || 22} color={color} />,
        }}
      />
    </Tabs>
  );
}
