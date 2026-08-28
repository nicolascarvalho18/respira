import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Pencil,
  Sun,
  Waves,
  Bell,
  MessageCircle,
  FileText,
  KeyRound,
  MonitorSmartphone,
  LogOut,
  Trash2,
  ChevronRight,
  CircleCheck,
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

  const handleAvatarChange = async (newAvatarUrl: string | null) => {
    if (!user) return;
    try {
      const updated = await userService.updateAvatar(user.id, newAvatarUrl);
      updateUser({ avatarUrl: updated.avatarUrl });
      showToast({ message: 'Foto de perfil atualizada com sucesso', type: 'success' });
    } catch {
      showToast({ message: 'Erro ao atualizar foto de perfil', type: 'error' });
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!user) return;
    try {
      const updated = await userService.revokeSession(user.id, sessionId);
      setSessions(updated);
      showToast({ message: 'Sessão desconectada com sucesso', type: 'success' });
    } catch {
      showToast({ message: 'Erro ao desconectar sessão', type: 'error' });
    }
  };

  const handleRevokeOthers = async () => {
    if (!user) return;
    try {
      const updated = await userService.revokeAllOtherSessions(user.id, 'session-current');
      setSessions(updated);
      showToast({ message: 'Outras sessões foram desconectadas', type: 'success' });
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
    showToast({ message: 'Conta excluída permanentemente.', type: 'info' });
    router.replace('/(auth)/login' as any);
  };

  const userName = user?.name || 'Nicolas';
  const userEmail = user?.email || 'nicolasbdhshdh@gmail.com';
  const userBio = user?.bio;
  const initials = userName
    .trim()
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const appearanceLabel = mode === 'dark' ? 'Escuro' : 'Claro';

  // Descrição dinâmica real de dispositivos
  const sessionsCountLabel =
    sessions.length === 0
      ? 'Nenhum outro dispositivo conectado'
      : sessions.length === 1
      ? '1 dispositivo conectado'
      : `${sessions.length} dispositivos conectados`;

  return (
    <AppShell>
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        {/* Cabeçalho da Página */}
        <View style={styles.header}>
          <Text
            accessibilityRole="header"
            aria-level={1}
            style={[styles.pageTitle, { color: isDark ? colors.text : '#1F2927' }]}
          >
            Perfil
          </Text>
          <Text style={[styles.pageSubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
            Conta, preferências e privacidade
          </Text>
        </View>

        {/* Área do Usuário */}
        <View style={styles.userArea}>
          {/* Foto à esquerda com ação abaixo */}
          <View style={styles.avatarColumn}>
            <TouchableOpacity
              onPress={() => setIsAvatarModalOpen(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Foto de perfil de ${userName}. Clique para alterar.`}
              style={styles.avatarWrapper}
            >
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  accessibilityLabel={`Foto de perfil de ${userName}`}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={[styles.avatarInitials, { backgroundColor: isDark ? '#1C3833' : '#EDF7F5' }]}>
                  <Text style={styles.avatarInitialsText}>{initials}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsAvatarModalOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Alterar foto de perfil"
              style={styles.changePhotoBtn}
            >
              <Text style={styles.changePhotoText}>Alterar foto</Text>
            </TouchableOpacity>
          </View>

          {/* Nome, biografia, e-mail e status no centro */}
          <View style={styles.userInfoColumn}>
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={[styles.userName, { color: isDark ? colors.text : '#1F2927' }]}
            >
              {userName}
            </Text>

            {userBio && userBio.trim().length > 0 && (
              <Text
                style={[styles.userBio, { color: isDark ? colors.textMuted : '#68736F' }]}
                numberOfLines={3}
              >
                {userBio}
              </Text>
            )}

            <Text style={[styles.userEmail, { color: isDark ? colors.textMuted : '#68736F' }]}>
              {userEmail}
            </Text>

            <View style={styles.verifiedRow}>
              <CircleCheck size={16} color="#247B74" strokeWidth={1.75} style={{ marginRight: 6 }} />
              <Text style={styles.verifiedText}>E-mail verificado</Text>
            </View>
          </View>

          {/* Botão Editar à direita */}
          <TouchableOpacity
            onPress={() => setIsEditProfileOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Editar perfil completo"
            style={[
              styles.editProfileBtn,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: isDark ? colors.border : '#E0E5E2',
              },
            ]}
          >
            <Pencil size={16} color="#247B74" strokeWidth={1.75} style={{ marginRight: 6 }} />
            <Text style={styles.editProfileBtnText}>Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Divisor Horizontal após o cabeçalho */}
        <View style={[styles.sectionDivider, { backgroundColor: isDark ? colors.border : '#E7EBE9' }]} />

        {/* SEÇÃO 1: Preferências */}
        <View style={styles.sectionBlock}>
          <Text
            accessibilityRole="header"
            aria-level={3}
            style={[styles.sectionTitle, { color: isDark ? colors.text : '#1F2927' }]}
          >
            Preferências
          </Text>

          {/* Linha: Aparência */}
          <TouchableOpacity
            onPress={() => setIsAppearanceOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Aparência, atual: ${appearanceLabel}`}
            style={[styles.settingRow, { borderBottomColor: isDark ? colors.border : '#E7EBE9' }]}
          >
            <View style={styles.rowLeft}>
              <Sun size={20} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} style={styles.rowIcon} />
              <Text style={[styles.rowTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                Aparência
              </Text>
            </View>

            <View style={styles.rowRight}>
              <Text style={[styles.rowValueText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                {appearanceLabel}
              </Text>
              <ChevronRight size={20} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} />
            </View>
          </TouchableOpacity>

          {/* Linha: Reduzir movimento */}
          <View style={[styles.settingRow, { borderBottomColor: isDark ? colors.border : '#E7EBE9' }]}>
            <View style={styles.rowLeft}>
              <Waves size={20} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} style={styles.rowIcon} />
              <View style={styles.rowTextWrap}>
                <Text style={[styles.rowTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Reduzir movimento
                </Text>
                <Text style={[styles.rowSubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  Limita animações e efeitos de transição
                </Text>
              </View>
            </View>

            <Switch
              value={reducedMotion}
              onValueChange={handleToggleReducedMotion}
              trackColor={{ false: '#DFE4E1', true: '#247B74' }}
              thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
            />
          </View>

          {/* Linha: Lembretes */}
          <TouchableOpacity
            onPress={() => setIsNotificationOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Lembretes, horários e frequência"
            style={styles.settingRow}
          >
            <View style={styles.rowLeft}>
              <Bell size={20} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} style={styles.rowIcon} />
              <View style={styles.rowTextWrap}>
                <Text style={[styles.rowTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Lembretes
                </Text>
                <Text style={[styles.rowSubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  Horários e frequência
                </Text>
              </View>
            </View>

            <ChevronRight size={20} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>

        {/* Divisor de Seção */}
        <View style={[styles.sectionDivider, { backgroundColor: isDark ? colors.border : '#E7EBE9' }]} />

        {/* SEÇÃO 2: Privacidade e dados */}
        <View style={styles.sectionBlock}>
          <Text
            accessibilityRole="header"
            aria-level={3}
            style={[styles.sectionTitle, { color: isDark ? colors.text : '#1F2927' }]}
          >
            Privacidade e dados
          </Text>

          {/* Histórico de conversas */}
          <TouchableOpacity
            onPress={() => setIsChatHistoryOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Histórico de conversas, salvar novas conversas"
            style={[styles.settingRow, { borderBottomColor: isDark ? colors.border : '#E7EBE9' }]}
          >
            <View style={styles.rowLeft}>
              <MessageCircle size={20} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} style={styles.rowIcon} />
              <View style={styles.rowTextWrap}>
                <Text style={[styles.rowTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Histórico de conversas
                </Text>
                <Text style={[styles.rowSubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  Salvar novas conversas
                </Text>
              </View>
            </View>

            <ChevronRight size={20} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} />
          </TouchableOpacity>

          {/* Relatório mensal */}
          <TouchableOpacity
            onPress={() => setIsMonthlyReportOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Relatório mensal, gerar um resumo em PDF"
            style={styles.settingRow}
          >
            <View style={styles.rowLeft}>
              <FileText size={20} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} style={styles.rowIcon} />
              <View style={styles.rowTextWrap}>
                <Text style={[styles.rowTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Relatório mensal
                </Text>
                <Text style={[styles.rowSubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  Gerar um resumo em PDF
                </Text>
              </View>
            </View>

            <ChevronRight size={20} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>

        {/* Divisor de Seção */}
        <View style={[styles.sectionDivider, { backgroundColor: isDark ? colors.border : '#E7EBE9' }]} />

        {/* SEÇÃO 3: Segurança */}
        <View style={styles.sectionBlock}>
          <Text
            accessibilityRole="header"
            aria-level={3}
            style={[styles.sectionTitle, { color: isDark ? colors.text : '#1F2927' }]}
          >
            Segurança
          </Text>

          {/* Senha e acesso */}
          <TouchableOpacity
            onPress={() => setIsSecurityModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Senha e acesso, e-mail, senha e autenticação"
            style={styles.settingRow}
          >
            <View style={styles.rowLeft}>
              <KeyRound size={20} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} style={styles.rowIcon} />
              <View style={styles.rowTextWrap}>
                <Text style={[styles.rowTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Senha e acesso
                </Text>
                <Text style={[styles.rowSubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  E-mail, senha e autenticação
                </Text>
              </View>
            </View>

            <ChevronRight size={20} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>

        {/* Divisor de Seção */}
        <View style={[styles.sectionDivider, { backgroundColor: isDark ? colors.border : '#E7EBE9' }]} />

        {/* SEÇÃO 4: Dispositivos */}
        <View style={styles.sectionBlock}>
          <Text
            accessibilityRole="header"
            aria-level={3}
            style={[styles.sectionTitle, { color: isDark ? colors.text : '#1F2927' }]}
          >
            Dispositivos
          </Text>

          {/* Sessões ativas */}
          <TouchableOpacity
            onPress={() => setIsSessionsModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Sessões ativas, ${sessionsCountLabel}`}
            style={styles.settingRow}
          >
            <View style={styles.rowLeft}>
              <MonitorSmartphone size={20} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} style={styles.rowIcon} />
              <View style={styles.rowTextWrap}>
                <Text style={[styles.rowTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Sessões ativas
                </Text>
                <Text style={[styles.rowSubtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  {sessionsCountLabel}
                </Text>
              </View>
            </View>

            <ChevronRight size={20} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>

        {/* Divisor de Seção */}
        <View style={[styles.sectionDivider, { backgroundColor: isDark ? colors.border : '#E7EBE9' }]} />

        {/* SEÇÃO 5: Conta */}
        <View style={styles.sectionBlock}>
          <Text
            accessibilityRole="header"
            aria-level={3}
            style={[styles.sectionTitle, { color: isDark ? colors.text : '#1F2927' }]}
          >
            Conta
          </Text>

          {/* Sair */}
          <TouchableOpacity
            onPress={() => setIsLogoutDialogOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
            style={[styles.settingRow, { borderBottomColor: isDark ? colors.border : '#E7EBE9' }]}
          >
            <View style={styles.rowLeft}>
              <LogOut size={20} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} style={styles.rowIcon} />
              <Text style={[styles.rowTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                Sair
              </Text>
            </View>

            <ChevronRight size={20} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} />
          </TouchableOpacity>

          {/* Excluir conta */}
          <TouchableOpacity
            onPress={() => setIsDeleteModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Excluir conta, exclui permanentemente a conta e os dados"
            style={styles.settingRow}
          >
            <View style={styles.rowLeft}>
              <Trash2 size={20} color="#C84E45" strokeWidth={1.75} style={styles.rowIcon} />
              <View style={styles.rowTextWrap}>
                <Text style={[styles.rowTitle, { color: '#C84E45' }]}>
                  Excluir conta
                </Text>
                <Text style={[styles.rowSubtitle, { color: '#C84E45' }]}>
                  Exclui permanentemente a conta e os dados
                </Text>
              </View>
            </View>

            <ChevronRight size={20} color="#C84E45" strokeWidth={1.75} />
          </TouchableOpacity>
        </View>
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
        title="Encerrar sessão"
        message="Tem certeza de que deseja sair da sua conta neste dispositivo?"
        confirmTitle="Sair"
        cancelTitle="Cancelar"
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
    paddingTop: 12,
    paddingBottom: 48,
  },
  containerDesktop: {
    maxWidth: 760,
    alignSelf: 'center',
  },

  // Cabeçalho da Página
  header: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },

  // Área do Usuário
  userArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarColumn: {
    alignItems: 'center',
    marginRight: 16,
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    marginBottom: 6,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarInitials: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#247B74',
  },
  changePhotoBtn: {
    paddingVertical: 2,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#247B74',
  },
  userInfoColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  userBio: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 6,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#247B74',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  editProfileBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#247B74',
  },

  // Divisores
  sectionDivider: {
    width: '100%',
    height: 1,
    marginVertical: 14,
  },

  // Seções
  sectionBlock: {
    width: '100%',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 4,
  },

  // Linhas de Configuração
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  rowIcon: {
    marginRight: 16,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  rowSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValueText: {
    fontSize: 14,
    marginRight: 6,
  },
});
