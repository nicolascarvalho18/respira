import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  User as UserIcon,
  Shield,
  Moon,
  Sun,
  Smartphone,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  LogOut,
  Trash2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Bell,
  Sparkles,
  Lock,
  Camera,
  Layers,
  Sliders,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppInput } from '../../src/components/ui/AppInput';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useToast } from '../../src/components/ui/Toast';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { useThemeStore } from '../../src/store/themeStore';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { userService } from '../../src/services/user/userService';
import { UserSession, SecurityEvent } from '../../src/types';
import { formatDate, formatDateTime } from '../../src/utils/date';
import { validatePasswordStrength } from '../../src/utils/security';

type SettingsTab =
  | 'profile'
  | 'security'
  | 'appearance'
  | 'accessibility'
  | 'notifications'
  | 'privacy'
  | 'sessions'
  | 'account';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();
  const { colors, isDark } = useTheme();
  const { mode: themeMode, setThemeMode } = useThemeStore();
  const { isDesktop } = useBreakpoint();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [expandedSection, setExpandedSection] = useState<string | null>('profile');

  // Profile editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [isSavingName, setIsSavingName] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Email change
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailPasswordInput, setEmailPasswordInput] = useState('');
  const [isRequestingEmail, setIsRequestingEmail] = useState(false);

  // Sessions & Security
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Account deletion
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePhraseInput, setDeletePhraseInput] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Logout
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Notifications
  const [dailyReminder, setDailyReminder] = useState(user?.preferences?.dailyReminder ?? true);
  const [newContentAlerts, setNewContentAlerts] = useState(
    user?.preferences?.notifications?.newContentAlerts ?? true
  );
  const [favoritePracticesAlerts, setFavoritePracticesAlerts] = useState(
    user?.preferences?.notifications?.favoritePracticesAlerts ?? true
  );

  // Accessibility
  const [reducedMotion, setReducedMotion] = useState(user?.preferences?.reducedMotion ?? false);
  const [largeText, setLargeText] = useState(user?.preferences?.largeText ?? false);
  const [highContrast, setHighContrast] = useState(user?.preferences?.highContrast ?? false);

  // Consents & AI History
  const [chatRetention, setChatRetention] = useState(
    user?.consents?.chatRetentionAccepted ?? true
  );
  const [personalization, setPersonalization] = useState(
    user?.consents?.personalizationAccepted ?? true
  );
  const [analytics, setAnalytics] = useState(
    user?.consents?.analyticsAccepted ?? false
  );

  useEffect(() => {
    if (user) {
      setNameInput(user.name);
      loadSessionsAndEvents();
    }
  }, [user]);

  const loadSessionsAndEvents = async () => {
    if (!user) return;
    try {
      setIsLoadingSessions(true);
      const [sess, events] = await Promise.all([
        userService.getActiveSessions(user.id),
        userService.getSecurityEvents(user.id),
      ]);
      setSessions(sess);
      setSecurityEvents(events);
    } catch {
      // Graceful fallback
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const toggleSection = (sec: string) => {
    setExpandedSection((prev) => (prev === sec ? null : sec));
  };

  const handleSaveName = async () => {
    if (!nameInput.trim() || !user) return;
    try {
      setIsSavingName(true);
      const updated = await userService.updateProfile(user.id, { name: nameInput.trim() });
      await updateUser({ name: updated.name });
      setIsEditingName(false);
      showToast({ message: 'Nome atualizado com sucesso.', type: 'success' });
    } catch (err: any) {
      showToast({ message: err.message || 'Erro ao atualizar nome.', type: 'error' });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    if (newPassword !== confirmPassword) {
      showToast({ message: 'A nova senha e a confirmação não coincidem.', type: 'error' });
      return;
    }

    const val = validatePasswordStrength(newPassword);
    if (!val.isValid) {
      showToast({ message: val.errors[0] || 'Senha não atende aos requisitos.', type: 'error' });
      return;
    }

    try {
      setIsSavingPassword(true);
      const res = await userService.changePassword(user.id, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast({ message: res.message, type: 'success' });
      loadSessionsAndEvents();
    } catch (err: any) {
      showToast({ message: err.message || 'Erro ao alterar senha.', type: 'error' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleRequestEmailChange = async () => {
    if (!user || !newEmailInput.trim()) return;
    try {
      setIsRequestingEmail(true);
      const res = await userService.requestEmailChange(user.id, newEmailInput.trim(), emailPasswordInput);
      setNewEmailInput('');
      setEmailPasswordInput('');
      showToast({ message: res.message, type: 'info' });
    } catch (err: any) {
      showToast({ message: err.message || 'Erro ao solicitar alteração.', type: 'error' });
    } finally {
      setIsRequestingEmail(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!user) return;
    try {
      const updated = await userService.revokeSession(user.id, sessionId);
      setSessions(updated);
      showToast({ message: 'Dispositivo desconectado.', type: 'info' });
    } catch {
      showToast({ message: 'Erro ao revogar sessão.', type: 'error' });
    }
  };

  const handleRevokeOtherSessions = async () => {
    if (!user) return;
    try {
      const updated = await userService.revokeAllOtherSessions(user.id, 'session-current');
      setSessions(updated);
      showToast({ message: 'Todas as outras sessões foram encerradas.', type: 'success' });
    } catch {
      showToast({ message: 'Erro ao desconectar outras sessões.', type: 'error' });
    }
  };

  const handleToggleDailyReminder = async (val: boolean) => {
    setDailyReminder(val);
    if (user) {
      await userService.updatePreferences(user.id, { dailyReminder: val });
      await updateUser({ preferences: { ...user.preferences, dailyReminder: val } });
    }
  };

  const handleToggleReducedMotion = async (val: boolean) => {
    setReducedMotion(val);
    if (user) {
      await userService.updatePreferences(user.id, { reducedMotion: val });
      await updateUser({ preferences: { ...user.preferences, reducedMotion: val } });
    }
  };

  const handleToggleChatRetention = async (val: boolean) => {
    setChatRetention(val);
    if (user) {
      await userService.updateConsents(user.id, { chatRetentionAccepted: val });
      await updateUser({ consents: { ...user.consents, chatRetentionAccepted: val } });
      showToast({
        message: val
          ? 'Histórico de conversas da IA ativado.'
          : 'Histórico da IA desativado. Novas conversas serão temporárias.',
        type: 'info',
      });
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    try {
      const json = await userService.exportUserData(user.id);
      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `respira-dados-pessoais-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      showToast({ message: 'Pacote completo de dados exportado em JSON.', type: 'success' });
    } catch {
      showToast({ message: 'Erro ao exportar dados.', type: 'error' });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      setIsDeletingAccount(true);
      await userService.deleteAccount(user.id, deletePhraseInput);
      setShowDeleteModal(false);
      await logout();
      showToast({ message: 'Sua conta e dados foram excluídos.', type: 'info' });
      router.replace('/(auth)/login');
    } catch (err: any) {
      showToast({ message: err.message || 'Erro ao excluir conta.', type: 'error' });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    showToast({ message: 'Sessão encerrada.', type: 'info' });
    router.replace('/(auth)/login');
  };

  const displayName = user?.name || 'Usuário';
  const displayEmail = user?.email || '';
  const passwordStrength = validatePasswordStrength(newPassword);

  return (
    <AppShell>
      {/* 1. Header do Perfil com Avatar e Metadados */}
      <Card variant="bordered" style={styles.profileHeaderCard}>
        <View style={styles.avatarRow}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarLetter}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            {!isEditingName ? (
              <View>
                <Text style={[styles.profileName, { color: colors.text }]}>{displayName}</Text>
                <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                  {displayEmail}
                </Text>
                <View style={styles.metaBadgeRow}>
                  <Badge
                    label={user?.isEmailVerified ? 'E-mail verificado' : 'Verificado'}
                    variant="success"
                    size="sm"
                  />
                  {user?.role === 'admin' && <Badge label="Admin" variant="warning" size="sm" />}
                </View>
              </View>
            ) : (
              <View style={{ gap: 6 }}>
                <AppInput
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Seu nome completo"
                  style={{ marginVertical: 0 }}
                />
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <AppButton
                    title="Salvar"
                    size="sm"
                    isLoading={isSavingName}
                    onPress={handleSaveName}
                  />
                  <AppButton
                    title="Cancelar"
                    variant="outline"
                    size="sm"
                    onPress={() => setIsEditingName(false)}
                  />
                </View>
              </View>
            )}
          </View>

          {!isEditingName && (
            <TouchableOpacity
              onPress={() => setIsEditingName(true)}
              style={[styles.editIconBtn, { backgroundColor: colors.surfaceSecondary }]}
              accessibilityRole="button"
              accessibilityLabel="Editar nome"
            >
              <Text style={[styles.editLinkText, { color: colors.primary }]}>Editar</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.accountDatesRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            Conta criada em {formatDate(user?.createdAt || new Date().toISOString())}
          </Text>
        </View>
      </Card>

      {/* 2. Seção: Segurança & Alteração de Senha/E-mail */}
      <Card variant="bordered" style={styles.sectionCard}>
        <TouchableOpacity
          onPress={() => toggleSection('security')}
          style={styles.sectionHeaderClickable}
          accessibilityRole="button"
          accessibilityLabel="Expandir ou recolher seção de segurança"
        >
          <View style={styles.sectionTitleRow}>
            <KeyRound size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Segurança e Acesso</Text>
          </View>
          {expandedSection === 'security' ? (
            <ChevronUp size={18} color={colors.textMuted} />
          ) : (
            <ChevronDown size={18} color={colors.textMuted} />
          )}
        </TouchableOpacity>

        {expandedSection === 'security' && (
          <View style={styles.sectionBody}>
            {/* Alterar Senha */}
            <Text style={[styles.subHeading, { color: colors.text }]}>Alterar Senha</Text>
            <AppInput
              label="Senha Atual"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showPasswords}
              placeholder="Digite sua senha atual"
            />
            <AppInput
              label="Nova Senha (mínimo 10 caracteres)"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPasswords}
              placeholder="Digite a nova senha segura"
            />

            {/* Medidor de força da senha em tempo real */}
            {newPassword.length > 0 && (
              <View style={styles.strengthWrap}>
                <View style={styles.strengthBarRow}>
                  {[1, 2, 3, 4].map((step) => (
                    <View
                      key={step}
                      style={[
                        styles.strengthSegment,
                        {
                          backgroundColor:
                            step <= passwordStrength.score
                              ? passwordStrength.score >= 3
                                ? colors.success
                                : colors.warning
                              : '#E2E8F0',
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text
                  style={[
                    styles.strengthLabel,
                    {
                      color:
                        passwordStrength.score >= 3 ? colors.success : colors.warning,
                    },
                  ]}
                >
                  {passwordStrength.score >= 3 ? 'Senha forte' : 'Senha fraca ou incompleta'}
                </Text>
              </View>
            )}

            <AppInput
              label="Confirmar Nova Senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPasswords}
              placeholder="Repita a nova senha"
            />

            <TouchableOpacity
              onPress={() => setShowPasswords(!showPasswords)}
              style={styles.showPassRow}
            >
              {showPasswords ? <EyeOff size={14} color={colors.textMuted} /> : <Eye size={14} color={colors.textMuted} />}
              <Text style={[styles.showPassText, { color: colors.textMuted }]}>
                {showPasswords ? 'Ocultar senhas' : 'Exibir senhas'}
              </Text>
            </TouchableOpacity>

            <AppButton
              title="Atualizar Senha"
              size="sm"
              isLoading={isSavingPassword}
              disabled={!newPassword || !confirmPassword || !passwordStrength.isValid}
              onPress={handleChangePassword}
              style={{ marginTop: 6 }}
            />

            {/* Alterar E-mail */}
            <View style={[styles.subSectionDivider, { borderTopColor: colors.border }]}>
              <Text style={[styles.subHeading, { color: colors.text }]}>Alterar E-mail</Text>
              <Text style={[styles.fieldHint, { color: colors.textSecondary }]}>
                Um link de confirmação será enviado para o novo endereço.
              </Text>
              <AppInput
                value={newEmailInput}
                onChangeText={setNewEmailInput}
                placeholder="novo.email@exemplo.com"
                keyboardType="email-address"
              />
              <AppInput
                value={emailPasswordInput}
                onChangeText={setEmailPasswordInput}
                secureTextEntry
                placeholder="Sua senha atual para confirmar"
              />
              <AppButton
                title="Solicitar Troca de E-mail"
                variant="outline"
                size="sm"
                isLoading={isRequestingEmail}
                disabled={!newEmailInput.trim()}
                onPress={handleRequestEmailChange}
                style={{ marginTop: 4 }}
              />
            </View>
          </View>
        )}
      </Card>

      {/* 3. Seção: Sessões e Dispositivos */}
      <Card variant="bordered" style={styles.sectionCard}>
        <TouchableOpacity
          onPress={() => toggleSection('sessions')}
          style={styles.sectionHeaderClickable}
          accessibilityRole="button"
          accessibilityLabel="Expandir ou recolher sessões ativas"
        >
          <View style={styles.sectionTitleRow}>
            <Laptop size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Sessões e Dispositivos ({sessions.length})
            </Text>
          </View>
          {expandedSection === 'sessions' ? (
            <ChevronUp size={18} color={colors.textMuted} />
          ) : (
            <ChevronDown size={18} color={colors.textMuted} />
          )}
        </TouchableOpacity>

        {expandedSection === 'sessions' && (
          <View style={styles.sectionBody}>
            {sessions.map((sess) => (
              <View
                key={sess.id}
                style={[
                  styles.sessionRow,
                  {
                    backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFA',
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.sessionBrowser, { color: colors.text }]}>
                      {sess.browser} ({sess.os})
                    </Text>
                    {sess.isCurrent && (
                      <Badge label="Este dispositivo" variant="success" size="sm" />
                    )}
                  </View>
                  <Text style={[styles.sessionMeta, { color: colors.textMuted }]}>
                    Último acesso: {formatDateTime(sess.lastActiveAt)} • IP {sess.ipAddressMasked}
                  </Text>
                </View>

                {!sess.isCurrent && (
                  <TouchableOpacity
                    onPress={() => handleRevokeSession(sess.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Desconectar sessão"
                    style={[styles.revokeBtn, { backgroundColor: isDark ? '#3D1C1C' : '#FDF0F0' }]}
                  >
                    <Text style={[styles.revokeBtnText, { color: colors.error }]}>Desconectar</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {sessions.length > 1 && (
              <AppButton
                title="Desconectar Todas as Outras Sessões"
                variant="outline"
                size="sm"
                onPress={handleRevokeOtherSessions}
                style={{ marginTop: 8 }}
              />
            )}
          </View>
        )}
      </Card>

      {/* 4. Seção: Aparência */}
      <Card variant="bordered" style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Sun size={18} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Aparência</Text>
        </View>

        <View style={styles.themeOptionsWrap}>
          {(['light', 'dark', 'system'] as const).map((mode) => {
            const isSelected = themeMode === mode;
            const label = mode === 'light' ? 'Claro' : mode === 'dark' ? 'Escuro' : 'Sistema';
            const Icon = mode === 'dark' ? Moon : mode === 'light' ? Sun : Smartphone;

            return (
              <TouchableOpacity
                key={mode}
                onPress={() => setThemeMode(mode)}
                accessibilityRole="radio"
                accessibilityLabel={`Tema ${label}`}
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.themeOptionBtn,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : isDark
                        ? colors.surfaceSecondary
                        : '#FFFFFF',
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Icon size={16} color={isSelected ? '#FFFFFF' : colors.text} />
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* 5. Seção: Acessibilidade */}
      <Card variant="bordered" style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Sliders size={18} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Acessibilidade</Text>
        </View>

        <View style={styles.settingRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Redução de Movimento</Text>
            <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
              Substitui animações por transições estáticas suaves.
            </Text>
          </View>
          <Switch
            value={reducedMotion}
            onValueChange={handleToggleReducedMotion}
            trackColor={{ false: '#CBD5E1', true: colors.secondary }}
            thumbColor={reducedMotion ? colors.primary : '#FFFFFF'}
          />
        </View>
      </Card>

      {/* 6. Seção: Notificações */}
      <Card variant="bordered" style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Bell size={18} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notificações</Text>
        </View>

        <View style={styles.settingRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Lembrete Diário</Text>
            <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
              Notificação suave às 20:30 para incentivar uma pausa.
            </Text>
          </View>
          <Switch
            value={dailyReminder}
            onValueChange={handleToggleDailyReminder}
            trackColor={{ false: '#CBD5E1', true: colors.secondary }}
            thumbColor={dailyReminder ? colors.primary : '#FFFFFF'}
          />
        </View>
      </Card>

      {/* 7. Seção: Privacidade, LGPD & Histórico de IA */}
      <Card variant="bordered" style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <ShieldCheck size={18} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Privacidade e LGPD
          </Text>
        </View>

        {/* Histórico da IA */}
        <View style={styles.settingRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Salvar Histórico da IA
            </Text>
            <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
              Quando desativado, novas conversas não são salvas.
            </Text>
          </View>
          <Switch
            value={chatRetention}
            onValueChange={handleToggleChatRetention}
            trackColor={{ false: '#CBD5E1', true: colors.secondary }}
            thumbColor={chatRetention ? colors.primary : '#FFFFFF'}
          />
        </View>

        {/* Exportar Dados */}
        <TouchableOpacity
          onPress={handleExportData}
          accessibilityRole="button"
          accessibilityLabel="Exportar meus dados em JSON"
          style={[styles.actionRowBtn, { borderTopColor: colors.border }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FileDown size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.actionRowText, { color: colors.text }]}>
              Exportar Meus Dados (JSON)
            </Text>
          </View>
          <ChevronRight size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </Card>

      {/* 8. Seção: Painel Admin para Administradores */}
      {user?.role === 'admin' && (
        <Card
          variant="bordered"
          style={
            StyleSheet.flatten([
              styles.sectionCard,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F0F9F8',
                borderColor: colors.primary,
              },
            ])
          }
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Shield size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                Painel Administrativo
              </Text>
            </View>
            <AppButton
              title="Acessar"
              size="sm"
              onPress={() => router.push('/admin')}
            />
          </View>
        </Card>
      )}

      {/* 9. Conta & Logout */}
      <Card variant="bordered" style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Conta</Text>

        <TouchableOpacity
          onPress={() => setShowLogoutModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Encerrar sessão"
          style={styles.actionRowBtn}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LogOut size={16} color={colors.warning} style={{ marginRight: 8 }} />
            <Text style={[styles.actionRowText, { color: colors.warning }]}>Encerrar Sessão</Text>
          </View>
          <ChevronRight size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowDeleteModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Excluir minha conta permanentemente"
          style={[styles.actionRowBtn, { borderTopColor: colors.border }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Trash2 size={16} color={colors.error} style={{ marginRight: 8 }} />
            <Text style={[styles.actionRowText, { color: colors.error }]}>
              Excluir Conta e Dados
            </Text>
          </View>
          <ChevronRight size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </Card>

      {/* Modal de Confirmação: Logout */}
      <ConfirmDialog
        visible={showLogoutModal}
        title="Encerrar sessão?"
        message="Você precisará informar suas credenciais para acessar novamente."
        confirmTitle="Sair"
        cancelTitle="Cancelar"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* Modal de Exclusão de Conta em Duas Etapas */}
      {showDeleteModal && (
        <ConfirmDialog
          visible={showDeleteModal}
          title="Excluir Conta Permanentemente"
          message="Esta ação é definitiva e irreversível. Todos os seus check-ins, histórico de práticas e preferências serão permanentemente apagados.\n\nPara confirmar, digite exatamente a frase: EXCLUIR MINHA CONTA"
          confirmTitle="Excluir Definitivamente"
          cancelTitle="Cancelar"
          isDestructive
          isLoading={isDeletingAccount}
          onConfirm={handleDeleteAccount}
          onCancel={() => {
            setShowDeleteModal(false);
            setDeletePhraseInput('');
          }}
        >
          <View style={{ marginVertical: 12 }}>
            <TextInput
              value={deletePhraseInput}
              onChangeText={setDeletePhraseInput}
              placeholder='Digite "EXCLUIR MINHA CONTA"'
              placeholderTextColor={colors.textMuted}
              style={[
                styles.deleteInput,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : '#FFF5F5',
                  borderColor: colors.error,
                  color: colors.text,
                },
              ]}
            />
          </View>
        </ConfirmDialog>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  profileHeaderCard: {
    padding: 16,
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 1,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  editIconBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editLinkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  accountDatesRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  dateText: {
    fontSize: 11,
  },
  sectionCard: {
    padding: 16,
    gap: 10,
    marginBottom: 14,
  },
  sectionHeaderClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionBody: {
    paddingTop: 8,
    gap: 10,
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  fieldHint: {
    fontSize: 12,
    marginBottom: 4,
  },
  strengthWrap: {
    marginVertical: 4,
    gap: 4,
  },
  strengthBarRow: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  showPassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  showPassText: {
    fontSize: 12,
  },
  subSectionDivider: {
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  sessionBrowser: {
    fontSize: 13,
    fontWeight: '700',
  },
  sessionMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  revokeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  revokeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  themeOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeOptionBtn: {
    flex: 1,
    minWidth: 85,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  themeOptionText: {
    fontSize: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  actionRowText: {
    fontSize: 13,
    fontWeight: '600',
  },
  deleteInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    fontSize: 13,
    fontWeight: '700',
  },
});
