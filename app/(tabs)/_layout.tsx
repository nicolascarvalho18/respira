import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform, StyleSheet } from 'react-native';
import { Home, BookOpen, Wind, Library, User } from 'lucide-react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { MiniFloatingPlayer } from '../../src/components/soundscape/MiniFloatingPlayer';

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: isDark ? '#5ECFC3' : '#247B74',
          tabBarInactiveTintColor: isDark ? '#E2E8F0' : '#708885',
          tabBarStyle: {
            display: isDesktop ? 'none' : 'flex',
            backgroundColor: isDark ? '#172033' : '#FFFFFF',
            borderTopColor: isDark ? '#334155' : '#E5EAE8',
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 84 : 64,
            paddingBottom: Platform.OS === 'ios' ? 22 : 10,
            paddingTop: 8,
            elevation: 8,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
              },
              web: {
                boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.04)',
              },
            }),
          },
          tabBarItemStyle: {
            minHeight: 44,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Início',
            tabBarLabel: 'Início',
            tabBarIcon: ({ color }) => <Home size={22} color={color} strokeWidth={1.75} />,
          }}
        />
        <Tabs.Screen
          name="diary"
          options={{
            title: 'Diário',
            tabBarLabel: 'Diário',
            tabBarIcon: ({ color }) => <BookOpen size={22} color={color} strokeWidth={1.75} />,
          }}
        />
        <Tabs.Screen
          name="practices"
          options={{
            title: 'Práticas',
            tabBarLabel: 'Práticas',
            tabBarIcon: ({ color }) => <Wind size={22} color={color} strokeWidth={1.75} />,
          }}
        />
        <Tabs.Screen
          name="content"
          options={{
            title: 'Conteúdos',
            tabBarLabel: 'Conteúdos',
            tabBarIcon: ({ color }) => <Library size={22} color={color} strokeWidth={1.75} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarLabel: 'Perfil',
            tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={1.75} />,
          }}
        />
      </Tabs>

      {/* Miniplayer Global Flutuante */}
      <MiniFloatingPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});

