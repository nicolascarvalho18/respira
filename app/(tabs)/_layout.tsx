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
          tabBarInactiveTintColor: isDark ? '#E2E8F0' : '#68736F',
          tabBarStyle: {
            display: isDesktop ? 'none' : 'flex',
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderTopColor: isDark ? colors.border : '#DCE2DF',
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 84 : 60,
            paddingBottom: Platform.OS === 'ios' ? 22 : 8,
            paddingTop: 8,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarLabelStyle: {
            fontSize: 11.5,
            fontWeight: '500',
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

