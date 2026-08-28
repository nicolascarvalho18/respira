import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { X, MessageCircle, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

export interface ChatHistoryModalProps {
  visible: boolean;
  saveHistory: boolean;
  onClose: () => void;
  onToggleSaveHistory: (value: boolean) => void;
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  visible,
  saveHistory,
  onClose,
  onToggleSaveHistory,
}) => {
  const { colors, isDark } = useTheme();
  const [localSave, setLocalSave] = useState(saveHistory);

  if (!visible) return null;

  const handleSave = () => {
    onToggleSaveHistory(localSave);
    onClose();
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
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={[styles.title, { color: isDark ? colors.text : '#1F2927' }]}
            >
              Histórico de conversas
            </Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              style={styles.closeBtn}
            >
              <X size={20} color={isDark ? colors.text : '#1F2927'} strokeWidth={1.75} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.description, { color: isDark ? colors.textMuted : '#68736F' }]}>
            Quando ativado, suas conversas com a Ana são salvas para você poder consultar orientações anteriores e manter a continuidade das suas sessões.
          </Text>

          <View
            style={[
              styles.settingRow,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F7F8F5',
                borderColor: isDark ? colors.border : '#E0E5E2',
              },
            ]}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.settingLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                Salvar novas conversas
              </Text>
              <Text style={[styles.settingSub, { color: isDark ? colors.textMuted : '#68736F' }]}>
                Armazena suas trocas de mensagens localmente
              </Text>
            </View>

            <Switch
              value={localSave}
              onValueChange={setLocalSave}
              trackColor={{ false: '#DFE4E1', true: '#247B74' }}
              thumbColor={Platform.OS === 'android' ? (localSave ? '#FFFFFF' : '#FFFFFF') : undefined}
            />
          </View>

          <View style={styles.privacyNote}>
            <ShieldCheck size={16} color="#247B74" strokeWidth={1.75} style={{ marginRight: 6 }} />
            <Text style={[styles.privacyNoteText, { color: isDark ? colors.textMuted : '#68736F' }]}>
              Seus dados são confidenciais e nunca compartilhados com terceiros.
            </Text>
          </View>

          <View style={styles.footerRow}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.cancelBtn, { borderColor: isDark ? colors.border : '#E0E5E2' }]}
            >
              <Text style={[styles.cancelBtnText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveBtn}
            >
              <Text style={styles.saveBtnText}>Concluir</Text>
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
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSub: {
    fontSize: 13,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  privacyNoteText: {
    fontSize: 12,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
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
    flex: 1,
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
});
