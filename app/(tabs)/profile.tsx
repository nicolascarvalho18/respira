import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Moon,
  Sun,
  FileDown,
  LogOut,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
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
import { useReducedMotion } from '../../src/hooks/useReducedMotion';
import { userService } from '../../src/services/user/userService';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();
  const { colors, isDark } = useTheme();
  const { mode: themeMode, setThemeMode } = useThemeStore();
  const reducedMotion = useReducedMotion();
  const { showToast } = useToast();

  const [isEditingName, setIsEditingName] = useState(false);
  const [userName, setUserName] = useState(user?.name === 'ama' ? 'Ana' : user?.name || 'Ana');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteStep2, setShowDeleteStep2] = useState(false);

  const displayName = user?.name === 'ama' ? 'Ana' : user?.name || 'Ana';
  const displayEmail = user?.email === 'ama@exemplo.com' ? 'ana@exemplo.com' : user?.email || 'ana@exemplo.com';

  const handleSaveName = async () => {
    if (!userName.trim()) return;
    if (user) {
      await updateUser({ name: userName.trim() });
    }
    setIsEditingName(false);
    showToast({ message: 'Nome atualizado com sucesso.', type: 'success' });
  };

  const handleToggleReducedMotion = async (val: boolean) => {
    if (user) {
      await updateUser({
        preferences: {
          ...user.preferences,
          reducedMotion: val,
        },
      });
    }
  };

  const handleToggleDailyReminder = async (val: boolean) => {
    if (user) {
      await updateUser({
        preferences: {
          ...user.preferences,
          dailyReminder: val,
        },
      });
    }
  };

  const handleTogglePersonalization = async (val: boolean) => {
    if (user) {
      await updateUser({
        consents: {
          ...user.consents,
          personalizationAccepted: val,
        },
      });
    }
  };

  const handleExportData = async () => {
    try {
      const json = await userService.exportUserData(user?.id || 'user-demo-1');

      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meus-dados-respira-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      showToast({ message: 'Dados exportados com sucesso em JSON.', type: 'success' });
    } catch {
      showToast({ message: 'Erro ao exportar dados.', type: 'error' });
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    showToast({ message: 'Sessão encerrada.', type: 'info' });
    router.replace('/(auth)/login');
  };

  const handleDeleteAccountFinal = async () => {
    setShowDeleteStep2(false);
    await logout();
    showToast({ message: 'Sua conta e dados foram apagados permanentemente.', type: 'info' });
    router.replace('/(auth)/login');
  };

  return (
    <AppShell>
      {/* 1. Cabeçalho do Perfil Compacto */}
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
                <Text style={[styles.profileName, { color: colors.text }]}>
                  {displayName}
                </Text>
                <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                  {displayEmail}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsEditingName(true)}
                  style={{ marginTop: 2 }}
                  accessibilityRole="button"
                  accessibilityLabel="Editar nome do perfil"
                >
                  <Text style={[styles.editLink, { color: colors.primary }]}>Editar nome</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 6 }}>
                <AppInput
                  value={userName}
                  onChangeText={setUserName}
                  placeholder="Seu nome"
                  style={{ marginVertical: 0 }}
                />
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <AppButton title="Salvar" size="sm" onPress={handleSaveName} />
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

          {user?.role === 'admin' && (
            <Badge label="Admin" variant="warning" size="sm" />
          )}
        </View>
      </Card>

      {/* 2. Seção: Aparência */}
      <Card variant="bordered" style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Aparência</Text>

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

      {/* 3. Seção: Acessibilidade */}
      <Card variant="bordered" style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Acessibilidade</Text>

        <View style={styles.settingRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Redução de Movimento</Text>
            <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
              Substitui animações por transições suaves.
            </Text>
          </View>
          <Switch
            value={user?.preferences?.reducedMotion ?? reducedMotion}
            onValueChange={handleToggleReducedMotion}
            trackColor={{ false: '#CBD5E1', true: colors.secondary }}
            thumbColor={user?.preferences?.reducedMotion ? colors.primary : '#FFFFFF'}
            accessibilityLabel="Alternar redução de movimento"
          />
        </View>
      </Card>

      {/* 4. Seção: Lembretes */}
      <Card variant="bordered" style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Lembretes Diários</Text>

        <View style={styles.settingRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Lembrete de Cuidado
            </Text>
            <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
              Notificação suave às 20:30 para incentivar uma pausa.
            </Text>
          </View>
          <Switch
            value={user?.preferences?.dailyReminder ?? true}
            onValueChange={handleToggleDailyReminder}
            trackColor={{ false: '#CBD5E1', true: colors.secondary }}
            thumbColor={user?.preferences?.dailyReminder ? colors.primary : '#FFFFFF'}
            accessibilityLabel="Alternar lembrete diário"
          />
        </View>
      </Card>

      {/* 5. Seção: Privacidade e LGPD */}
      <Card variant="bordered" style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Privacidade e Dados (LGPD)
        </Text>

        <View style={styles.settingRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Sugestões Personalizadas
            </Text>
            <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
              Utiliza suas categorias de práticas mais acessadas.
            </Text>
          </View>
          <Switch
            value={user?.consents?.personalizationAccepted ?? true}
            onValueChange={handleTogglePersonalization}
            trackColor={{ false: '#CBD5E1', true: colors.secondary }}
            thumbColor={user?.consents?.personalizationAccepted ? colors.primary : '#FFFFFF'}
            accessibilityLabel="Alternar consentimento de personalização"
          />
        </View>

        <View style={styles.consentHistoryRow}>
          <CheckCircle2 size={15} color={colors.success} style={{ marginRight: 6 }} />
          <Text style={[styles.consentHistoryText, { color: colors.textMuted }]}>
            Termos aceitos em 15/01/2024 (v1.0)
          </Text>
        </View>

        {/* Exportação de Dados */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleExportData}
          accessibilityRole="button"
          accessibilityLabel="Exportar todos os meus dados em formato JSON"
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

      {/* 6. Painel Admin apenas para Administradores */}
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
              <ShieldCheck size={18} color={colors.primary} style={{ marginRight: 8 }} />
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

      {/* 7. Conta e Logout */}
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

      {/* Diálogos de Confirmação */}
      <ConfirmDialog
        visible={showLogoutModal}
        title="Encerrar sessão?"
        message="Você precisará informar seu e-mail e senha para acessar novamente."
        confirmTitle="Sair"
        cancelTitle="Cancelar"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      <ConfirmDialog
        visible={showDeleteModal}
        title="Excluir sua conta?"
        message="Seus registros e dados salvos serão permanentemente apagados dos nossos servidores."
        confirmTitle="Prosseguir"
        cancelTitle="Cancelar"
        isDestructive
        onConfirm={() => {
          setShowDeleteModal(false);
          setShowDeleteStep2(true);
        }}
        onCancel={() => setShowDeleteModal(false)}
      />

      <ConfirmDialog
        visible={showDeleteStep2}
        title="Confirmação Final de Exclusão"
        message="Esta ação é definitiva e irreversível. Tem certeza?"
        confirmTitle="Excluir Definitivamente"
        cancelTitle="Voltar"
        isDestructive
        onConfirm={handleDeleteAccountFinal}
        onCancel={() => setShowDeleteStep2(false)}
      />
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
  editLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    padding: 16,
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
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
  consentHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
  },
  consentHistoryText: {
    fontSize: 11,
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
});
