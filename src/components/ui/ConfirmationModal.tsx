import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppButton } from './AppButton';

export interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmTitle?: string;
  cancelTitle?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmTitle = 'Confirmar',
  cancelTitle = 'Cancelar',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const { colors } = useTheme();

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
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.title,
              {
                color: isDestructive ? colors.error : colors.text,
              },
            ]}
          >
            {title}
          </Text>

          <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>

          <View style={styles.buttonRow}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
