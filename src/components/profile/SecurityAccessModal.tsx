import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/user/userService';
import { supabaseAuthService } from '../../services/auth/supabaseAuthService';
import { useToast } from '../ui/Toast';
import { validatePasswordStrength } from '../../utils/security';

export interface SecurityAccessModalProps {
  visible: boolean;
  onClose: () => void;
  onRevokeOthers?: () => Promise<void>;
}

export const SecurityAccessModal: React.FC<SecurityAccessModalProps> = ({
  visible,
  onClose,
  onRevokeOthers,
}) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [passwordChangedSuccess, setPasswordChangedSuccess] = useState(false);

  if (!visible) return null;

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setCurrentPasswordError(null);
    setNewPasswordError(null);
    setConfirmPasswordError(null);
    setGeneralError(null);
    setPasswordChangedSuccess(false);
    onClose();
  };

  const handleChangePassword = async () => {
    if (isSaving) return;

    setCurrentPasswordError(null);
    setNewPasswordError(null);
    setConfirmPasswordError(null);
    setGeneralError(null);

    let hasError = false;

    if (!currentPassword) {
      setCurrentPasswordError('Informe a sua senha atual.');
      hasError = true;
    }

    if (!newPassword) {
      setNewPasswordError('Informe a nova senha.');
      hasError = true;
    } else {
      if (newPassword.length < 8) {
        setNewPasswordError('A nova senha deve ter no mínimo 8 caracteres.');
        hasError = true;
      } else {
        const hasLetter = /[a-zA-Z]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);
        if (!hasLetter || !hasNumber) {
          setNewPasswordError('A nova senha deve conter letras e números.');
          hasError = true;
        } else if (currentPassword && newPassword === currentPassword) {
          setNewPasswordError('A nova senha não pode ser igual à senha atual.');
          hasError = true;
        }
      }
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Confirme a nova senha.');
      hasError = true;
    } else if (newPassword && confirmPassword !== newPassword) {
      setConfirmPasswordError('A confirmação não coincide com a nova senha.');
      hasError = true;
    }

    if (hasError) return;

    try {
      setIsSaving(true);
      if (user?.id) {
        await userService.changePassword(user.id, currentPassword, newPassword);
      } else {
        const res = await supabaseAuthService.updatePassword(newPassword);
        if (!res.success) throw new Error(res.message);
      }

      showToast({ message: 'Senha alterada', type: 'success' });
      setPasswordChangedSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setGeneralError(err.message || 'Erro ao alterar senha. Verifique sua senha atual.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E0E5E2',
            },
          ]}
        >
          {/* Cabeçalho */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <KeyRound size={20} color="#247B74" strokeWidth={1.75} style={{ marginRight: 8 }} />
              <Text
                accessibilityRole="header"
                aria-level={2}
                style={[styles.title, { color: isDark ? colors.text : '#1F2927' }]}
              >
                Senha e acesso
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar janela"
              style={styles.closeBtn}
            >
              <X size={20} color={isDark ? colors.text : '#1F2927'} strokeWidth={1.75} />
            </TouchableOpacity>
          </View>

          {passwordChangedSuccess ? (
            <View style={styles.successContainer}>
              <CheckCircle2 size={48} color="#247B74" strokeWidth={1.75} style={{ marginBottom: 12 }} />
              <Text style={[styles.successTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                Senha alterada
              </Text>
              <Text style={[styles.successDesc, { color: isDark ? colors.textMuted : '#68736F' }]}>
                Sua credencial de acesso foi atualizada com segurança.
              </Text>

              {onRevokeOthers && (
                <TouchableOpacity
                  onPress={async () => {
                    await onRevokeOthers();
                    handleClose();
                  }}
                  style={[styles.revokeOthersBtn, { borderColor: '#247B74' }]}
                >
                  <Text style={styles.revokeOthersBtnText}>Desconectar outras sessões ativas</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleClose}
                style={styles.doneBtn}
              >
                <Text style={styles.doneBtnText}>Concluir</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.subtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
                Para sua segurança, informe sua senha atual antes de definir uma nova senha.
              </Text>

              {generalError && (
                <View style={styles.generalErrorBanner}>
                  <AlertCircle size={16} color="#C84E45" style={{ marginRight: 6 }} />
                  <Text style={styles.generalErrorText}>{generalError}</Text>
                </View>
              )}

              {/* 1. Senha atual */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                  Senha atual <Text style={{ color: '#C84E45' }}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      borderColor: currentPasswordError ? '#C84E45' : isDark ? colors.border : '#DFE4E1',
                      backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    },
                  ]}
                >
                  <TextInput
                    value={currentPassword}
                    onChangeText={(val) => {
                      setCurrentPassword(val);
                      if (currentPasswordError) setCurrentPasswordError(null);
                      if (generalError) setGeneralError(null);
                    }}
                    placeholder="Digite sua senha atual"
                    placeholderTextColor="#8F9B97"
                    secureTextEntry={!showCurrentPassword}
                    style={[styles.textInput, { color: isDark ? colors.text : '#1F2927' }]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    accessibilityRole="button"
                    accessibilityLabel={showCurrentPassword ? 'Ocultar senha atual' : 'Mostrar senha atual'}
                    style={styles.eyeBtn}
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={18} color="#68736F" strokeWidth={1.75} />
                    ) : (
                      <Eye size={18} color="#68736F" strokeWidth={1.75} />
                    )}
                  </TouchableOpacity>
                </View>
                {currentPasswordError && (
                  <View style={styles.errorRow}>
                    <AlertCircle size={14} color="#C84E45" style={{ marginRight: 4 }} />
                    <Text style={styles.fieldErrorText}>{currentPasswordError}</Text>
                  </View>
                )}
              </View>

              {/* 2. Nova senha */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                  Nova senha <Text style={{ color: '#C84E45' }}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      borderColor: newPasswordError ? '#C84E45' : isDark ? colors.border : '#DFE4E1',
                      backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    },
                  ]}
                >
                  <TextInput
                    value={newPassword}
                    onChangeText={(val) => {
                      setNewPassword(val);
                      if (newPasswordError) setNewPasswordError(null);
                      if (generalError) setGeneralError(null);
                    }}
                    placeholder="Mínimo 8 caracteres (letras e números)"
                    placeholderTextColor="#8F9B97"
                    secureTextEntry={!showNewPassword}
                    style={[styles.textInput, { color: isDark ? colors.text : '#1F2927' }]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    accessibilityRole="button"
                    accessibilityLabel={showNewPassword ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                    style={styles.eyeBtn}
                  >
                    {showNewPassword ? (
                      <EyeOff size={18} color="#68736F" strokeWidth={1.75} />
                    ) : (
                      <Eye size={18} color="#68736F" strokeWidth={1.75} />
                    )}
                  </TouchableOpacity>
                </View>
                {newPasswordError && (
                  <View style={styles.errorRow}>
                    <AlertCircle size={14} color="#C84E45" style={{ marginRight: 4 }} />
                    <Text style={styles.fieldErrorText}>{newPasswordError}</Text>
                  </View>
                )}
              </View>

              {/* 3. Confirmar nova senha */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                  Confirmar nova senha <Text style={{ color: '#C84E45' }}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      borderColor: confirmPasswordError ? '#C84E45' : isDark ? colors.border : '#DFE4E1',
                      backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    },
                  ]}
                >
                  <TextInput
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      if (confirmPasswordError) setConfirmPasswordError(null);
                      if (generalError) setGeneralError(null);
                    }}
                    placeholder="Repita a nova senha"
                    placeholderTextColor="#8F9B97"
                    secureTextEntry={!showConfirmPassword}
                    style={[styles.textInput, { color: isDark ? colors.text : '#1F2927' }]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    accessibilityRole="button"
                    accessibilityLabel={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                    style={styles.eyeBtn}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} color="#68736F" strokeWidth={1.75} />
                    ) : (
                      <Eye size={18} color="#68736F" strokeWidth={1.75} />
                    )}
                  </TouchableOpacity>
                </View>
                {confirmPasswordError && (
                  <View style={styles.errorRow}>
                    <AlertCircle size={14} color="#C84E45" style={{ marginRight: 4 }} />
                    <Text style={styles.fieldErrorText}>{confirmPasswordError}</Text>
                  </View>
                )}
              </View>

              {/* Botões */}
              <View style={styles.footerRow}>
                <TouchableOpacity
                  onPress={handleClose}
                  disabled={isSaving}
                  style={[styles.cancelBtn, { borderColor: isDark ? colors.border : '#E0E5E2' }]}
                >
                  <Text style={[styles.cancelBtnText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleChangePassword}
                  disabled={isSaving}
                  style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveBtnText}>Alterar senha</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  generalErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEDEC',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  generalErrorText: {
    fontSize: 13,
    color: '#C84E45',
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputContainer: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#C84E45',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveBtn: {
    flex: 1.4,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#247B74',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  successTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  successDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  revokeOthersBtn: {
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    width: '100%',
  },
  revokeOthersBtnText: {
    color: '#247B74',
    fontSize: 13,
    fontWeight: '600',
  },
  doneBtn: {
    height: 44,
    borderRadius: 8,
    backgroundColor: '#247B74',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
