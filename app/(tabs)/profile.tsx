import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Sun,
  Moon,
  Waves,
  Bell,
  ShieldCheck,
  FileDown,
  KeyRound,
  LogOut,
  Trash2,
  Laptop,
  CheckCircle2,
  ChevronRight,
  Pencil,
  Image as ImageIcon,
  User as UserIcon,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { useThemeStore } from '../../src/store/themeStore';
import { useToast } from '../../src/components/ui/Toast';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { AnaAvatar } from '../../src/components/illustrations/AnaAvatar';
import { AvatarPickerModal } from '../../src/components/profile/AvatarPickerModal';
import { EditProfileModal } from '../../src/components/profile/EditProfileModal';
import { DataExportModal } from '../../src/components/profile/DataExportModal';
import { SecurityAccessModal } from '../../src/components/profile/SecurityAccessModal';
import { SessionsModal } from '../../src/components/profile/SessionsModal';
import { NotificationSettingsModal } from '../../src/components/profile/NotificationSettingsModal';
import { MonthlyReportModal } from '../../src/components/profile/MonthlyReportModal';
import { userService } from '../../src/services/user/userService';
import { UserSession } from '../../src/types';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();
  const { colors, isDark } = useTheme();
  const { mode, setThemeMode } = useThemeStore();
  const { showToast } = useToast();

  // Modals state
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isDataExportOpen, setIsDataExportOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);

  // Logout & Delete account state
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Preference switches
  const [reduceMotion, setReduceMotion] = useState(false);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [saveAiHistory, setSaveAiHistory] = useState(true);

  // Sessions state
  const [sessions, setSessions] = useState<UserSession[]>([
    {
      id: 'sess-current',
      userId: user?.id || 'user-demo-1',
      deviceType: 'desktop',
      browser: 'Chrome 124',
      os: 'Windows 11',
      lastActiveAt: new Date().toISOString(),
      isCurrent: true,
      ipAddressMasked: '189.40.***.***',
    },
  ]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Perfil & Ajustes — Respira';
    }

    if (user?.id) {
      userService
        .getActiveSessions(user.id)
        .then((sess: UserSession[]) => {
          if (sess && sess.length > 0) {
            setSessions(sess);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleAvatarChange = async (newAvatarUrl: string | null) => {
    if (!user) return;
    try {
      const updated = await userService.updateProfile(user.id, {
        avatarUrl: newAvatarUrl || undefined,
      });
      await updateUser({ avatarUrl: updated.avatarUrl });
      showToast({ message: 'Avatar atualizado com sucesso.', type: 'success' });
    } catch {
      showToast({ message: 'Erro ao atualizar avatar.', type: 'error' });
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!user) return;
    try {
      await userService.revokeSession(user.id, sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      showToast({ message: 'Sessão desconectada com sucesso.', type: 'success' });
    } catch {
      showToast({ message: 'Erro ao desconectar sessão.', type: 'error' });
    }
  };

  const handleRevokeOthers = async () => {
    if (!user) return;
    try {
      await userService.revokeAllOtherSessions(user.id, 'sess-current');
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      showToast({ message: 'Outras sessões foram desconectadas.', type: 'success' });
    } catch {
      showToast({ message: 'Erro ao desconectar outras sessões.', type: 'error' });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsLogoutDialogOpen(false);
      router.replace('/(auth)/login');
    } catch {
      showToast({ message: 'Erro ao sair da conta.', type: 'error' });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== 'EXCLUIR MINHA CONTA') {
      showToast({ message: 'Digite a frase exata para confirmar a exclusão.', type: 'error' });
      return;
    }

    if (!user) return;

    try {
      setIsDeleting(true);
      await userService.deleteAccount(user.id, 'user-password', deleteConfirmText);
      await logout();
      setIsDeleteDialogOpen(false);
      showToast({ message: 'Conta excluída permanentemente.', type: 'info' });
      router.replace('/(auth)/login');
    } catch (err: any) {
      showToast({ message: err.message || 'Erro ao excluir conta.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell>
      {/* 1. Cabeçalho */}
      <View style={styles.header}>
        <Text
          accessibilityRole="header"
          aria-level={1}
          style={[styles.title, { color: isDark ? colors.text : '#173D3B' }]}
        >
          Perfil
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? colors.textMuted : '#667775' }]}>
          Conta, preferências e privacidade
        </Text>
      </View>

      {/* 2. Card de Dados do Usuário */}
      <View
        style={[
          styles.userProfileCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#DCE5E2',
          },
        ]}
      >
        <View style={styles.userTopRow}>
          {/* Avatar dinâmico com botão lápis sobreposto */}
          <View style={styles.avatarWrap}>
            <AnaAvatar
              size={64}
              avatarUrl={user?.avatarUrl}
              name={user?.name || 'Ana'}
            />
            <TouchableOpacity
              onPress={() => setIsAvatarModalOpen(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Alterar avatar"
              style={styles.pencilOverlayBtn}
            >
              <Pencil size={11} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Dados do usuário */}
          <View style={styles.userDetailsCol}>
            <Text style={[styles.userName, { color: isDark ? colors.text : '#173D3B' }]}>
              {user?.name || 'Ana'}
            </Text>
            <Text style={[styles.userEmail, { color: isDark ? colors.textMuted : '#667775' }]}>
              {user?.email || 'ana@exemplo.com'}
            </Text>

            {/* Badge Verificado */}
            <View
              style={[
                styles.verifiedBadge,
                { backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF' },
              ]}
            >
              <CheckCircle2 size={12} color="#2F7F7C" />
              <Text style={styles.verifiedBadgeText}>Verificado</Text>
            </View>
          </View>
        </View>

        {/* Linha de Ações Inferior: Alterar Avatar & Editar Perfil */}
        <View
          style={[
            styles.userActionsRow,
            { borderTopColor: isDark ? colors.border : '#F0F5F3' },
          ]}
        >
          <TouchableOpacity
            onPress={() => setIsAvatarModalOpen(true)}
            style={styles.userActionBtn}
            accessibilityRole="button"
            accessibilityLabel="Alterar avatar"
          >
            <ImageIcon size={14} color="#2F7F7C" style={{ marginRight: 6 }} />
            <Text style={styles.userActionBtnText}>Alterar avatar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsEditProfileOpen(true)}
            style={styles.userActionBtn}
            accessibilityRole="button"
            accessibilityLabel="Editar perfil"
          >
            <Text style={styles.editProfileBtnText}>Editar perfil</Text>
            <ChevronRight size={14} color="#2F7F7C" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Seção "Preferências" */}
      <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#173D3B' }]}>
        Preferências
      </Text>
      <View
        style={[
          styles.groupedCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#DCE5E2',
          },
        ]}
      >
        {/* Linha 1: Aparência */}
        <View style={styles.itemRow}>
          <View style={styles.itemIconCircle}>
            <Sun size={18} color="#2F7F7C" />
          </View>
          <View style={styles.itemTextCol}>
            <Text style={[styles.itemTitle, { color: isDark ? colors.text : '#173D3B' }]}>
              Aparência
            </Text>
            <Text style={[styles.itemSubtitle, { color: isDark ? colors.textMuted : '#667775' }]}>
              Escolha o tema da aplicação.
            </Text>
          </View>

          {/* Toggle Segmentado: Claro / Escuro */}
          <View
            style={[
              styles.themeToggleBox,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F2F6F5',
                borderColor: isDark ? colors.border : '#DCE5E2',
              },
            ]}
            aria-label="Controle de tema visual"
            {...(Platform.OS === 'web' ? ({ role: 'group' } as any) : {})}
          >
            <TouchableOpacity
              onPress={() => {
                setThemeMode('light');
                showToast({ message: 'Tema claro ativado.', type: 'info' });
              }}
              accessibilityRole="button"
              accessibilityLabel="Ativar tema claro"
              aria-pressed={mode === 'light'}
              accessibilityState={{ selected: mode === 'light' }}
              {...(Platform.OS === 'web' ? ({ type: 'button' } as any) : {})}
              style={[
                styles.themeBtn,
                mode === 'light' && [
                  styles.themeBtnActive,
                  { backgroundColor: isDark ? colors.surface : '#2F7F7C' },
                ],
              ]}
            >
              <Sun
                size={13}
                color={mode === 'light' ? '#FFFFFF' : '#667775'}
                style={{ marginRight: 4 }}
                aria-hidden={true}
              />
              <Text
                style={[
                  styles.themeBtnText,
                  { color: mode === 'light' ? '#FFFFFF' : '#667775', fontWeight: mode === 'light' ? '700' : '500' },
                ]}
              >
                Claro
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setThemeMode('dark');
                showToast({ message: 'Tema escuro ativado.', type: 'info' });
              }}
              accessibilityRole="button"
              accessibilityLabel="Ativar tema escuro"
              aria-pressed={mode === 'dark'}
              accessibilityState={{ selected: mode === 'dark' }}
              {...(Platform.OS === 'web' ? ({ type: 'button' } as any) : {})}
              style={[
                styles.themeBtn,
                mode === 'dark' && [
                  styles.themeBtnActive,
                  { backgroundColor: isDark ? '#2F7F7C' : '#173D3B' },
                ],
              ]}
            >
              <Moon
                size={13}
                color={mode === 'dark' ? '#FFFFFF' : '#667775'}
                style={{ marginRight: 4 }}
                aria-hidden={true}
              />
              <Text
                style={[
                  styles.themeBtnText,
                  { color: mode === 'dark' ? '#FFFFFF' : '#667775', fontWeight: mode === 'dark' ? '700' : '500' },
                ]}
              >
                Escuro
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.rowDivider, { backgroundColor: isDark ? colors.border : '#F0F5F3' }]} />

        {/* Linha 2: Reduzir movimento */}
        <View style={styles.itemRow}>
          <View style={styles.itemIconCircle}>
            <Waves size={18} color="#2F7F7C" />
          </View>
          <View style={styles.itemTextCol}>
            <Text style={[styles.itemTitle, { color: isDark ? colors.text : '#173D3B' }]}>
              Reduzir movimento
            </Text>
            <Text style={[styles.itemSubtitle, { color: isDark ? colors.textMuted : '#667775' }]}>
              Substitui animações por transições estáticas suaves.
            </Text>
          </View>
          <Switch
            value={reduceMotion}
            onValueChange={async (val) => {
              setReduceMotion(val);
              if (user?.id) {
                try {
                  await userService.updatePreferences(user.id, { reducedMotion: val });
                  showToast({ message: 'Alterações salvas.', type: 'success' });
                } catch {
                  showToast({ message: 'Não foi possível salvar. Tente novamente.', type: 'error' });
                }
              }
            }}
            trackColor={{ false: '#DCE5E2', true: '#2F7F7C' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.rowDivider, { backgroundColor: isDark ? colors.border : '#F0F5F3' }]} />

        {/* Linha 3: Lembretes e horários */}
        <TouchableOpacity
          onPress={() => setIsNotificationModalOpen(true)}
          activeOpacity={0.7}
          style={styles.itemRow}
          accessibilityRole="button"
          accessibilityLabel="Configurar lembretes e horários"
        >
          <View style={styles.itemIconCircle}>
            <Bell size={18} color="#2F7F7C" />
          </View>
          <View style={styles.itemTextCol}>
            <Text style={[styles.itemTitle, { color: isDark ? colors.text : '#173D3B' }]}>
              Lembretes e horários
            </Text>
            <Text style={[styles.itemSubtitle, { color: isDark ? colors.textMuted : '#667775' }]}>
              Configurar horários de pausa e hábitos gentis
            </Text>
          </View>
          <ChevronRight size={18} color="#8C9E9B" />
        </TouchableOpacity>
      </View>

      {/* 4. Seção "Privacidade e dados" */}
      <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#173D3B' }]}>
        Privacidade e dados
      </Text>
      <View
        style={[
          styles.groupedCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#DCE5E2',
          },
        ]}
      >
        {/* Linha 1: Salvar histórico da IA */}
        <View style={styles.itemRow}>
          <View style={styles.itemIconCircle}>
            <ShieldCheck size={18} color="#2F7F7C" />
          </View>
          <View style={styles.itemTextCol}>
            <Text style={[styles.itemTitle, { color: isDark ? colors.text : '#173D3B' }]}>
              Salvar histórico da IA
            </Text>
            <Text style={[styles.itemSubtitle, { color: isDark ? colors.textMuted : '#667775' }]}>
              Quando desativado, novas conversas não são salvas.
            </Text>
          </View>
          <Switch
            value={saveAiHistory}
            onValueChange={(val) => {
              setSaveAiHistory(val);
              showToast({ message: 'Alterações salvas.', type: 'success' });
            }}
            trackColor={{ false: '#DCE5E2', true: '#2F7F7C' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.rowDivider, { backgroundColor: isDark ? colors.border : '#F0F5F3' }]} />

        {/* Linha 2: Gerar relatório mensal em PDF */}
        <TouchableOpacity
          onPress={() => setIsMonthlyReportOpen(true)}
          activeOpacity={0.7}
          style={styles.itemRow}
          accessibilityRole="button"
          accessibilityLabel="Gerar relatório mensal em PDF"
        >
          <View style={styles.itemIconCircle}>
            <FileDown size={18} color="#2F7F7C" />
          </View>
          <View style={styles.itemTextCol}>
            <Text style={[styles.itemTitle, { color: isDark ? colors.text : '#173D3B' }]}>
              Gerar relatório mensal
            </Text>
            <Text style={[styles.itemSubtitle, { color: isDark ? colors.textMuted : '#667775' }]}>
              Relatório em PDF para terapia ou acompanhamento
            </Text>
          </View>
          <ChevronRight size={18} color="#8C9E9B" />
        </TouchableOpacity>

        <View style={[styles.rowDivider, { backgroundColor: isDark ? colors.border : '#F0F5F3' }]} />

        {/* Linha 3: Exportar meus dados */}
        <TouchableOpacity
          onPress={() => setIsDataExportOpen(true)}
          activeOpacity={0.7}
          style={styles.itemRow}
          accessibilityRole="button"
          accessibilityLabel="Exportar meus dados"
        >
          <View style={styles.itemIconCircle}>
            <FileDown size={18} color="#2F7F7C" />
          </View>
          <View style={styles.itemTextCol}>
            <Text style={[styles.itemTitle, { color: isDark ? colors.text : '#173D3B' }]}>
              Exportar meus dados
            </Text>
            <Text style={[styles.itemSubtitle, { color: isDark ? colors.textMuted : '#667775' }]}>
              Baixe uma cópia em formato ZIP ou JSON
            </Text>
          </View>
          <ChevronRight size={18} color="#8C9E9B" />
        </TouchableOpacity>
      </View>

      {/* 5. Seção "Segurança" */}
      <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#173D3B' }]}>
        Segurança
      </Text>
      <View
        style={[
          styles.groupedCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#DCE5E2',
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setIsSecurityModalOpen(true)}
          activeOpacity={0.7}
          style={styles.itemRow}
          accessibilityRole="button"
          accessibilityLabel="Segurança e acesso"
        >
          <View style={styles.itemIconCircle}>
            <KeyRound size={18} color="#667775" />
          </View>
          <View style={styles.itemTextCol}>
            <Text style={[styles.itemTitle, { color: isDark ? colors.text : '#173D3B' }]}>
              Segurança e acesso
            </Text>
            <Text style={[styles.itemSubtitle, { color: isDark ? colors.textMuted : '#667775' }]}>
              Senha, e-mail e autenticação
            </Text>
          </View>
          <ChevronRight size={18} color="#8C9E9B" />
        </TouchableOpacity>
      </View>

      {/* 6. Seção "Sessões e dispositivos" */}
      <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#173D3B' }]}>
        Sessões e dispositivos
      </Text>
      <View
        style={[
          styles.groupedCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#DCE5E2',
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setIsSessionsModalOpen(true)}
          activeOpacity={0.7}
          style={styles.itemRow}
          accessibilityRole="button"
          accessibilityLabel="Sessões e dispositivos"
        >
          <View style={styles.itemIconCircle}>
            <Laptop size={18} color="#2F7F7C" />
          </View>
          <View style={styles.itemTextCol}>
            <Text style={[styles.itemTitle, { color: isDark ? colors.text : '#173D3B' }]}>
              Gerenciar sessões
            </Text>
            <Text style={[styles.itemSubtitle, { color: isDark ? colors.textMuted : '#667775' }]}>
              {sessions.length} {sessions.length === 1 ? 'dispositivo conectado' : 'dispositivos conectados'}
            </Text>
          </View>
          <ChevronRight size={18} color="#8C9E9B" />
        </TouchableOpacity>
      </View>

      {/* 7. Ações de Encerramento e Exclusão */}
      <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#173D3B' }]}>
        Conta
      </Text>
      <View
        style={[
          styles.groupedCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#DCE5E2',
            marginBottom: 28,
          },
        ]}
      >
        {/* Linha 1: Sair da conta */}
        <TouchableOpacity
          onPress={() => setIsLogoutDialogOpen(true)}
          activeOpacity={0.7}
          style={styles.itemRow}
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
        >
          <View style={styles.itemIconCircle}>
            <LogOut size={18} color="#667775" />
          </View>
          <View style={styles.itemTextCol}>
            <Text style={[styles.itemTitle, { color: isDark ? colors.text : '#173D3B' }]}>
              Sair da conta
            </Text>
            <Text style={[styles.itemSubtitle, { color: isDark ? colors.textMuted : '#667775' }]}>
              Encerrar sessão neste dispositivo
            </Text>
          </View>
          <ChevronRight size={18} color="#8C9E9B" />
        </TouchableOpacity>

        <View style={[styles.rowDivider, { backgroundColor: isDark ? colors.border : '#F0F5F3' }]} />

        {/* Linha 2: Excluir conta e dados */}
        <TouchableOpacity
          onPress={() => setIsDeleteDialogOpen(true)}
          activeOpacity={0.7}
          style={styles.itemRow}
          accessibilityRole="button"
          accessibilityLabel="Excluir conta e dados"
        >
          <View style={styles.itemIconCircle}>
            <Trash2 size={18} color="#D9534F" />
          </View>
          <View style={styles.itemTextCol}>
            <Text style={[styles.itemTitle, { color: '#D9534F' }]}>
              Excluir conta e dados
            </Text>
            <Text style={[styles.itemSubtitle, { color: '#D9534F', opacity: 0.85 }]}>
              Esta ação é permanente e não pode ser desfeita.
            </Text>
          </View>
          <ChevronRight size={18} color="#D9534F" />
        </TouchableOpacity>
      </View>

      {/* Modais de Funcionalidades */}
      <AvatarPickerModal
        visible={isAvatarModalOpen}
        currentAvatarUrl={user?.avatarUrl}
        userName={user?.name || 'Ana'}
        onClose={() => setIsAvatarModalOpen(false)}
        onSelectAvatar={handleAvatarChange}
      />

      <EditProfileModal
        visible={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

      <DataExportModal
        visible={isDataExportOpen}
        onClose={() => setIsDataExportOpen(false)}
      />

      <SecurityAccessModal
        visible={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      <SessionsModal
        visible={isSessionsModalOpen}
        sessions={sessions}
        onClose={() => setIsSessionsModalOpen(false)}
        onRevokeSession={handleRevokeSession}
        onRevokeOthers={handleRevokeOthers}
      />

      <NotificationSettingsModal
        visible={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />

      <MonthlyReportModal
        visible={isMonthlyReportOpen}
        onClose={() => setIsMonthlyReportOpen(false)}
      />

      {/* Diálogo de Confirmação de Logout */}
      <ConfirmDialog
        visible={isLogoutDialogOpen}
        title="Sair da conta"
        message="Tem certeza de que deseja encerrar a sessão neste dispositivo?"
        confirmTitle="Sair"
        cancelTitle="Permanecer"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutDialogOpen(false)}
      />

      {/* Diálogo de Exclusão de Conta em Duas Etapas */}
      <ConfirmDialog
        visible={isDeleteDialogOpen}
        title="Excluir conta permanentemente"
        message="Todos os seus check-ins, histórico de práticas, anotações e dados pessoais serão apagados de forma irreversível. Para confirmar, digite EXCLUIR MINHA CONTA abaixo:"
        confirmTitle="Excluir Permanentemente"
        cancelTitle="Cancelar"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleDeleteAccount}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setDeleteConfirmText('');
        }}
      >
        <TextInput
          value={deleteConfirmText}
          onChangeText={setDeleteConfirmText}
          placeholder="EXCLUIR MINHA CONTA"
          placeholderTextColor="#8C9E9B"
          style={styles.deleteInput}
          autoCapitalize="characters"
        />
      </ConfirmDialog>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
    paddingTop: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },

  // Card do Perfil do Usuário
  userProfileCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  userTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  pencilOverlayBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2F7F7C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userDetailsCol: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  userEmail: {
    fontSize: 13,
    marginTop: 1,
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2F7F7C',
  },
  userActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  userActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  userActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2F7F7C',
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2F7F7C',
  },

  // Títulos de Seção
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 8,
    marginTop: 4,
  },

  // Card Agrupado
  groupedCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 18,
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 52,
  },
  itemIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E7F3EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemSubtitle: {
    fontSize: 11,
    marginTop: 1,
    lineHeight: 15,
  },
  rowDivider: {
    height: 1,
  },

  // Toggle Claro / Escuro
  themeToggleBox: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  themeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  themeBtnActive: {
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  themeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Input de Confirmação de Exclusão
  deleteInput: {
    height: 44,
    borderWidth: 1.5,
    borderColor: '#D9534F',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
    color: '#D9534F',
    marginTop: 14,
    textAlign: 'center',
  },
});
