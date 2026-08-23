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
          tabBarActiveTintColor: '#2F7F7C',
          tabBarInactiveTintColor: '#8C9E9B',
          tabBarStyle: {
            display: isDesktop ? 'none' : 'flex',
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderTopColor: isDark ? colors.border : '#DCE5E2',
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 84 : 62,
            paddingBottom: Platform.OS === 'ios' ? 24 : 8,
            paddingTop: 6,
            elevation: 6,
            shadowColor: '#173D3B',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: -2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Início',
            tabBarLabel: 'Início',
            tabBarIcon: ({ color }) => <Home size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="diary"
          options={{
            title: 'Diário',
            tabBarLabel: 'Diário',
            tabBarIcon: ({ color }) => <BookOpen size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="practices"
          options={{
            title: 'Práticas',
            tabBarLabel: 'Práticas',
            tabBarIcon: ({ color }) => <Wind size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="content"
          options={{
            title: 'Conteúdos',
            tabBarLabel: 'Conteúdos',
            tabBarIcon: ({ color }) => <Library size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarLabel: 'Perfil',
            tabBarIcon: ({ color }) => <User size={22} color={color} />,
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
