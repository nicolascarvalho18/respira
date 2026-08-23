import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { AlertTriangle, Info, Trash2, X } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppButton } from './AppButton';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmTitle?: string;
  cancelTitle?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  icon?: 'warning' | 'info' | 'delete';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmTitle = 'Confirmar',
  cancelTitle = 'Cancelar',
  isDestructive = false,
  isLoading = false,
  icon = isDestructive ? 'delete' : 'info',
  onConfirm,
  onCancel,
}) => {
  const { colors, isDark } = useTheme();

  // Fechar com tecla ESC no ambiente Web
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onCancel]);

  if (!visible) return null;

  const renderIcon = () => {
    if (icon === 'delete') {
      return (
        <View style={[styles.iconCircle, { backgroundColor: isDark ? '#3D1C1C' : '#FDF0F0' }]}>
          <Trash2 size={24} color={colors.error} />
        </View>
      );
    } else if (icon === 'warning') {
      return (
        <View style={[styles.iconCircle, { backgroundColor: isDark ? '#3D251C' : '#FDF2EC' }]}>
          <AlertTriangle size={24} color={colors.warning} />
        </View>
      );
    } else {
      return (
        <View style={[styles.iconCircle, { backgroundColor: isDark ? '#192C3D' : '#EDF4F9' }]}>
          <Info size={24} color={colors.info} />
        </View>
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.dialogContainer,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
          accessibilityRole="alert"
          accessibilityLabel={title}
        >
          <TouchableOpacity
            onPress={onCancel}
            accessibilityLabel="Fechar diálogo"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.closeBtn}
          >
            <X size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.content}>
            {renderIcon()}
            <Text
              style={[
                styles.title,
                { color: isDestructive ? colors.error : colors.text },
              ]}
            >
              {title}
            </Text>
            <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
          </View>

          <View style={styles.actionsRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <AppButton
                title={cancelTitle}
                variant="outline"
                size="md"
                onPress={onCancel}
                disabled={isLoading}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <AppButton
                title={confirmTitle}
                variant={isDestructive ? 'danger' : 'primary'}
                size="md"
                isLoading={isLoading}
                onPress={onConfirm}
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
    backgroundColor: 'rgba(23, 43, 45, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 2,
    padding: 4,
  },
  content: {
    alignItems: 'center',
    marginVertical: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
});
