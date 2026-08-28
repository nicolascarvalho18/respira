import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  X,
  Smartphone,
  Laptop,
  Tablet,
  LogOut,
  Clock,
  Globe,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
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

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [confirmSessionId, setConfirmSessionId] = useState<string | null>(null);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);

  if (!visible) return null;

  const currentSession = sessions.find((s) => s.isCurrent) || sessions[0];
  const otherSessions = sessions.filter((s) => !s.isCurrent && s.id !== currentSession?.id);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'desktop':
        return <Laptop size={20} color={isDark ? colors.text : '#1F2927'} strokeWidth={1.75} />;
      case 'tablet':
        return <Tablet size={20} color={isDark ? colors.text : '#1F2927'} strokeWidth={1.75} />;
      case 'mobile':
      default:
        return <Smartphone size={20} color={isDark ? colors.text : '#1F2927'} strokeWidth={1.75} />;
    }
  };

  const handleConfirmRevokeSingle = async () => {
    if (!confirmSessionId) return;
    try {
      setRevokingId(confirmSessionId);
      await onRevokeSession(confirmSessionId);
      setConfirmSessionId(null);
    } catch {
      showToast({ message: 'Erro ao desconectar sessão.', type: 'error' });
    } finally {
      setRevokingId(null);
    }
  };

  const handleConfirmRevokeAll = async () => {
    try {
      setIsRevokingAll(true);
      await onRevokeOthers();
      setConfirmRevokeAll(false);
    } catch {
      showToast({ message: 'Erro ao desconectar outras sessões.', type: 'error' });
    } finally {
      setIsRevokingAll(false);
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
          {/* Cabeçalho */}
          <View style={styles.header}>
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={[styles.title, { color: isDark ? colors.text : '#1F2927' }]}
            >
              Sessões ativas
            </Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar janela"
              style={styles.closeBtn}
            >
              <X size={20} color={isDark ? colors.text : '#1F2927'} strokeWidth={1.75} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
            Dispositivos conectados à sua conta com acesso recente.
          </Text>

          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            {/* 1. Sessão Atual */}
            {currentSession && (
              <View style={styles.sessionGroup}>
                <Text style={[styles.groupLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                  Sessão atual
                </Text>

                <View
                  style={[
                    styles.sessionCard,
                    {
                      borderColor: '#247B74',
                      backgroundColor: isDark ? colors.surfaceSecondary : '#F2F8F6',
                    },
                  ]}
                >
                  <View style={styles.deviceIconWrapper}>
                    {getDeviceIcon(currentSession.deviceType)}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.deviceNameRow}>
                      <Text style={[styles.deviceTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                        {currentSession.browser || 'Navegador Web'} • {currentSession.os || 'Sistema'}
                      </Text>
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Este dispositivo</Text>
                      </View>
                    </View>

                    <Text style={[styles.deviceMeta, { color: isDark ? colors.textMuted : '#68736F' }]}>
                      Ativo agora • {currentSession.ipAddressMasked || 'IP protegido'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* 2. Outras Sessões */}
            <View style={styles.sessionGroup}>
              <View style={styles.otherHeaderRow}>
                <Text style={[styles.groupLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                  Outros dispositivos ({otherSessions.length})
                </Text>

                {otherSessions.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setConfirmRevokeAll(true)}
                    style={styles.revokeAllInlineBtn}
                  >
                    <Text style={styles.revokeAllInlineText}>Encerrar todas as outras</Text>
                  </TouchableOpacity>
                )}
              </View>

              {otherSessions.length === 0 ? (
                <View style={styles.emptyOtherBox}>
                  <Text style={[styles.emptyOtherText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                    Nenhum outro dispositivo conectado no momento.
                  </Text>
                </View>
              ) : (
                otherSessions.map((session) => (
                  <View
                    key={session.id}
                    style={[
                      styles.sessionCard,
                      {
                        borderColor: isDark ? colors.border : '#E0E5E2',
                        backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                      },
                    ]}
                  >
                    <View style={styles.deviceIconWrapper}>
                      {getDeviceIcon(session.deviceType)}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.deviceTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                        {session.browser || 'Navegador Web'} • {session.os || 'Dispositivo'}
                      </Text>
                      <Text style={[styles.deviceMeta, { color: isDark ? colors.textMuted : '#68736F' }]}>
                        Último acesso: {formatDateTime(session.lastActiveAt)}
                      </Text>
                      <Text style={[styles.deviceMetaSub, { color: isDark ? colors.textMuted : '#8F9B97' }]}>
                        {session.ipAddressMasked || 'IP protegido'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => setConfirmSessionId(session.id)}
                      disabled={revokingId === session.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Encerrar sessão de ${session.browser}`}
                      style={styles.disconnectBtn}
                    >
                      {revokingId === session.id ? (
                        <ActivityIndicator size="small" color="#C84E45" />
                      ) : (
                        <Text style={styles.disconnectBtnText}>Encerrar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          {/* Modal de Confirmação: Desconectar 1 Sessão */}
          {confirmSessionId && (
            <View style={styles.confirmSubOverlay}>
              <View
                style={[
                  styles.confirmSubCard,
                  {
                    backgroundColor: isDark ? colors.surface : '#FFFFFF',
                    borderColor: isDark ? colors.border : '#E0E5E2',
                  },
                ]}
              >
                <Text style={[styles.confirmTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Encerrar sessão?
                </Text>
                <Text style={[styles.confirmDesc, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  O dispositivo precisará fazer login novamente para acessar o aplicativo.
                </Text>
                <View style={styles.confirmBtnRow}>
                  <TouchableOpacity
                    onPress={() => setConfirmSessionId(null)}
                    style={[styles.cancelBtn, { borderColor: isDark ? colors.border : '#E0E5E2' }]}
                  >
                    <Text style={[styles.cancelBtnText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleConfirmRevokeSingle}
                    style={[styles.saveBtn, { backgroundColor: '#C84E45' }]}
                  >
                    <Text style={styles.saveBtnText}>Encerrar sessão</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Modal de Confirmação: Desconectar Todas as Outras */}
          {confirmRevokeAll && (
            <View style={styles.confirmSubOverlay}>
              <View
                style={[
                  styles.confirmSubCard,
                  {
                    backgroundColor: isDark ? colors.surface : '#FFFFFF',
                    borderColor: isDark ? colors.border : '#E0E5E2',
                  },
                ]}
              >
                <Text style={[styles.confirmTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Encerrar todas as outras sessões?
                </Text>
                <Text style={[styles.confirmDesc, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  Todos os outros dispositivos conectados serão desconectados imediatamente.
                </Text>
                <View style={styles.confirmBtnRow}>
                  <TouchableOpacity
                    onPress={() => setConfirmRevokeAll(false)}
                    style={[styles.cancelBtn, { borderColor: isDark ? colors.border : '#E0E5E2' }]}
                  >
                    <Text style={[styles.cancelBtnText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleConfirmRevokeAll}
                    disabled={isRevokingAll}
                    style={[styles.saveBtn, { backgroundColor: '#C84E45' }]}
                  >
                    {isRevokingAll ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveBtnText}>Encerrar todas</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Botão Fechar */}
          <View style={{ marginTop: 16 }}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.doneBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F2F8F6' }]}
            >
              <Text style={[styles.doneBtnText, { color: isDark ? colors.text : '#1F2927' }]}>Fechar</Text>
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
    maxWidth: 520,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
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
    lineHeight: 18,
    marginBottom: 16,
  },
  sessionGroup: {
    marginBottom: 16,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  otherHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  revokeAllInlineBtn: {
    paddingVertical: 2,
  },
  revokeAllInlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C84E45',
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  deviceIconWrapper: {
    padding: 8,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  deviceTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  currentBadge: {
    backgroundColor: '#EDF7F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#247B74',
  },
  deviceMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  deviceMetaSub: {
    fontSize: 11,
    marginTop: 1,
  },
  disconnectBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F8D7DA',
    backgroundColor: '#FDF2F2',
  },
  disconnectBtnText: {
    color: '#C84E45',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyOtherBox: {
    padding: 14,
    alignItems: 'center',
    borderRadius: 8,
  },
  emptyOtherText: {
    fontSize: 13,
    textAlign: 'center',
  },
  confirmSubOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 10,
  },
  confirmSubCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 18,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  confirmDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  saveBtn: {
    flex: 1.2,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  doneBtn: {
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
