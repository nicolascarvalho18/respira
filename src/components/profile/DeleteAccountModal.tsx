import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { X, Trash2, AlertTriangle } from 'lucide-react-native';
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
  const [confirmationInput, setConfirmationInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!visible) return null;

  const isConfirmed = confirmationInput.trim().toUpperCase() === 'EXCLUIR';

  const handleDelete = async () => {
    if (!isConfirmed) {
      setErrorMessage('Digite "EXCLUIR" para confirmar.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onConfirmDelete(passwordInput);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao excluir conta. Verifique sua senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
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
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <AlertTriangle size={20} color="#C84E45" strokeWidth={1.75} style={{ marginRight: 8 }} />
              <Text
                accessibilityRole="header"
                aria-level={2}
                style={[styles.title, { color: '#C84E45' }]}
              >
                Excluir conta
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              style={styles.closeBtn}
            >
              <X size={20} color={isDark ? colors.text : '#1F2927'} strokeWidth={1.75} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.warningText, { color: isDark ? colors.text : '#1F2927' }]}>
            Esta ação é permanente e irreversível.
          </Text>

          <Text style={[styles.descText, { color: isDark ? colors.textMuted : '#68736F' }]}>
            Todos os seus registros de humor, conversas com a Ana, progresso de práticas e preferências serão permanentemente excluídos dos nossos servidores.
          </Text>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: isDark ? colors.text : '#1F2927' }]}>
              Digite <Text style={{ fontWeight: '700', color: '#C84E45' }}>EXCLUIR</Text> para confirmar:
            </Text>
            <TextInput
              value={confirmationInput}
              onChangeText={setConfirmationInput}
              placeholder="EXCLUIR"
              placeholderTextColor="#8F9B97"
              autoCapitalize="characters"
              style={[
                styles.textInput,
                {
                  color: isDark ? colors.text : '#1F2927',
                  borderColor: isDark ? colors.border : '#DFE4E1',
                  backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                },
              ]}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: isDark ? colors.text : '#1F2927' }]}>
              Confirme sua senha atual:
            </Text>
            <TextInput
              value={passwordInput}
              onChangeText={setPasswordInput}
              placeholder="Sua senha"
              placeholderTextColor="#8F9B97"
              secureTextEntry
              style={[
                styles.textInput,
                {
                  color: isDark ? colors.text : '#1F2927',
                  borderColor: isDark ? colors.border : '#DFE4E1',
                  backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                },
              ]}
            />
          </View>

          {errorMessage && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}

          <View style={styles.footerRow}>
            <TouchableOpacity
              onPress={onClose}
              disabled={isSubmitting}
              style={[styles.cancelBtn, { borderColor: isDark ? colors.border : '#E0E5E2' }]}
            >
              <Text style={[styles.cancelBtnText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              disabled={!isConfirmed || isSubmitting}
              style={[
                styles.deleteBtn,
                (!isConfirmed || isSubmitting) && { opacity: 0.5 },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.deleteBtnText}>Excluir permanentemente</Text>
              )}
            </TouchableOpacity>
          </View>
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
    maxWidth: 440,
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
  warningText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  descText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  errorText: {
    color: '#C84E45',
    fontSize: 13,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
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
  deleteBtn: {
    flex: 1.5,
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
