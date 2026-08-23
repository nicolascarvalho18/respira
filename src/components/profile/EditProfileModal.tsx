import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { X, User as UserIcon, Mail } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../ui/AppInput';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/user/userService';
import { useToast } from '../ui/Toast';

export interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
}) => {
  const { user, updateUser } = useAuth();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  if (!visible) return null;

  const handleSave = async () => {
    if (!name.trim() || name.trim().length < 2) {
      showToast({ message: 'O nome deve ter pelo menos 2 caracteres.', type: 'error' });
      return;
    }

    if (!user) return;

    try {
      setIsSaving(true);
      const updated = await userService.updateProfile(user.id, { name: name.trim() });
      await updateUser({ name: updated.name });
      showToast({ message: 'Perfil atualizado com sucesso.', type: 'success' });
      onClose();
    } catch (err: any) {
      showToast({ message: err.message || 'Erro ao atualizar perfil.', type: 'error' });
    } finally {
      setIsSaving(false);
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
            <Text style={[styles.title, { color: '#173D3B' }]}>Editar Perfil</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <X size={20} color="#8C9E9B" />
            </TouchableOpacity>
          </View>

          {/* Nome */}
          <AppInput
            label="Nome Completo"
            value={name}
            onChangeText={setName}
            placeholder="Digite seu nome"
            autoFocus
          />

          {/* E-mail (Informativo / não editável aqui) */}
          <AppInput
            label="E-mail"
            value={user?.email || ''}
            editable={false}
            placeholder="seu.email@exemplo.com"
            helperText="Para alterar seu e-mail, utilize a seção de Segurança e Acesso."
          />

          {/* Ações */}
          <View style={styles.actionsRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <AppButton
                title="Cancelar"
                variant="outline"
                size="md"
                onPress={onClose}
                disabled={isSaving}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <AppButton
                title="Salvar"
                size="md"
                isLoading={isSaving}
                onPress={handleSave}
              />
            </View>
          </View>
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
    maxWidth: 420,
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
});
