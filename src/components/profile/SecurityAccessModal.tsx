import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  X,
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../ui/AppInput';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/user/userService';
import { supabaseAuthService } from '../../services/auth/supabaseAuthService';
import { useToast } from '../ui/Toast';
import { validatePasswordStrength } from '../../utils/security';

export interface SecurityAccessModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SecurityAccessModal: React.FC<SecurityAccessModalProps> = ({
  visible,
  onClose,
}) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'password' | 'email'>('password');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Email state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [isRequestingEmail, setIsRequestingEmail] = useState(false);

  if (!visible) return null;

  const passwordStrength = validatePasswordStrength(newPassword);

  const handleChangePassword = async () => {
    if (!user) return;
    if (newPassword !== confirmPassword) {
      showToast({ message: 'A nova senha e a confirmação não coincidem.', type: 'error' });
      return;
    }

    if (!passwordStrength.isValid) {
      showToast({ message: passwordStrength.errors[0] || 'Senha não atende aos requisitos.', type: 'error' });
      return;
    }

    try {
      setIsSavingPassword(true);
      const res = await supabaseAuthService.updatePassword(newPassword);
      if (!res.success) throw new Error(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast({ message: res.message, type: 'success' });
      onClose();
    } catch (err: any) {
      showToast({ message: err.message || 'Erro ao alterar senha.', type: 'error' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleRequestEmail = async () => {
    if (!user || !newEmail.trim()) return;
    try {
      setIsRequestingEmail(true);
      const res = await supabaseAuthService.updateEmail(newEmail.trim());
      if (!res.success) throw new Error(res.message);
      setNewEmail('');
      setEmailPassword('');
      showToast({ message: res.message, type: 'info' });
      onClose();
    } catch (err: any) {
      showToast({ message: err.message || 'Erro ao solicitar alteração de e-mail.', type: 'error' });
    } finally {
      setIsRequestingEmail(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: '#173D3B' }]}>Segurança e acesso</Text>
              <Text style={[styles.subtitle, { color: '#667775' }]}>
                Gerencie sua senha e credenciais de acesso
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Fechar modal"
            >
              <X size={20} color="#8C9E9B" />
            </TouchableOpacity>
          </View>

          {/* Sub-tabs: Alterar Senha / Alterar E-mail */}
          <View
            style={[
              styles.tabSelectorRow,
              { backgroundColor: isDark ? colors.surfaceSecondary : '#F2F6F5' },
            ]}
          >
            <TouchableOpacity
              onPress={() => setActiveTab('password')}
              style={[
                styles.tabBtn,
                activeTab === 'password' && [
                  styles.tabBtnActive,
                  { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
                ],
              ]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color: activeTab === 'password' ? '#2F7F7C' : '#667775',
                    fontWeight: activeTab === 'password' ? '700' : '500',
                  },
                ]}
              >
                Alterar Senha
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('email')}
              style={[
                styles.tabBtn,
                activeTab === 'email' && [
                  styles.tabBtnActive,
                  { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
                ],
              ]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color: activeTab === 'email' ? '#2F7F7C' : '#667775',
                    fontWeight: activeTab === 'email' ? '700' : '500',
                  },
                ]}
              >
                Alterar E-mail
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 360 }}>
            {activeTab === 'password' ? (
              <View style={{ gap: 4 }}>
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
                                    ? '#2F7F7C'
                                    : '#D98968'
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
                            passwordStrength.score >= 3 ? '#2F7F7C' : '#D98968',
                        },
                      ]}
                    >
                      {passwordStrength.score >= 3
                        ? 'Senha forte e segura'
                        : 'Senha fraca ou incompleta'}
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
                  {showPasswords ? <EyeOff size={14} color="#8C9E9B" /> : <Eye size={14} color="#8C9E9B" />}
                  <Text style={[styles.showPassText, { color: '#667775' }]}>
                    {showPasswords ? 'Ocultar senhas' : 'Exibir senhas'}
                  </Text>
                </TouchableOpacity>

                <AppButton
                  title="Atualizar Senha"
                  size="md"
                  isLoading={isSavingPassword}
                  disabled={!newPassword || !confirmPassword || !passwordStrength.isValid}
                  onPress={handleChangePassword}
                  style={{ marginTop: 10 }}
                />
              </View>
            ) : (
              <View style={{ gap: 4 }}>
                <Text style={[styles.emailNoticeText, { color: '#667775' }]}>
                  Enviaremos um link de confirmação para o novo endereço de e-mail antes de efetivar a troca.
                </Text>

                <AppInput
                  label="Novo Endereço de E-mail"
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder="novo.email@exemplo.com"
                  keyboardType="email-address"
                />

                <AppInput
                  label="Sua Senha Atual"
                  value={emailPassword}
                  onChangeText={setEmailPassword}
                  secureTextEntry
                  placeholder="Confirme com sua senha atual"
                />

                <AppButton
                  title="Solicitar Troca de E-mail"
                  size="md"
                  isLoading={isRequestingEmail}
                  disabled={!newEmail.trim()}
                  onPress={handleRequestEmail}
                  style={{ marginTop: 10 }}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 61, 59, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  tabSelectorRow: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  tabBtnText: {
    fontSize: 12,
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
  emailNoticeText: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
});
