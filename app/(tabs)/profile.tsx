import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Pencil,
  Camera,
  Sun,
  Waves,
  Bell,
  MessageCircle,
  FileText,
  Lock,
  Monitor,
  LogOut,
  Trash2,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { useThemeStore } from '../../src/store/themeStore';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { useToast } from '../../src/components/ui/Toast';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { AvatarPickerModal } from '../../src/components/profile/AvatarPickerModal';
import { EditProfileModal } from '../../src/components/profile/EditProfileModal';
import { SecurityAccessModal } from '../../src/components/profile/SecurityAccessModal';
import { SessionsModal } from '../../src/components/profile/SessionsModal';
import { NotificationSettingsModal } from '../../src/components/profile/NotificationSettingsModal';
import { MonthlyReportModal } from '../../src/components/profile/MonthlyReportModal';
import { AppearanceBottomSheet } from '../../src/components/profile/AppearanceBottomSheet';
import { ChatHistoryModal } from '../../src/components/profile/ChatHistoryModal';
import { DeleteAccountModal } from '../../src/components/profile/DeleteAccountModal';
import { userService } from '../../src/services/user/userService';
import { chatService } from '../../src/services/chat/chatService';
import { UserSession } from '../../src/types';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();
  const { colors, isDark } = useTheme();
  const { mode } = useThemeStore();
  const { isDesktop } = useBreakpoint();
  const { showToast } = useToast();

  // Modals state
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Switches
  const [reducedMotion, setReducedMotion] = useState(user?.preferences?.reducedMotion ?? false);
  const [saveChatHistory, setSaveChatHistory] = useState(true);

  // Sessions state (carregadas dinamicamente do serviço)
  const [sessions, setSessions] = useState<UserSession[]>([]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Perfil — Respira';
    }

    // Carregar consentimento de histórico de chat
    chatService.hasRetentionConsent().then(setSaveChatHistory).catch(() => {});

    // Carregar sessões reais
    if (user?.id) {
      userService
        .getActiveSessions(user.id)
        .then((sess: UserSession[]) => {
          if (sess && Array.isArray(sess)) {
            setSessions(sess);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleToggleReducedMotion = async (val: boolean) => {
    setReducedMotion(val);
    if (user?.id) {
      try {
        await userService.updatePreferences(user.id, { reducedMotion: val });
        updateUser({
          preferences: {
            ...user.preferences,
            theme: user.preferences?.theme || 'light',
            dailyReminder: user.preferences?.dailyReminder ?? true,
            reminderTime: user.preferences?.reminderTime || '20:30',
            vibrationEnabled: user.preferences?.vibrationEnabled ?? true,
            soundEnabled: user.preferences?.soundEnabled ?? true,
            countryHelpline: user.preferences?.countryHelpline || 'BR',
            reducedMotion: val,
          },
        });
      } catch {}
    }
  };

  const handleToggleChatRetention = async (val: boolean) => {
    setSaveChatHistory(val);
    await chatService.setRetentionConsent(val);
    if (user?.id) {
      userService.updateConsents(user.id, { chatRetentionAccepted: val }).catch(() => {});
    }
    showToast({
      message: val ? 'Histórico de conversas ativado' : 'Novas conversas não serão salvas',
      type: 'info',
    });
  };

  const handleAvatarChange = async (newAvatarUrl: string | null, file?: Blob | File) => {
    if (!user) return;
    try {
      let finalUrl = newAvatarUrl;
      if (file) {
        finalUrl = await userService.uploadAvatar(user.id, file, 'webp');
      } else if (newAvatarUrl === null) {
        finalUrl = null;
        await userService.updateAvatar(user.id, null);
      }
      await updateUser({ avatarUrl: finalUrl });
      showToast({ message: finalUrl ? 'Foto salva' : 'Foto removida', type: 'success' });
    } catch (err: any) {
      showToast({ message: err.message || 'Não foi possível salvar a foto.', type: 'error' });
      throw err;
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!user) return;
    try {
      const updated = await userService.revokeSession(user.id, sessionId);
      setSessions(updated);
      showToast({ message: 'Sessão desconectada', type: 'success' });
    } catch {
      showToast({ message: 'Erro ao desconectar sessão', type: 'error' });
    }
  };

  const handleRevokeOthers = async () => {
    if (!user) return;
    try {
      const updated = await userService.revokeAllOtherSessions(user.id, 'session-current');
      setSessions(updated);
      showToast({ message: 'Outras sessões encerradas', type: 'success' });
    } catch {
      showToast({ message: 'Erro ao desconectar outras sessões', type: 'error' });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login' as any);
    } catch {
      showToast({ message: 'Erro ao encerrar sessão.', type: 'error' });
    }
  };

  const handleDeleteAccount = async (password: string) => {
    if (!user) return;
    await userService.deleteAccount(user.id, 'EXCLUIR MINHA CONTA', password);
    await logout();
    showToast({ message: 'Conta excluída', type: 'info' });
    router.replace('/(auth)/login' as any);
  };

  const userName = user?.name || 'Nicolas Carvalho';
  const userEmail = user?.email || 'nicolasbdhshdh@gmail.com';
  const userBio = user?.bio || 'Desenvolvedor e estudante de tecnologia.';
  const initials = (userName || 'U')
    .trim()
    .charAt(0)
    .toUpperCase() || 'U';

  const appearanceLabel = mode === 'dark' ? 'Escuro' : 'Claro';

  // Descrição dinâmica real de dispositivos
  const sessionsCountLabel =
    sessions.length <= 1
      ? '1 dispositivo'
      : `${sessions.length} dispositivos`;

  const primaryAccent = isDark ? '#5ECFC3' : '#247B74';
  const successColor = isDark ? '#65D6A6' : '#247B74';
  const dangerColor = isDark ? '#F28B82' : '#C84E45';
  const iconMuted = isDark ? '#E2E8F0' : '#8F9B97';

  return (
    <AppShell>
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        {/* 1. CABEÇALHO */}
        <View style={styles.header}>
          <Text
            accessibilityRole="header"
            aria-level={1}
            style={[styles.pageTitle, { color: isDark ? '#FFFFFF' : '#1F2927' }]}
          >
            Perfil
          </Text>
          <Text style={[styles.pageSubtitle, { color: isDark ? '#F1F5F9' : '#68736F' }]}>
            Sua conta, preferências e privacidade
          </Text>
        </View>

        {/* 2. CARD DO PERFIL */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E5EAE8',
            },
          ]}
        >
          <View style={styles.profileTopRow}>
            {/* Foto Circular com Botão de Câmera Sobreposto */}
            <TouchableOpacity
              onPress={() => setIsAvatarModalOpen(true)}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={`Foto de perfil de ${userName}. Toque para alterar.`}
              style={styles.avatarWrap}
            >
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  accessibilityLabel={`Foto de perfil de ${userName}`}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={[styles.avatarInitials, { backgroundColor: isDark ? '#243330' : '#EDF7F5' }]}>
                  <Text style={[styles.avatarInitialsText, { color: primaryAccent }]}>{initials}</Text>
                </View>
              )}

              {/* Botão de Câmera Sobreposto */}
              <View
                style={[
                  styles.cameraBadge,
                  { backgroundColor: primaryAccent, borderColor: isDark ? colors.surface : '#FFFFFF' },
                ]}
              >
                <Camera size={13} color="#FFFFFF" strokeWidth={2} />
              </View>
            </TouchableOpacity>

            {/* Informações do Usuário */}
            <View style={styles.profileInfoCol}>
              <Text
                accessibilityRole="header"
                aria-level={2}
                style={[styles.profileName, { color: isDark ? '#FFFFFF' : '#1F2927' }]}
                numberOfLines={1}
              >
                {userName}
              </Text>

              <Text
                style={[styles.profileEmail, { color: isDark ? '#E2E8F0' : '#68736F' }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {userEmail}
              </Text>

              <View style={styles.verifiedRow}>
                <CheckCircle2 size={15} color={successColor} strokeWidth={2} style={{ marginRight: 6 }} />
                <Text style={[styles.verifiedText, { color: successColor }]}>E-mail verificado</Text>
              </View>

              {userBio && userBio.trim().length > 0 && (
                <Text
                  style={[styles.profileBio, { color: isDark ? '#F1F5F9' : '#4A5553' }]}
                  numberOfLines={2}
                >
                  {userBio}
                </Text>
              )}
            </View>
          </View>

          {/* Botão Editar Perfil */}
          <TouchableOpacity
            onPress={() => setIsEditProfileOpen(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Editar perfil"
            style={[
              styles.editProfileBtn,
              { borderColor: primaryAccent },
            ]}
          >
            <Pencil size={15} color={primaryAccent} strokeWidth={2} style={{ marginRight: 8 }} />
            <Text style={[styles.editProfileBtnText, { color: primaryAccent }]}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        {/* 3. CARD PREFERÊNCIAS */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E5EAE8',
            },
          ]}
        >
          <Text
            accessibilityRole="header"
            aria-level={3}
            style={[styles.sectionCardTitle, { color: isDark ? '#FFFFFF' : '#1F2927' }]}
          >
            Preferências
          </Text>

          {/* Item: Aparência */}
          <TouchableOpacity
            onPress={() => setIsAppearanceOpen(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Aparência, valor atual: ${appearanceLabel}`}
            style={[styles.cardRow, { borderBottomColor: isDark ? colors.border : '#F0F4F2' }]}
          >
            <View style={styles.rowLeft}>
              <Sun size={20} color={primaryAccent} strokeWidth={1.75} style={styles.rowIcon} />
              <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#1F2927' }]}>
                Aparência
              </Text>
            </View>

            <View style={styles.rowRight}>
              <Text style={[styles.rowValueText, { color: isDark ? '#E2E8F0' : '#68736F' }]}>
                {appearanceLabel}
              </Text>
              <ChevronRight size={18} color={iconMuted} strokeWidth={1.75} />
            </View>
          </TouchableOpacity>

          {/* Item: Reduzir movimento */}
          <View style={[styles.cardRow, { borderBottomColor: isDark ? colors.border : '#F0F4F2' }]}>
            <View style={styles.rowLeft}>
              <Waves size={20} color={primaryAccent} strokeWidth={1.75} style={styles.rowIcon} />
              <View style={styles.rowTextCol}>
                <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#1F2927' }]}>
                  Reduzir movimento
                </Text>
                <Text style={[styles.rowSubtitle, { color: isDark ? '#F1F5F9' : '#68736F' }]}>
                  Limita animações e efeitos de transição
                </Text>
              </View>
            </View>

            <Switch
              value={reducedMotion}
              onValueChange={handleToggleReducedMotion}
              trackColor={{ false: '#DFE4E1', true: primaryAccent }}
              thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
            />
          </View>

          {/* Item: Lembretes */}
          <TouchableOpacity
            onPress={() => setIsNotificationOpen(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Lembretes, horários e frequência"
            style={[styles.cardRow, { borderBottomWidth: 0 }]}
          >
            <View style={styles.rowLeft}>
              <Bell size={20} color={primaryAccent} strokeWidth={1.75} style={styles.rowIcon} />
              <View style={styles.rowTextCol}>
                <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#1F2927' }]}>
                  Lembretes
                </Text>
                <Text style={[styles.rowSubtitle, { color: isDark ? '#F1F5F9' : '#68736F' }]}>
                  Horários e frequência
                </Text>
              </View>
            </View>

            <ChevronRight size={18} color={iconMuted} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>

        {/* 4. CARD PRIVACIDADE E DADOS */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E5EAE8',
            },
          ]}
        >
          <Text
            accessibilityRole="header"
            aria-level={3}
            style={[styles.sectionCardTitle, { color: isDark ? '#FFFFFF' : '#1F2927' }]}
          >
            Privacidade e dados
          </Text>

          {/* Item: Histórico de conversas */}
          <TouchableOpacity
            onPress={() => setIsChatHistoryOpen(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Histórico de conversas, salvar novas conversas"
            style={[styles.cardRow, { borderBottomColor: isDark ? colors.border : '#F0F4F2' }]}
          >
            <View style={styles.rowLeft}>
              <MessageCircle size={20} color={primaryAccent} strokeWidth={1.75} style={styles.rowIcon} />
              <View style={styles.rowTextCol}>
                <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#1F2927' }]}>
                  Histórico de conversas
                </Text>
                <Text style={[styles.rowSubtitle, { color: isDark ? '#F1F5F9' : '#68736F' }]}>
                  Salvar novas conversas
                </Text>
              </View>
            </View>

            <ChevronRight size={18} color={iconMuted} strokeWidth={1.75} />
          </TouchableOpacity>

          {/* Item: Relatório mensal */}
          <TouchableOpacity
            onPress={() => setIsMonthlyReportOpen(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Relatório mensal, gerar resumo em PDF"
            style={[styles.cardRow, { borderBottomWidth: 0 }]}
          >
            <View style={styles.rowLeft}>
              <FileText size={20} color={primaryAccent} strokeWidth={1.75} style={styles.rowIcon} />
              <View style={styles.rowTextCol}>
                <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#1F2927' }]}>
                  Relatório mensal
                </Text>
                <Text style={[styles.rowSubtitle, { color: isDark ? '#F1F5F9' : '#68736F' }]}>
                  Gerar resumo em PDF
                </Text>
              </View>
            </View>

            <ChevronRight size={18} color={iconMuted} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>

        {/* 5. CARD SEGURANÇA */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E5EAE8',
            },
          ]}
        >
          <Text
            accessibilityRole="header"
            aria-level={3}
            style={[styles.sectionCardTitle, { color: isDark ? '#FFFFFF' : '#1F2927' }]}
          >
            Segurança
          </Text>

          {/* Item: Alterar senha */}
          <TouchableOpacity
            onPress={() => setIsSecurityModalOpen(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Alterar senha, proteja sua conta"
            style={[styles.cardRow, { borderBottomColor: isDark ? colors.border : '#F0F4F2' }]}
          >
            <View style={styles.rowLeft}>
              <Lock size={20} color={primaryAccent} strokeWidth={1.75} style={styles.rowIcon} />
              <View style={styles.rowTextCol}>
                <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#1F2927' }]}>
                  Alterar senha
                </Text>
                <Text style={[styles.rowSubtitle, { color: isDark ? '#F1F5F9' : '#68736F' }]}>
                  Proteja sua conta
                </Text>
              </View>
            </View>

            <ChevronRight size={18} color={iconMuted} strokeWidth={1.75} />
          </TouchableOpacity>

          {/* Item: Sessões e dispositivos */}
          <TouchableOpacity
            onPress={() => setIsSessionsModalOpen(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Sessões e dispositivos, ${sessionsCountLabel}`}
            style={[styles.cardRow, { borderBottomWidth: 0 }]}
          >
            <View style={styles.rowLeft}>
              <Monitor size={20} color={primaryAccent} strokeWidth={1.75} style={styles.rowIcon} />
              <View style={styles.rowTextCol}>
                <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#1F2927' }]}>
                  Sessões e dispositivos
                </Text>
                <Text style={[styles.rowSubtitle, { color: isDark ? '#F1F5F9' : '#68736F' }]}>
                  {sessionsCountLabel}
                </Text>
              </View>
            </View>

            <ChevronRight size={18} color={iconMuted} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>

        {/* 6. ZONA DE RISCO: EXCLUIR CONTA */}
        <TouchableOpacity
          onPress={() => setIsDeleteModalOpen(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Excluir conta, exclua permanentemente sua conta e seus dados"
          style={[
            styles.dangerCard,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? '#4A2320' : '#FCE8E6',
            },
          ]}
        >
          <View style={styles.rowLeft}>
            <Trash2 size={20} color={dangerColor} strokeWidth={1.75} style={styles.rowIcon} />
            <View style={styles.rowTextCol}>
              <Text style={[styles.rowTitle, { color: dangerColor }]}>
                Excluir conta
              </Text>
              <Text style={[styles.rowSubtitle, { color: isDark ? '#F1F5F9' : '#D9655B' }]}>
                Exclua permanentemente sua conta e seus dados
              </Text>
            </View>
          </View>

          <ChevronRight size={18} color={dangerColor} strokeWidth={1.75} />
        </TouchableOpacity>

        {/* 7. SAIR DA CONTA */}
        <TouchableOpacity
          onPress={() => setIsLogoutDialogOpen(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
          style={[
            styles.logoutBtn,
            {
              backgroundColor: isDark ? 'transparent' : '#FFFFFF',
              borderColor: isDark ? '#4A2320' : '#F5C6CB',
            },
          ]}
        >
          <LogOut size={17} color={dangerColor} strokeWidth={1.75} style={{ marginRight: 8 }} />
          <Text style={[styles.logoutBtnText, { color: dangerColor }]}>Sair da conta</Text>
        </TouchableOpacity>
      </View>

      {/* Modais & Bottom Sheets */}
      <AvatarPickerModal
        visible={isAvatarModalOpen}
        currentAvatarUrl={user?.avatarUrl}
        userName={userName}
        onClose={() => setIsAvatarModalOpen(false)}
        onSelectAvatar={handleAvatarChange}
      />

      <EditProfileModal
        visible={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

      <AppearanceBottomSheet
        visible={isAppearanceOpen}
        onClose={() => setIsAppearanceOpen(false)}
      />

      <NotificationSettingsModal
        visible={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      <ChatHistoryModal
        visible={isChatHistoryOpen}
        saveHistory={saveChatHistory}
        onClose={() => setIsChatHistoryOpen(false)}
        onToggleSaveHistory={handleToggleChatRetention}
      />

      <MonthlyReportModal
        visible={isMonthlyReportOpen}
        onClose={() => setIsMonthlyReportOpen(false)}
      />

      <SecurityAccessModal
        visible={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        onRevokeOthers={handleRevokeOthers}
      />

      <SessionsModal
        visible={isSessionsModalOpen}
        sessions={sessions}
        onClose={() => setIsSessionsModalOpen(false)}
        onRevokeSession={handleRevokeSession}
        onRevokeOthers={handleRevokeOthers}
      />

      <ConfirmDialog
        visible={isLogoutDialogOpen}
        title="Sair da conta?"
        message="Você precisará entrar novamente para acessar seu perfil."
        confirmTitle="Sair"
        cancelTitle="Continuar conectado"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutDialogOpen(false)}
      />

      <DeleteAccountModal
        visible={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleDeleteAccount}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 80,
  },
  containerDesktop: {
    maxWidth: 640,
    alignSelf: 'center',
  },

  // 1. Cabeçalho
  header: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },

  // 2. Card do Perfil
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarWrap: {
    width: 82,
    height: 82,
    position: 'relative',
  },
  avatarImage: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#EDF7F5',
  },
  avatarInitials: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    fontSize: 28,
    fontWeight: '700',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfoCol: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 4,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '600',
  },
  profileBio: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '400',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
    marginTop: 16,
    width: '100%',
  },
  editProfileBtnText: {
    fontSize: 14.5,
    fontWeight: '600',
  },

  // Cards de Seções (Preferências, Privacidade, Segurança)
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  sectionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    minHeight: 52,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  rowIcon: {
    marginRight: 14,
  },
  rowTextCol: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    lineHeight: 20,
  },
  rowSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValueText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // 6. Danger Card (Excluir Conta)
  dangerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    minHeight: 56,
  },

  // 7. Sair da Conta
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    width: '100%',
    marginBottom: 20,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
