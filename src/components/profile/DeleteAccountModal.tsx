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
import { X, AlertTriangle, ChevronRight, Eye, EyeOff, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

export interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmDelete: (password: string) => Promise<void>;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  onClose,
  onConfirmDelete,
}) => {
  const { colors, isDark } = useTheme();

  // Etapa 1: Resumo dos dados | Etapa 2: Confirmação por senha e frase
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!visible) return null;

  const handleClose = () => {
    setStep(1);
    setConfirmationInput('');
    setPasswordInput('');
    setErrorMessage(null);
    setIsSubmitting(false);
    onClose();
  };

  const isPhraseValid = confirmationInput.trim().toUpperCase() === 'EXCLUIR MINHA CONTA';
  const isFormValid = isPhraseValid && passwordInput.trim().length > 0;

  const handleDelete = async () => {
    if (!isFormValid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onConfirmDelete(passwordInput);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao excluir conta. Verifique sua senha atual.');
    } finally {
      setIsSubmitting(false);
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
              <AlertTriangle size={20} color="#C84E45" strokeWidth={1.75} style={{ marginRight: 8 }} />
              <Text
                accessibilityRole="header"
                aria-level={2}
                style={[styles.title, { color: '#C84E45' }]}
              >
                Excluir conta?
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              style={styles.closeBtn}
            >
              <X size={20} color={isDark ? colors.text : '#1F2927'} strokeWidth={1.75} />
            </TouchableOpacity>
          </View>

          {step === 1 ? (
            /* ETAPA 1: Explicação e Dados Afetados */
            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.mainWarning, { color: isDark ? colors.text : '#1F2927' }]}>
                Esta ação exclui permanentemente sua conta e os dados associados. Não será possível desfazer.
              </Text>

              <Text style={[styles.sectionHeading, { color: isDark ? colors.text : '#1F2927' }]}>
                Dados que serão permanentemente removidos:
              </Text>

              <View
                style={[
                  styles.dataListCard,
                  {
                    backgroundColor: isDark ? colors.surfaceSecondary : '#FDF7F7',
                    borderColor: isDark ? colors.border : '#F8D7DA',
                  },
                ]}
              >
                {[
                  'Perfil e dados pessoais',
                  'Registros do Diário e histórico de humor',
                  'Preferências e configurações',
                  'Progresso e histórico das práticas',
                  'Favoritos salvos',
                  'Conversas salvas com a assistente',
                  'Sessões e dispositivos conectados',
                ].map((item, idx) => (
                  <View key={idx} style={styles.dataListItem}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={[styles.bulletText, { color: isDark ? colors.text : '#1F2927' }]}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.footerRow}>
                <TouchableOpacity
                  onPress={handleClose}
                  style={[styles.cancelBtn, { borderColor: isDark ? colors.border : '#E0E5E2' }]}
                >
                  <Text style={[styles.cancelBtnText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStep(2)}
                  style={[styles.nextBtn, { backgroundColor: '#C84E45' }]}
                >
                  <Text style={styles.nextBtnText}>Continuar</Text>
                  <ChevronRight size={16} color="#FFFFFF" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            /* ETAPA 2: Confirmação com Senha e Frase */
            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.descText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                Para confirmar a exclusão definitiva, informe sua senha e digite a frase de segurança abaixo.
              </Text>

              {/* Senha atual */}
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                  Senha atual:
                </Text>
                <View
                  style={[
                    styles.inputWrap,
                    {
                      borderColor: isDark ? colors.border : '#DFE4E1',
                      backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    },
                  ]}
                >
                  <TextInput
                    value={passwordInput}
                    onChangeText={setPasswordInput}
                    placeholder="Digite sua senha"
                    placeholderTextColor="#8F9B97"
                    secureTextEntry={!showPassword}
                    style={[styles.textInput, { color: isDark ? colors.text : '#1F2927' }]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#68736F" strokeWidth={1.75} />
                    ) : (
                      <Eye size={18} color="#68736F" strokeWidth={1.75} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Frase EXCLUIR MINHA CONTA */}
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                  Digite <Text style={{ fontWeight: '700', color: '#C84E45' }}>EXCLUIR MINHA CONTA</Text>:
                </Text>
                <TextInput
                  value={confirmationInput}
                  onChangeText={setConfirmationInput}
                  placeholder="EXCLUIR MINHA CONTA"
                  placeholderTextColor="#8F9B97"
                  autoCapitalize="characters"
                  style={[
                    styles.textInputFull,
                    {
                      color: isDark ? colors.text : '#1F2927',
                      borderColor: isPhraseValid ? '#247B74' : isDark ? colors.border : '#DFE4E1',
                      backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    },
                  ]}
                />
              </View>

              {errorMessage && (
                <Text style={styles.errorBanner}>{errorMessage}</Text>
              )}

              <View style={styles.footerRow}>
                <TouchableOpacity
                  onPress={() => setStep(1)}
                  disabled={isSubmitting}
                  style={[styles.cancelBtn, { borderColor: isDark ? colors.border : '#E0E5E2' }]}
                >
                  <Text style={[styles.cancelBtnText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                    Voltar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDelete}
                  disabled={!isFormValid || isSubmitting}
                  style={[
                    styles.deleteBtn,
                    (!isFormValid || isSubmitting) && { opacity: 0.4 },
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.deleteBtnText}>Excluir permanentemente</Text>
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
    marginBottom: 14,
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
  mainWarning: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
    fontWeight: '500',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  dataListCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 18,
    gap: 6,
  },
  dataListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletDot: {
    color: '#C84E45',
    fontSize: 16,
    lineHeight: 18,
    marginRight: 6,
  },
  bulletText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  descText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  formGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  inputWrap: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  textInputFull: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  eyeBtn: {
    padding: 4,
  },
  errorBanner: {
    color: '#C84E45',
    fontSize: 13,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
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
  nextBtn: {
    flex: 1.3,
    height: 44,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteBtn: {
    flex: 1.6,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#C84E45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
