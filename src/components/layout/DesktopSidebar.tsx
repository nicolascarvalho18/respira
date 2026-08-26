import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import {
  Home,
  Compass,
  BookOpen,
  User as UserIcon,
  Sun,
  Moon,
  Wind,
  Bot,
  LifeBuoy,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { AnaAvatar } from '../illustrations/AnaAvatar';

export const DesktopSidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user } = useAuth();

  const navItems = [
    {
      label: 'Diário & Início',
      route: '/(tabs)',
      icon: Home,
      isActive: pathname === '/' || pathname === '/(tabs)' || pathname === '/diary' || pathname === '/(tabs)/index',
    },
    {
      label: 'Práticas',
      route: '/(tabs)/practices',
      icon: Wind,
      isActive: pathname.includes('/practices'),
    },
    {
      label: 'Conteúdos',
      route: '/(tabs)/content',
      icon: BookOpen,
      isActive: pathname.includes('/content') || pathname.includes('/contents'),
    },
    {
      label: 'Assistente IA',
      route: '/chat',
      icon: Bot,
      isActive: pathname.includes('/chat'),
    },
    {
      label: 'Apoio Imediato',
      route: '/support',
      icon: LifeBuoy,
      isActive: pathname.includes('/support'),
    },
    {
      label: 'Perfil & Ajustes',
      route: '/(tabs)/profile',
      icon: UserIcon,
      isActive: pathname.includes('/profile'),
    },
  ];

  return (
    <View
      aria-label="Navegação principal"
      {...(Platform.OS === 'web' ? ({ role: 'navigation' } as any) : {})}
      style={[
        styles.sidebar,
        {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderRightColor: colors.border,
        },
      ]}
    >
      {/* 1. Logotipo e Marca */}
      <View>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)')}
          accessibilityRole="link"
          accessibilityLabel="Respira - Página Inicial"
          style={styles.brandRow}
        >
          <View style={[styles.logoIconCircle, { backgroundColor: '#2F7F7C' }]}>
            <Wind size={22} color="#FFFFFF" />
          </View>
          <View>
            <Text style={[styles.brandTitle, { color: isDark ? colors.text : '#173D3B' }]}>
              Respira
            </Text>
            <Text style={[styles.brandSubtitle, { color: isDark ? colors.textMuted : '#667775' }]}>
              Acolhimento e calma
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 2. Lista de Navegação */}
      <View style={styles.navList}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <TouchableOpacity
              key={item.route}
              onPress={() => router.push(item.route as any)}
              accessibilityRole="link"
              accessibilityLabel={item.label}
              aria-current={active ? 'page' : undefined}
              style={[
                styles.navItem,
                {
                  backgroundColor: active
                    ? isDark
                      ? colors.surfaceSecondary
                      : colors.highlight
                    : 'transparent',
                },
                Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined,
              ]}
            >
              <Icon
                size={20}
                color={active ? colors.primary : colors.textMuted}
                strokeWidth={active ? 2.4 : 1.8}
              />
              <Text
                style={[
                  styles.navLabel,
                  {
                    color: active ? colors.primary : colors.text,
                    fontWeight: active ? '700' : '500',
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Rodapé da Sidebar: Perfil do Usuário e Alternador de Tema */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.userRow}>
          <View style={{ marginRight: 10 }}>
            <AnaAvatar
              size={38}
              avatarUrl={user?.avatarUrl}
              name={user?.name || 'Ana'}
            />
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
              {user?.name || 'Ana'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textMuted }]} numberOfLines={1}>
              {user?.email || 'ana@exemplo.com'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={toggleTheme}
            accessibilityRole="switch"
            accessibilityState={{ checked: isDark }}
            accessibilityLabel={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
            {...(Platform.OS === 'web' ? ({ type: 'button' } as any) : {})}
            style={[styles.themeBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            {isDark ? <Sun size={18} color="#E2A740" /> : <Moon size={18} color={colors.primary} />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 270,
    height: '100%',
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 20,
    borderRightWidth: 1.5,
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
    paddingHorizontal: 6,
  },
  logoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2F7F7C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  navList: {
    flex: 1,
    gap: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 12,
  },
  navLabel: {
    fontSize: 14,
    letterSpacing: -0.1,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 11,
    marginTop: 1,
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
