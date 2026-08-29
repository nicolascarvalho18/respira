import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { X, Camera, Trash2, Upload, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/user/userService';
import { useToast } from '../ui/Toast';
import { processAvatarImage } from '../../utils/imageProcessor';

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
  const fileInputRef = useRef<any>(null);

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | null>(user?.avatarUrl || null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(user?.avatarUrl || null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [bioError, setBioError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setSavedAvatarUrl(user.avatarUrl || null);
      setAvatarPreviewUrl(user.avatarUrl || null);
      setSelectedAvatarFile(null);
      setNameError(null);
      setBioError(null);
      setAvatarError(null);
    }
  }, [visible, user]);

  const initials = (name || user?.name || 'U')
    .trim()
    .charAt(0)
    .toUpperCase() || 'U';

  const handleFileChange = async (event: any) => {
    setAvatarError(null);
    const file = event.target?.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setAvatarError('Formato inválido. Use JPG, PNG ou WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('O arquivo deve ter no máximo 5MB.');
      return;
    }

    try {
      const processed = await processAvatarImage(file);
      setSelectedAvatarFile(processed.blob as File);
      setAvatarPreviewUrl(processed.previewUrl);
    } catch (err) {
      console.warn('[EditProfileModal] Image processing fallback:', err);
      setSelectedAvatarFile(file);
      if (typeof URL !== 'undefined' && URL.createObjectURL) {
        setAvatarPreviewUrl(URL.createObjectURL(file));
      }
    }
  };

  const handleTriggerUpload = () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    }
  };

  const handleRemoveAvatar = () => {
    setSelectedAvatarFile(null);
    setAvatarPreviewUrl(null);
    setAvatarError(null);
  };

  const handleSave = async () => {
    if (isSaving) return;

    setNameError(null);
    setBioError(null);
    setAvatarError(null);

    const sanitizedName = name.replace(/\s+/g, ' ').trim();
    if (!sanitizedName || sanitizedName.length < 2) {
      setNameError('O nome deve ter pelo menos 2 caracteres.');
      return;
    }

    if (sanitizedName.length > 60) {
      setNameError('O nome não pode exceder 60 caracteres.');
      return;
    }

    const sanitizedBio = bio.replace(/<[^>]*>?/gm, '').trim();
    if (sanitizedBio.length > 160) {
      setBioError('A biografia não pode exceder 160 caracteres.');
      return;
    }

    if (!user) return;

    try {
      setIsSaving(true);

      const isRemovingAvatar = avatarPreviewUrl === null && !selectedAvatarFile;

      const updatedUser = await userService.saveProfileAndAvatar({
        fullName: sanitizedName,
        bio: sanitizedBio,
        avatarFile: selectedAvatarFile,
        removeAvatar: isRemovingAvatar,
      });

      // Atualizar o contexto de autenticação imediatamente com os dados do banco
      await updateUser({
        name: updatedUser.name,
        bio: updatedUser.bio,
        avatarUrl: updatedUser.avatarUrl,
      });

      setSavedAvatarUrl(updatedUser.avatarUrl || null);
      setAvatarPreviewUrl(updatedUser.avatarUrl || null);
      setSelectedAvatarFile(null);

      showToast({ message: 'Perfil salvo com sucesso', type: 'success' });
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar perfil:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
      });
      const specificMessage = err?.message || 'Não foi possível atualizar os seus dados.';
      setAvatarError(specificMessage);
      showToast({ message: specificMessage, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const isUnchanged =
    name.trim() === (user?.name || '').trim() &&
    bio.trim() === (user?.bio || '').trim() &&
    avatarPreviewUrl === (user?.avatarUrl || null) &&
    !selectedAvatarFile;

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
              Editar perfil
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

          <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
            {/* 1. Foto de perfil */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarPreviewWrap}>
                {avatarPreviewUrl ? (
                  <Image
                    source={{ uri: avatarPreviewUrl }}
                    accessibilityLabel={`Foto de perfil de ${name}`}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={[styles.avatarInitials, { backgroundColor: isDark ? '#1C3833' : '#EDF7F5' }]}>
                    <Text style={styles.avatarInitialsText}>{initials}</Text>
                  </View>
                )}
              </View>

              {Platform.OS === 'web' && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              )}

              <View style={styles.avatarButtonsRow}>
                <TouchableOpacity
                  onPress={handleTriggerUpload}
                  accessibilityRole="button"
                  accessibilityLabel="Escolher nova foto"
                  style={[styles.avatarActionBtn, { borderColor: '#247B74' }]}
                >
                  <Upload size={14} color="#247B74" strokeWidth={1.75} style={{ marginRight: 4 }} />
                  <Text style={styles.avatarActionText}>Escolher foto</Text>
                </TouchableOpacity>

                {avatarPreviewUrl && (
                  <TouchableOpacity
                    onPress={handleRemoveAvatar}
                    accessibilityRole="button"
                    accessibilityLabel="Remover foto"
                    style={[styles.avatarActionBtn, { borderColor: '#D9534F' }]}
                  >
                    <Trash2 size={14} color="#D9534F" strokeWidth={1.75} style={{ marginRight: 4 }} />
                    <Text style={[styles.avatarActionText, { color: '#D9534F' }]}>Remover</Text>
                  </TouchableOpacity>
                )}
              </View>

              {avatarError && (
                <Text style={styles.fieldError}>{avatarError}</Text>
              )}
            </View>

            {/* 2. Nome Completo */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                Nome completo <Text style={{ color: '#C84E45' }}>*</Text>
              </Text>
              <TextInput
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (nameError) setNameError(null);
                }}
                maxLength={80}
                placeholder="Seu nome completo"
                placeholderTextColor="#8F9B97"
                style={[
                  styles.textInput,
                  {
                    color: isDark ? colors.text : '#1F2927',
                    borderColor: nameError ? '#C84E45' : isDark ? colors.border : '#DFE4E1',
                    backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                  },
                ]}
              />
              {nameError && (
                <View style={styles.errorRow}>
                  <AlertCircle size={14} color="#C84E45" style={{ marginRight: 4 }} />
                  <Text style={styles.fieldError}>{nameError}</Text>
                </View>
              )}
            </View>

            {/* 3. Biografia com contador */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                  Biografia
                </Text>
                <Text style={[styles.charCounter, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  {bio.length}/160 caracteres
                </Text>
              </View>
              <TextInput
                value={bio}
                onChangeText={(val) => {
                  setBio(val);
                  if (bioError) setBioError(null);
                }}
                maxLength={160}
                multiline
                numberOfLines={3}
                placeholder="Conte um pouco sobre você..."
                placeholderTextColor="#8F9B97"
                style={[
                  styles.textAreaInput,
                  {
                    color: isDark ? colors.text : '#1F2927',
                    borderColor: bioError ? '#C84E45' : isDark ? colors.border : '#DFE4E1',
                    backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                  },
                ]}
              />
              {bioError && (
                <View style={styles.errorRow}>
                  <AlertCircle size={14} color="#C84E45" style={{ marginRight: 4 }} />
                  <Text style={styles.fieldError}>{bioError}</Text>
                </View>
              )}
            </View>

            {/* 4. E-mail (Apenas para visualização) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                E-mail (apenas visualização)
              </Text>
              <TextInput
                value={user?.email || ''}
                editable={false}
                style={[
                  styles.textInput,
                  styles.readOnlyInput,
                  {
                    color: isDark ? colors.textMuted : '#68736F',
                    borderColor: isDark ? colors.border : '#E0E5E2',
                    backgroundColor: isDark ? '#1C2624' : '#F7F8F5',
                  },
                ]}
              />
              <Text style={[styles.helperText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                O e-mail é vinculado à sua autenticação e não pode ser alterado por aqui.
              </Text>
            </View>
          </ScrollView>

          {/* Botões de Ação */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              onPress={onClose}
              disabled={isSaving}
              style={[styles.cancelBtn, { borderColor: isDark ? colors.border : '#E0E5E2' }]}
            >
              <Text style={[styles.cancelBtnText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving || isUnchanged}
              style={[styles.saveBtn, (isSaving || isUnchanged) && { opacity: 0.5 }]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Salvar alterações</Text>
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
    maxWidth: 480,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarPreviewWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: 'hidden',
    marginBottom: 10,
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  avatarInitials: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#247B74',
  },
  avatarInitialsText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#247B74',
  },
  avatarButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  avatarActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  avatarActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#247B74',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  charCounter: {
    fontSize: 12,
  },
  textInput: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  textAreaInput: {
    minHeight: 74,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  readOnlyInput: {
    opacity: 0.85,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  fieldError: {
    fontSize: 12,
    color: '#C84E45',
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
    flex: 1.4,
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
