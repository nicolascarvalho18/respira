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
  BookOpen,
  Wind,
  Library,
  Bot,
  HeartHandshake,
  User as UserIcon,
  ShieldCheck,
  Moon,
  Sun,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useThemeStore } from '../../store/themeStore';

export const DesktopSidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { toggleTheme } = useThemeStore();

  const navItems = [
    { label: 'Início', route: '/(tabs)', icon: Home },
    { label: 'Diário de Humor', route: '/(tabs)/diary', icon: BookOpen },
    { label: 'Práticas', route: '/(tabs)/practices', icon: Wind },
    { label: 'Conteúdos', route: '/(tabs)/content', icon: Library },
    { label: 'Assistente IA', route: '/chat', icon: Bot },
    { label: 'Apoio Imediato', route: '/support', icon: HeartHandshake },
    { label: 'Perfil', route: '/(tabs)/profile', icon: UserIcon },
  ];

  if (user?.role === 'admin') {
    navItems.push({ label: 'Administração', route: '/admin', icon: ShieldCheck });
  }

  const isActiveRoute = (route: string) => {
    if (route === '/(tabs)' && (pathname === '/' || pathname === '/(tabs)' || pathname === '')) return true;
    return pathname.includes(route.replace('/(tabs)', ''));
  };

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderRightColor: colors.border,
        },
      ]}
    >
      {/* Logo e Nome da Marca */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/(tabs)')}
        style={styles.brandRow}
      >
        <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
          <Wind size={20} color="#FFFFFF" />
        </View>
        <View>
          <Text style={[styles.brandTitle, { color: colors.text }]}>Respira</Text>
          <Text style={[styles.brandSubtitle, { color: colors.primary }]}>Saúde & Bem-estar</Text>
        </View>
      </TouchableOpacity>

      {/* Atalho Rápido de Emergência / Respiração */}
      <TouchableOpacity
        onPress={() => router.push('/practices/breathing')}
        activeOpacity={0.85}
        style={[styles.quickPanicBtn, { backgroundColor: colors.highlight, borderColor: colors.primary }]}
      >
        <Wind size={18} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={[styles.quickPanicText, { color: colors.primaryDark }]}>
          Pausa para Respirar
        </Text>
      </TouchableOpacity>

      {/* Lista de Navegação Principal */}
      <View style={styles.navSection}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActiveRoute(item.route);

          return (
            <TouchableOpacity
              key={item.route}
              activeOpacity={0.7}
              onPress={() => router.push(item.route as any)}
              accessibilityRole="link"
              accessibilityLabel={item.label}
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

      {/* Rodapé da Sidebar: Perfil do Usuário e Alternador de Tema */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.userRow}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </Text>
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
            accessibilityLabel="Alternar tema claro/escuro"
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
    marginBottom: 20,
    gap: 12,
  },
  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickPanicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  quickPanicText: {
    fontSize: 13,
    fontWeight: '700',
  },
  navSection: {
    flex: 1,
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 12,
  },
  navLabel: {
    fontSize: 14,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 12,
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
