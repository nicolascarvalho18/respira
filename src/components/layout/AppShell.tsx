import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ViewStyle,
  Platform,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useAuth } from '../../hooks/useAuth';
import { LoadingState } from '../ui/LoadingState';
import { DesktopSidebar } from './DesktopSidebar';
import { MiniFloatingPlayer } from '../soundscape/MiniFloatingPlayer';

export interface AppShellProps {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
  scrollable?: boolean;
  withSafeArea?: boolean;
  requireAuth?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  rightPanel,
  scrollable = true,
  withSafeArea = true,
  requireAuth = true,
  style,
  contentContainerStyle,
}) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isDesktop, isTablet } = useBreakpoint();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!requireAuth || isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace('/(auth)/login');
      return;
    }
  }, [requireAuth, isLoading, isAuthenticated, user, router]);

  if (requireAuth && !user && isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingState message="Acessando seu espaço..." />
      </View>
    );
  }

  const ContainerComponent = withSafeArea ? SafeAreaView : View;

  return (
    <ContainerComponent
      style={[
        styles.root,
        { backgroundColor: colors.background },
        Platform.OS === 'web' ? ({ overflowX: 'hidden' } as any) : undefined,
        style,
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Skip Link para acessibilidade no Web */}
      {Platform.OS === 'web' && (
        <TouchableOpacity
          onPress={() => {
            if (typeof document !== 'undefined') {
              const mainEl = document.getElementById('conteudo-principal');
              if (mainEl) {
                mainEl.focus();
                mainEl.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }}
          accessibilityRole="link"
          accessibilityLabel="Pular para o conteúdo principal"
          style={styles.skipLink}
        >
          <Text style={styles.skipLinkText}>Pular para o conteúdo</Text>
        </TouchableOpacity>
      )}

      <View style={styles.layoutRow}>
        {/* Sidebar fixa à esquerda (no Desktop >= 1024px) */}
        {isDesktop && <DesktopSidebar />}

        {/* Área Central de Conteúdo com Main Semântico */}
        <View
          style={styles.mainArea}
          {...(Platform.OS === 'web'
            ? ({ id: 'conteudo-principal', role: 'main', tabIndex: -1 } as any)
            : {})}
        >
          {scrollable ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollContainer,
                isTablet && styles.scrollContainerTablet,
                isDesktop && styles.scrollContainerDesktop,
                contentContainerStyle,
              ]}
              style={styles.scrollView}
            >
              <View
                style={[
                  styles.contentInner,
                  isTablet && styles.contentInnerTablet,
                  isDesktop && styles.contentInnerDesktop,
                ]}
              >
                {children}
              </View>
            </ScrollView>
          ) : (
            <View
              style={[
                styles.fixedContainer,
                isTablet && styles.fixedContainerTablet,
                isDesktop && styles.fixedContainerDesktop,
                contentContainerStyle,
              ]}
            >
              {children}
            </View>
          )}
        </View>

        {/* Painel Lateral Direito Opcional */}
        {isDesktop && rightPanel && (
          <View
            style={[
              styles.rightPanel,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderLeftColor: colors.border,
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.rightPanelInner}>
              {rightPanel}
            </ScrollView>
          </View>
        )}
        {/* Mini Floating Player Global */}
        <MiniFloatingPlayer />
      </View>
    </ContainerComponent>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  skipLink: {
    position: 'absolute',
    top: -100,
    left: 16,
    zIndex: 9999,
    backgroundColor: '#2F7F7C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  skipLinkText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  layoutRow: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    width: '100%',
  },
  mainArea: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    outlineStyle: 'none',
  } as any,
  scrollView: {
    width: '100%',
    height: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 96,
    width: '100%',
    alignItems: 'center',
  },
  scrollContainerTablet: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 64,
  },
  scrollContainerDesktop: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 64,
  },
  contentInner: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  contentInnerTablet: {
    maxWidth: 660,
    alignSelf: 'center',
  },
  contentInnerDesktop: {
    maxWidth: 700,
    alignSelf: 'center',
  },
  fixedContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 96,
    alignItems: 'center',
  },
  fixedContainerTablet: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 64,
    maxWidth: 660,
    alignSelf: 'center',
  },
  fixedContainerDesktop: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 64,
    maxWidth: 700,
    alignSelf: 'center',
  },
  rightPanel: {
    width: 300,
    height: '100%',
    borderLeftWidth: 1.5,
  },
  rightPanelInner: {
    padding: 20,
  },
});
