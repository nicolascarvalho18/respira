import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  Upload,
  Trash2,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { processAvatarImage } from '../../utils/imageProcessor';

export interface AvatarPickerModalProps {
  visible: boolean;
  currentAvatarUrl?: string | null;
  userName: string;
  onClose: () => void;
  onSelectAvatar: (avatarUrl: string | null, file?: Blob | File) => Promise<void>;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  visible,
  currentAvatarUrl,
  userName,
  onClose,
  onSelectAvatar,
}) => {
  const { colors, isDark } = useTheme();
  const fileInputRef = useRef<any>(null);

  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(currentAvatarUrl || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const initials = (userName || 'U')
    .trim()
    .charAt(0)
    .toUpperCase() || 'U';

  const handleFileChange = async (event: any) => {
    setErrorMessage(null);
    const file = event.target?.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Formato inválido. Selecione arquivos JPG, PNG ou WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('O arquivo deve ter no máximo 5MB antes do processamento.');
      return;
    }

    try {
      const processed = await processAvatarImage(file);
      setSelectedFile(processed.blob);
      setPreviewUri(processed.previewUrl);
    } catch (err: any) {
      console.warn('[AvatarPickerModal] Image processing notice, using raw file:', err);
      setSelectedFile(file);
      if (typeof URL !== 'undefined' && URL.createObjectURL) {
        setPreviewUri(URL.createObjectURL(file));
      }
    }
  };

  const handleTriggerUpload = () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUri(null);
    setErrorMessage(null);
  };

  const handleSave = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      setErrorMessage(null);
      await onSelectAvatar(previewUri, selectedFile || undefined);
      onClose();
    } catch (err: any) {
      console.error('[AvatarPickerModal Error]:', err);
      setErrorMessage('Não foi possível atualizar seu perfil. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible) return null;

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
            styles.modalCard,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E0E5E2',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={[styles.modalTitle, { color: isDark ? colors.text : '#1F2927' }]}
            >
              Foto de perfil
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

          {/* Hidden File Input for Web */}
          {Platform.OS === 'web' && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          )}

          {/* Avatar Preview */}
          <View style={styles.previewContainer}>
            {previewUri ? (
              <Image
                source={{ uri: previewUri }}
                accessibilityLabel={`Foto de perfil de ${userName}`}
                style={styles.avatarImage}
              />
            ) : (
              <View style={[styles.avatarInitials, { backgroundColor: isDark ? '#1C3833' : '#EDF7F5' }]}>
                <Text style={styles.initialsText}>{initials}</Text>
              </View>
            )}
          </View>

          {errorMessage && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}

          <Text style={[styles.helperText, { color: isDark ? colors.textMuted : '#68736F' }]}>
            Formatos aceitos: JPG, PNG e WebP (máx. 5MB).
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionsBlock}>
            <TouchableOpacity
              onPress={handleTriggerUpload}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Escolher foto do dispositivo"
              style={[styles.uploadBtn, { borderColor: '#247B74' }]}
            >
              <Upload size={18} color="#247B74" strokeWidth={1.75} style={{ marginRight: 8 }} />
              <Text style={styles.uploadBtnText}>Escolher foto do dispositivo</Text>
            </TouchableOpacity>

            {previewUri && (
              <TouchableOpacity
                onPress={handleRemovePhoto}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Remover foto atual"
                style={styles.removeBtn}
              >
                <Trash2 size={16} color="#C84E45" strokeWidth={1.75} style={{ marginRight: 6 }} />
                <Text style={styles.removeBtnText}>Remover foto e usar iniciais</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bottom Controls */}
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
              disabled={isSaving}
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
            >
              {isSaving ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Salvando foto...</Text>
                </View>
              ) : (
                <Text style={styles.saveBtnText}>Salvar foto</Text>
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
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#247B74',
  },
  avatarInitials: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#247B74',
  },
  initialsText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#247B74',
  },
  errorText: {
    color: '#C84E45',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  helperText: {
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 8,
  },
  actionsBlock: {
    gap: 10,
    marginVertical: 14,
  },
  uploadBtn: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  uploadBtnText: {
    color: '#247B74',
    fontSize: 14,
    fontWeight: '600',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  removeBtnText: {
    color: '#C84E45',
    fontSize: 13,
    fontWeight: '500',
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
