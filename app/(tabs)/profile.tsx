import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  User as UserIcon,
  Moon,
  Sun,
  Bell,
  Clock,
  Shield,
  Download,
  Key,
  LogOut,
  Trash2,
  Lock,
  ChevronRight,
  Sparkles,
  Smartphone,
} from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { ConfirmationModal } from '../../src/components/ui/ConfirmationModal';
import { AppButton } from '../../src/components/ui/AppButton';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';
import { userService } from '../../src/services/user/userService';
import { notificationService } from '../../src/services/notifications/notificationService';
import { formatDate } from '../../src/utils/date';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAdmin, logout, updateUser } = useAuth();
  const { mode, isDark, colors, setThemeMode } = useTheme();

  const [reminderEnabled, setReminderEnabled] = useState(
    user?.preferences?.dailyReminder ?? true
  );
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(
    user?.preferences?.reducedMotion ?? false
  );
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteStep1Modal, setShowDeleteStep1Modal] = useState(false);
  const [showDeleteStep2Modal, setShowDeleteStep2Modal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportedJson, setExportedJson] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleThemeChange = async (newMode: 'light' | 'dark' | 'system') => {
    await setThemeMode(newMode);
    if (user) {
      const updated = await userService.updatePreferences(user.id, { theme: newMode });
      updateUser(updated);
    }
  };

  const handleReminderToggle = async (enabled: boolean) => {
    setReminderEnabled(enabled);
    if (enabled) {
      await notificationService.scheduleDailyReminder(20, 0);
    } else {
      await notificationService.cancelReminders();
    }
    if (user) {
      const updated = await userService.updatePreferences(user.id, { dailyReminder: enabled });
      updateUser(updated);
    }
  };

  const handleReducedMotionToggle = async (enabled: boolean) => {
    setReducedMotionEnabled(enabled);
    if (user) {
      const updated = await userService.updatePreferences(user.id, { reducedMotion: enabled });
      updateUser(updated);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    try {
      setIsProcessing(true);
      const json = await userService.exportUserData(user.id);
      setExportedJson(json);
      setShowExportModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/(auth)/login');
  };

  const handleDeleteAccountFinal = async () => {
    if (!user) return;
    try {
      setIsProcessing(true);
      await userService.deleteAccount(user.id);
      setShowDeleteStep2Modal(false);
      await logout();
      router.replace('/(auth)/login');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <AppHeader title="Perfil e Configurações" />

      {/* Card de Informações do Usuário */}
      <View
        style={[
          styles.profileCard,
          {
            backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={[styles.avatarCircle, { backgroundColor: colors.highlight }]}>
          <UserIcon size={32} color={colors.primary} />
        </View>

        <View style={{ flex: 1, marginLeft: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'Usuário'}</Text>
            {isAdmin && (
              <View style={[styles.adminBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>
          <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user?.email}</Text>
          <Text style={[styles.userCreated, { color: colors.textMuted }]}>
            Membro desde {user?.createdAt ? formatDate(user.createdAt) : '2024'}
          </Text>
        </View>
      </View>

      {/* Acesso ao Painel Administrativo (para Admin ou Demonstração) */}
      <TouchableOpacity
        onPress={() => router.push('/admin')}
        style={[
          styles.adminBanner,
          {
            backgroundColor: isDark ? '#1C2E30' : '#E6F3F2',
            borderColor: colors.primary,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Lock size={20} color={colors.primary} style={{ marginRight: 10 }} />
          <View>
            <Text style={[styles.adminBannerTitle, { color: colors.primaryDark }]}>
              Painel Administrativo Demonstrativo
            </Text>
            <Text style={[styles.adminBannerSub, { color: colors.textMuted }]}>
              Gerenciamento de conteúdos, práticas e logs protegidos.
            </Text>
          </View>
        </View>
        <ChevronRight size={18} color={colors.primary} />
      </TouchableOpacity>

      {/* Seção de Aparência / Tema */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Aparência e Tema</Text>

        <View style={styles.themeOptionsRow}>
          {[
            { id: 'light', label: 'Claro', icon: Sun },
            { id: 'dark', label: 'Escuro', icon: Moon },
            { id: 'system', label: 'Sistema', icon: Smartphone },
          ].map((t) => {
            const isSelected = mode === t.id;
            const Icon = t.icon;

            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => handleThemeChange(t.id as any)}
                style={[
                  styles.themeOptionButton,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : isDark
                        ? colors.surfaceSubtle
                        : '#FFFFFF',
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Icon size={18} color={isSelected ? '#FFFFFF' : colors.text} />
                <Text
                  style={[
                    styles.themeOptionText,
                    { color: isSelected ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Seção de Preferências e Notificações */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferências e Acessibilidade</Text>

        <View
          style={[
            styles.settingRow,
            {
              backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Lembrete Diário</Text>
            <Text style={[styles.settingSub, { color: colors.textMuted }]}>
              Notificação suave às 20:00 para fazer sua pausa de respiração
            </Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={handleReminderToggle}
            trackColor={{ false: '#CBD5E1', true: colors.secondary }}
            thumbColor={reminderEnabled ? colors.primary : '#FFFFFF'}
          />
        </View>

        <View
          style={[
            styles.settingRow,
            {
              backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Reduzir Movimento</Text>
            <Text style={[styles.settingSub, { color: colors.textMuted }]}>
              Minimiza animações expansivas para maior conforto visual
            </Text>
          </View>
          <Switch
            value={reducedMotionEnabled}
            onValueChange={handleReducedMotionToggle}
            trackColor={{ false: '#CBD5E1', true: colors.secondary }}
            thumbColor={reducedMotionEnabled ? colors.primary : '#FFFFFF'}
          />
        </View>
      </View>

      {/* Seção de Privacidade e Dados */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Privacidade e LGPD</Text>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/consent')}
          style={[
            styles.linkRow,
            {
              backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          <Shield size={18} color={colors.primary} style={{ marginRight: 10 }} />
          <Text style={[styles.linkRowText, { color: colors.text }]}>
            Gerenciar Consentimentos
          </Text>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/privacy')}
          style={[
            styles.linkRow,
            {
              backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          <Shield size={18} color={colors.primary} style={{ marginRight: 10 }} />
          <Text style={[styles.linkRowText, { color: colors.text }]}>
            Ler Política de Privacidade
          </Text>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleExportData}
          style={[
            styles.linkRow,
            {
              backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          <Download size={18} color={colors.primary} style={{ marginRight: 10 }} />
          <Text style={[styles.linkRowText, { color: colors.text }]}>
            Exportar Meus Dados (JSON)
          </Text>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Ações de Conta: Logout e Exclusão */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Conta</Text>

        <TouchableOpacity
          onPress={() => setShowLogoutModal(true)}
          style={[
            styles.actionRow,
            {
              backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          <LogOut size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
          <Text style={[styles.actionRowText, { color: colors.text }]}>Sair da Conta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowDeleteStep1Modal(true)}
          style={[
            styles.actionRow,
            {
              backgroundColor: isDark ? '#3A1F1E' : '#FFF4F4',
              borderColor: colors.error,
            },
          ]}
        >
          <Trash2 size={18} color={colors.error} style={{ marginRight: 10 }} />
          <Text style={[styles.actionRowText, { color: colors.error, fontWeight: '700' }]}>
            Excluir Conta Definitivamente
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Logout */}
      <ConfirmationModal
        visible={showLogoutModal}
        title="Deseja sair da conta?"
        message="Sua sessão será encerrada com segurança no dispositivo."
        confirmTitle="Sair"
        cancelTitle="Cancelar"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* Modal Exclusão de Conta - Etapa 1 */}
      <ConfirmationModal
        visible={showDeleteStep1Modal}
        title="Excluir conta (Etapa 1 de 2)"
        message="Atenção: A exclusão da sua conta apagará permanentemente todos os seus registros de diário, preferências e históricos locais. Deseja continuar para a confirmação final?"
        confirmTitle="Continuar Exclusão"
        cancelTitle="Cancelar"
        isDestructive
        onConfirm={() => {
          setShowDeleteStep1Modal(false);
          setShowDeleteStep2Modal(true);
        }}
        onCancel={() => setShowDeleteStep1Modal(false)}
      />

      {/* Modal Exclusão de Conta - Etapa 2 (Confirmação Irreversível) */}
      <ConfirmationModal
        visible={showDeleteStep2Modal}
        title="Confirmação Final (Etapa 2 de 2)"
        message="Você tem certeza absoluta? Todos os dados serão destruídos e não poderão ser recuperados."
        confirmTitle="Sim, Apagar Tudo"
        cancelTitle="Desistir"
        isDestructive
        isLoading={isProcessing}
        onConfirm={handleDeleteAccountFinal}
        onCancel={() => setShowDeleteStep2Modal(false)}
      />

      {/* Modal de Exibição do JSON Exportado */}
      <ConfirmationModal
        visible={showExportModal}
        title="Exportação de Dados Concluída"
        message={`Seus dados foram estruturados com sucesso no formato JSON.\n\n${exportedJson.substring(0, 180)}...`}
        confirmTitle="Fechar"
        cancelTitle="Copiar / Ok"
        onConfirm={() => setShowExportModal(false)}
        onCancel={() => setShowExportModal(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    marginVertical: 12,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
  },
  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  userCreated: {
    fontSize: 11,
    marginTop: 2,
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  adminBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  adminBannerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOptionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingSub: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  linkRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  actionRowText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
