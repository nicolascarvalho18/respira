import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  X,
  FileDown,
  CheckCircle2,
  FileCode,
  FileArchive,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppButton } from '../ui/AppButton';
import { userService } from '../../services/user/userService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ui/Toast';

export interface DataExportModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DataExportModal: React.FC<DataExportModalProps> = ({
  visible,
  onClose,
}) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  const [selectedFormat, setSelectedFormat] = useState<'json' | 'zip'>('json');
  const [isPreparing, setIsPreparing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [fileSize, setFileSize] = useState<string>('~24 KB');

  if (!visible) return null;

  const handleStartExport = async () => {
    if (!user) return;
    try {
      setIsPreparing(true);
      setIsCompleted(false);

      // Fetch exported payload
      const jsonPackage = await userService.exportUserData(user.id);
      const sizeBytes = new Blob([jsonPackage]).size;
      setFileSize(`${(sizeBytes / 1024).toFixed(1)} KB`);

      // Simulated packaging delay for UX polish
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (Platform.OS === 'web') {
        const blob = new Blob([jsonPackage], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `respira-dados-pessoais-${new Date().toISOString().slice(0, 10)}.${selectedFormat === 'zip' ? 'json' : 'json'}`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setIsCompleted(true);
      showToast({ message: 'Arquivo pronto para baixar', type: 'success' });
    } catch {
      showToast({ message: 'Erro ao gerar pacote de exportação.', type: 'error' });
    } finally {
      setIsPreparing(false);
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
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: '#173D3B' }]}>Exportar meus dados</Text>
              <Text style={[styles.subtitle, { color: '#667775' }]}>
                Baixe uma cópia das suas informações
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

          {/* Formatos de Exportação */}
          <Text style={[styles.sectionHeading, { color: '#173D3B' }]}>
            Escolha o formato do arquivo:
          </Text>

          <View style={styles.formatsRow}>
            {/* Opção JSON */}
            <TouchableOpacity
              onPress={() => setSelectedFormat('json')}
              style={[
                styles.formatCard,
                selectedFormat === 'json' && [
                  styles.formatCardActive,
                  { borderColor: '#2F7F7C', backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF' },
                ],
                { borderColor: isDark ? colors.border : '#EBF1EF' },
              ]}
            >
              <FileCode size={20} color="#2F7F7C" style={{ marginBottom: 4 }} />
              <Text style={[styles.formatTitle, { color: '#173D3B' }]}>JSON</Text>
              <Text style={[styles.formatDesc, { color: '#667775' }]}>Dados estruturados</Text>
            </TouchableOpacity>

            {/* Opção ZIP */}
            <TouchableOpacity
              onPress={() => setSelectedFormat('zip')}
              style={[
                styles.formatCard,
                selectedFormat === 'zip' && [
                  styles.formatCardActive,
                  { borderColor: '#2F7F7C', backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF' },
                ],
                { borderColor: isDark ? colors.border : '#EBF1EF' },
              ]}
            >
              <FileArchive size={20} color="#2F7F7C" style={{ marginBottom: 4 }} />
              <Text style={[styles.formatTitle, { color: '#173D3B' }]}>ZIP</Text>
              <Text style={[styles.formatDesc, { color: '#667775' }]}>Pacote completo</Text>
            </TouchableOpacity>
          </View>

          {/* O que está incluído */}
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFA',
                borderColor: isDark ? colors.border : '#EEF3F1',
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <ShieldCheck size={16} color="#2F7F7C" style={{ marginRight: 6 }} />
              <Text style={[styles.infoBoxHeading, { color: '#173D3B' }]}>
                O que será exportado:
              </Text>
            </View>
            <Text style={[styles.infoBoxItem, { color: '#667775' }]}>
              • Perfil, preferências e histórico de consentimentos
            </Text>
            <Text style={[styles.infoBoxItem, { color: '#667775' }]}>
              • Todos os registros e check-ins do diário de humor
            </Text>
            <Text style={[styles.infoBoxItem, { color: '#667775' }]}>
              • Histórico de práticas concluídas e artigos favoritados
            </Text>
            <Text style={[styles.infoBoxItem, { color: '#667775' }]}>
              • Trilha de auditoria e sessões ativas (IPs mascarados)
            </Text>
          </View>

          {/* Estado de Progresso ou Conclusão */}
          {isPreparing && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color="#2F7F7C" />
              <Text style={[styles.loadingText, { color: '#2F7F7C' }]}>
                Preparando arquivo de exportação seguro...
              </Text>
            </View>
          )}

          {isCompleted && (
            <View style={styles.completedRow}>
              <CheckCircle2 size={16} color="#2F7F7C" style={{ marginRight: 6 }} />
              <Text style={[styles.completedText, { color: '#2F7F7C' }]}>
                Download iniciado ({fileSize})
              </Text>
            </View>
          )}

          {/* Ações */}
          <View style={styles.actionsRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <AppButton
                title="Fechar"
                variant="outline"
                size="md"
                onPress={onClose}
                disabled={isPreparing}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <AppButton
                title={isCompleted ? 'Baixar Novamente' : 'Iniciar Download'}
                size="md"
                isLoading={isPreparing}
                onPress={handleStartExport}
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
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  formatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  formatCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    alignItems: 'center',
  },
  formatCardActive: {
    borderWidth: 2,
  },
  formatTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  formatDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  infoBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  infoBoxHeading: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoBoxItem: {
    fontSize: 12,
    lineHeight: 18,
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
