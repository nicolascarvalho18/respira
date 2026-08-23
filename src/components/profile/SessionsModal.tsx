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
  LogOut,
  Shield,
  Clock,
  Globe,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppButton } from '../ui/AppButton';
import { UserSession } from '../../types';
import { formatDateTime } from '../../utils/date';
import { useToast } from '../ui/Toast';
import { useAuthStore } from '../../store/authStore';

export interface SessionsModalProps {
  visible: boolean;
  sessions: UserSession[];
  onClose: () => void;
  onRevokeSession?: (sessionId: string) => Promise<void>;
  onRevokeOthers?: () => Promise<void>;
}

export const SessionsModal: React.FC<SessionsModalProps> = ({
  visible,
  sessions,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const { logout } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!visible) return null;

  const handleLogoutLocal = async () => {
    try {
      setIsProcessing(true);
      await logout('local');
      onClose();
      showToast({ message: 'Sessão encerrada neste dispositivo.', type: 'info' });
    } catch {
      showToast({ message: 'Erro ao encerrar sessão local.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogoutOthers = async () => {
    try {
      setIsProcessing(true);
      await logout('others');
      showToast({ message: 'Sessões encerradas em todos os outros dispositivos.', type: 'success' });
    } catch {
      showToast({ message: 'Erro ao encerrar outras sessões.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogoutGlobal = async () => {
    try {
      setIsProcessing(true);
      await logout('global');
      onClose();
      showToast({ message: 'Todas as sessões foram encerradas com sucesso.', type: 'info' });
    } catch {
      showToast({ message: 'Erro ao encerrar todas as sessões.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const getDeviceIcon = (type: string) => {
    if (type === 'desktop' || type === 'web') return Laptop;
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
              <Text style={[styles.title, { color: isDark ? colors.text : '#173D3B' }]}>
                Sessões e dispositivos
              </Text>
              <Text style={[styles.subtitle, { color: isDark ? colors.textMuted : '#667775' }]}>
                {sessions.length} {sessions.length === 1 ? 'dispositivo registrado' : 'dispositivos registrados'}
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

          {/* Lista de Dispositivos e Sessões */}
          <ScrollView style={{ maxHeight: 280, marginBottom: 14 }}>
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
                  <View
                    style={[
                      styles.deviceIconCircle,
                      { backgroundColor: isDark ? colors.surface : '#E7F3EF' },
                    ]}
                  >
                    <Icon size={18} color="#2F7F7C" />
                  </View>

                  <View style={{ flex: 1, paddingHorizontal: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[styles.sessionBrowser, { color: isDark ? colors.text : '#173D3B' }]}>
                        {sess.deviceName || `${sess.browser} (${sess.os})`}
                      </Text>
                      {sess.isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>Dispositivo atual</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.sessionMeta, { color: isDark ? colors.textMuted : '#667775' }]}>
                      SO: {sess.os || 'Desconhecido'} • Navegador: {sess.browser || 'App Nativo'}
                    </Text>
                    <Text style={[styles.sessionMetaDate, { color: isDark ? colors.textMuted : '#8C9E9B' }]}>
                      Última atividade: {formatDateTime(sess.lastActiveAt)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Aviso Legal de Segurança */}
          <View style={[styles.infoCallout, { backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF' }]}>
            <Shield size={14} color="#2F7F7C" style={{ marginRight: 6 }} />
            <Text style={[styles.infoCalloutText, { color: isDark ? colors.text : '#2F7F7C' }]}>
              As sessões são gerenciadas e revogadas de forma segura pelo Supabase Auth.
            </Text>
          </View>

          {/* Ações com os 3 Escopos Oficiais */}
          <View style={styles.actionsGroup}>
            <AppButton
              title="Encerrar sessão neste dispositivo"
              variant="outline"
              size="md"
              isLoading={isProcessing}
              onPress={handleLogoutLocal}
              style={{ marginBottom: 6 }}
            />

            {sessions.length > 1 && (
              <AppButton
                title="Encerrar sessões nos outros dispositivos"
                variant="outline"
                size="md"
                isLoading={isProcessing}
                onPress={handleLogoutOthers}
                style={{ marginBottom: 6 }}
              />
            )}

            <AppButton
              title="Encerrar todas as sessões"
              variant="danger"
              size="md"
              isLoading={isProcessing}
              onPress={handleLogoutGlobal}
              style={{ marginBottom: 6 }}
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
    marginBottom: 14,
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
  sessionMetaDate: {
    fontSize: 10,
    marginTop: 2,
  },
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  infoCalloutText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  actionsGroup: {
    gap: 2,
  },
});
