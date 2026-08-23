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
  Smartphone,
  Laptop,
  Tablet,
  CheckCircle2,
  Trash2,
  Shield,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppButton } from '../ui/AppButton';
import { UserSession } from '../../types';
import { formatDateTime } from '../../utils/date';
import { useToast } from '../ui/Toast';

export interface SessionsModalProps {
  visible: boolean;
  sessions: UserSession[];
  onClose: () => void;
  onRevokeSession: (sessionId: string) => Promise<void>;
  onRevokeOthers: () => Promise<void>;
}

export const SessionsModal: React.FC<SessionsModalProps> = ({
  visible,
  sessions,
  onClose,
  onRevokeSession,
  onRevokeOthers,
}) => {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const [isRevoking, setIsRevoking] = useState(false);

  if (!visible) return null;

  const handleRevokeOthers = async () => {
    try {
      setIsRevoking(true);
      await onRevokeOthers();
      showToast({ message: 'Todas as outras sessões foram desconectadas.', type: 'success' });
    } catch {
      showToast({ message: 'Erro ao desconectar outras sessões.', type: 'error' });
    } finally {
      setIsRevoking(false);
    }
  };

  const getDeviceIcon = (type: string) => {
    if (type === 'desktop') return Laptop;
    if (type === 'tablet') return Tablet;
    return Smartphone;
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
              <Text style={[styles.title, { color: '#173D3B' }]}>
                Sessões e dispositivos
              </Text>
              <Text style={[styles.subtitle, { color: '#667775' }]}>
                {sessions.length} {sessions.length === 1 ? 'dispositivo conectado' : 'dispositivos conectados'}
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

          {/* Lista de Sessões */}
          <ScrollView style={{ maxHeight: 300, marginBottom: 14 }}>
            {sessions.map((sess) => {
              const Icon = getDeviceIcon(sess.deviceType);
              return (
                <View
                  key={sess.id}
                  style={[
                    styles.sessionRow,
                    {
                      backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFA',
                      borderColor: isDark ? colors.border : '#EBF1EF',
                    },
                  ]}
                >
                  <View style={[styles.deviceIconCircle, { backgroundColor: isDark ? colors.surface : '#E7F3EF' }]}>
                    <Icon size={18} color="#2F7F7C" />
                  </View>

                  <View style={{ flex: 1, paddingHorizontal: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.sessionBrowser, { color: '#173D3B' }]}>
                        {sess.browser} ({sess.os})
                      </Text>
                      {sess.isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>Este dispositivo</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.sessionMeta, { color: '#667775' }]}>
                      Último acesso: {formatDateTime(sess.lastActiveAt)}
                    </Text>
                  </View>

                  {!sess.isCurrent && (
                    <TouchableOpacity
                      onPress={() => onRevokeSession(sess.id)}
                      accessibilityRole="button"
                      accessibilityLabel="Desconectar dispositivo"
                      style={styles.revokeBtn}
                    >
                      <Text style={styles.revokeBtnText}>Desconectar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Ações */}
          <View style={styles.actionsRow}>
            {sessions.length > 1 && (
              <AppButton
                title="Encerrar Outras Sessões"
                variant="outline"
                size="md"
                isLoading={isRevoking}
                onPress={handleRevokeOthers}
                style={{ marginBottom: 8 }}
              />
            )}
            <AppButton
              title="Fechar"
              variant="primary"
              size="md"
              onPress={onClose}
            />
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  deviceIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionBrowser: {
    fontSize: 13,
    fontWeight: '700',
  },
  currentBadge: {
    backgroundColor: '#E7F3EF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2F7F7C',
  },
  sessionMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  revokeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FDF0F0',
  },
  revokeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B84C4C',
  },
  actionsRow: {
    marginTop: 4,
  },
});
