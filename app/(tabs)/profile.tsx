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
  const [userName, setUserName] = useState(user?.name || 'Ana');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteStep2, setShowDeleteStep2] = useState(false);

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
      setIsExporting(true);
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

      showToast({ message: 'Pacote de dados LGPD exportado com sucesso!', type: 'success' });
    } catch {
      showToast({ message: 'Erro ao exportar dados.', type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    showToast({ message: 'Sessão encerrada com segurança.', type: 'info' });
    router.replace('/(auth)/login');
  };

  const handleDeleteAccountFinal = async () => {
    setShowDeleteStep2(false);
    await logout();
    showToast({ message: 'Sua conta e todos os dados foram apagados permanentemente.', type: 'info' });
    router.replace('/(auth)/login');
  };

  return (
    <AppShell>
      {/* 1. Cabeçalho do Perfil */}
      <Card variant="bordered" style={styles.profileHeaderCard}>
        <View style={styles.avatarRow}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarLetter}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            {!isEditingName ? (
              <View>
                <Text style={[styles.profileName, { color: colors.text }]}>
                  {user?.name || 'Ana'}
                </Text>
                <Text style={[styles.profileEmail, { color: colors.textMuted }]}>
                  {user?.email || 'ana@exemplo.com'}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsEditingName(true)}
                  style={{ marginTop: 4 }}
                  accessibilityRole="button"
                  accessibilityLabel="Editar nome do perfil"
                >
                  <Text style={[styles.editLink, { color: colors.primary }]}>Editar nome</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                <AppInput
                  value={userName}
                  onChangeText={setUserName}
                  placeholder="Seu nome"
                  style={{ marginVertical: 0 }}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
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
            <Badge label="Administrador" variant="warning" size="sm" />
          )}
        </View>
      </Card>

      {/* 2. Seção: Aparência */}
      <Card variant="bordered" style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Aparência</Text>

        <View style={styles.themeOptionsRow}>
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
                <Icon size={18} color={isSelected ? '#FFFFFF' : colors.text} />
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
            <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
              Substitui animações complexas por transições estáticas e suaves.
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

      {/* 4. Seção: Notificações */}
      <Card variant="bordered" style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Lembretes Diários</Text>

        <View style={styles.settingRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Lembrete de Autocuidado
            </Text>
            <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
              Notificação suave às 20:30 para incentivar a respiração e reflexão.
            </Text>
          </View>
          <Switch
            value={user?.preferences?.dailyReminder ?? true}
            onValueChange={handleToggleDailyReminder}
            trackColor={{ false: '#CBD5E1', true: colors.secondary }}
            thumbColor={user?.preferences?.dailyReminder ? colors.primary : '#FFFFFF'}
            accessibilityLabel="Alternar lembrete diário de autocuidado"
          />
        </View>
      </Card>

      {/* 5. Seção: Privacidade e LGPD */}
      <Card variant="bordered" style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Privacidade e Consentimentos (LGPD)
        </Text>

        <View style={styles.settingRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Recomendações Personalizadas
            </Text>
            <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
              Utiliza suas categorias de práticas e humor recente para sugerir conteúdos úteis.
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
          <CheckCircle2 size={16} color={colors.success} style={{ marginRight: 6 }} />
          <Text style={[styles.consentHistoryText, { color: colors.textMuted }]}>
            Termos de Uso e Política de Privacidade aceitos em 15/01/2024 (v1.0)
          </Text>
        </View>

        {/* Exportação de Dados */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleExportData}
          accessibilityRole="button"
          accessibilityLabel="Exportar todos os meus dados em JSON"
          style={[styles.actionRowBtn, { borderTopColor: colors.border }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FileDown size={18} color={colors.primary} style={{ marginRight: 10 }} />
            <Text style={[styles.actionRowText, { color: colors.text }]}>
              Exportar Meus Dados (JSON)
            </Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </Card>

      {/* 6. Apenas para Administradores: Acesso ao Painel Admin */}
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
              <ShieldCheck size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                Painel Administrativo
              </Text>
            </View>
            <AppButton
              title="Acessar Painel"
              size="sm"
              onPress={() => router.push('/admin')}
            />
          </View>
        </Card>
      )}

      {/* 7. Seção: Segurança e Conta */}
      <Card variant="bordered" style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Segurança e Conta</Text>

        <TouchableOpacity
          onPress={() => setShowLogoutModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Encerrar sessão"
          style={styles.actionRowBtn}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LogOut size={18} color={colors.warning} style={{ marginRight: 10 }} />
            <Text style={[styles.actionRowText, { color: colors.warning }]}>Encerrar Sessão</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowDeleteModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Excluir minha conta permanentemente"
          style={[styles.actionRowBtn, { borderTopColor: colors.border }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Trash2 size={18} color={colors.error} style={{ marginRight: 10 }} />
            <Text style={[styles.actionRowText, { color: colors.error }]}>
              Excluir Conta e Dados
            </Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </Card>

      {/* Diálogo de Logout */}
      <ConfirmDialog
        visible={showLogoutModal}
        title="Encerrar sessão?"
        message="Você precisará informar seu e-mail e senha para acessar novamente."
        confirmTitle="Sair"
        cancelTitle="Cancelar"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* Exclusão - Etapa 1 */}
      <ConfirmDialog
        visible={showDeleteModal}
        title="Deseja realmente excluir sua conta?"
        message="Todos os seus registros de humor, históricos de práticas e dados salvos serão permanentemente apagados dos nossos servidores."
        confirmTitle="Prosseguir para Confirmação"
        cancelTitle="Cancelar"
        isDestructive
        onConfirm={() => {
          setShowDeleteModal(false);
          setShowDeleteStep2(true);
        }}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Exclusão - Etapa 2 */}
      <ConfirmDialog
        visible={showDeleteStep2}
        title="Confirmação Final de Exclusão"
        message="Esta ação é definitiva e irreversível sob as diretrizes da LGPD. Tem certeza absoluta?"
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
    marginBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  editLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionCard: {
    gap: 14,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  themeOptionText: {
    fontSize: 13,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  consentHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  consentHistoryText: {
    fontSize: 12,
  },
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  actionRowText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
