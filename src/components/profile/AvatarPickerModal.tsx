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
  Check,
  User,
  Smile,
  Heart,
  Sparkles,
  Sun,
  Moon,
  Leaf,
  Wind,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppButton } from '../ui/AppButton';

export interface AvatarPickerModalProps {
  visible: boolean;
  currentAvatarUrl?: string | null;
  userName: string;
  onClose: () => void;
  onSelectAvatar: (avatarUrl: string | null) => Promise<void>;
}

const AVATAR_COLORS = [
  '#2F7F7C',
  '#173D3B',
  '#2C648E',
  '#D98968',
  '#4A7A3E',
  '#634E99',
  '#C87A24',
  '#B84C4C',
];

const PRESET_ICONS = [
  { id: 'user', icon: User, label: 'Perfil' },
  { id: 'smile', icon: Smile, label: 'Sorriso' },
  { id: 'heart', icon: Heart, label: 'Coração' },
  { id: 'sparkles', icon: Sparkles, label: 'Brilho' },
  { id: 'leaf', icon: Leaf, label: 'Natureza' },
  { id: 'wind', icon: Wind, label: 'Respiração' },
  { id: 'sun', icon: Sun, label: 'Sol' },
  { id: 'moon', icon: Moon, label: 'Noite' },
];

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  visible,
  currentAvatarUrl,
  userName,
  onClose,
  onSelectAvatar,
}) => {
  const { colors, isDark } = useTheme();

  // Parse existing avatar if available
  const initialIsCustom = !!(currentAvatarUrl && currentAvatarUrl.startsWith('custom-icon:'));
  const initialIconId = initialIsCustom ? currentAvatarUrl.split(':')[1] || 'user' : 'user';
  const initialColor = initialIsCustom ? currentAvatarUrl.split(':')[2] || AVATAR_COLORS[0] : AVATAR_COLORS[0];

  const [selectedType, setSelectedType] = useState<'initials' | 'icon'>(
    initialIsCustom ? 'icon' : 'initials'
  );
  const [selectedColor, setSelectedColor] = useState<string>(initialColor);
  const [selectedIconId, setSelectedIconId] = useState<string>(initialIconId);
  const [isSaving, setIsSaving] = useState(false);

  const initialLetter = userName.trim().charAt(0).toUpperCase() || 'A';

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (selectedType === 'initials') {
        await onSelectAvatar(null);
      } else {
        await onSelectAvatar(`custom-icon:${selectedIconId}:${selectedColor}`);
      }
      onClose();
    } catch {
      // Trata erro no componente pai
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible) return null;

  const SelectedIcon = PRESET_ICONS.find((i) => i.id === selectedIconId)?.icon || User;

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
            <Text style={[styles.modalTitle, { color: isDark ? colors.text : '#173D3B' }]}>
              Escolha seu avatar
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Fechar modal"
            >
              <X size={20} color="#8C9E9B" />
            </TouchableOpacity>
          </View>

          {/* Prévia do Avatar Selecionado */}
          <View style={styles.previewContainer}>
            <View
              style={[
                styles.previewCircle,
                {
                  backgroundColor:
                    selectedType === 'initials' ? '#173D3B' : selectedColor,
                },
              ]}
            >
              {selectedType === 'initials' ? (
                <Text style={styles.previewInitial}>{initialLetter}</Text>
              ) : (
                <SelectedIcon size={36} color="#FFFFFF" strokeWidth={2.2} />
              )}
            </View>
            <Text style={[styles.previewLabel, { color: isDark ? colors.textMuted : '#667775' }]}>
              Prévia do seu avatar
            </Text>
          </View>

          {/* Opção 1: Iniciais do Nome */}
          <TouchableOpacity
            onPress={() => setSelectedType('initials')}
            activeOpacity={0.8}
            style={[
              styles.optionCard,
              selectedType === 'initials' && [
                styles.optionCardSelected,
                { borderColor: '#2F7F7C' },
              ],
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFA',
                borderColor: isDark ? colors.border : '#EBF1EF',
              },
            ]}
          >
            <View style={[styles.miniCircle, { backgroundColor: '#173D3B' }]}>
              <Text style={styles.miniCircleText}>{initialLetter}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionTitle, { color: isDark ? colors.text : '#173D3B' }]}>
                Usar iniciais do nome ({initialLetter})
              </Text>
              <Text style={[styles.optionSubtitle, { color: isDark ? colors.textMuted : '#667775' }]}>
                Simples e elegante com sua letra inicial.
              </Text>
            </View>
            {selectedType === 'initials' && <Check size={18} color="#2F7F7C" />}
          </TouchableOpacity>

          {/* Opção 2: Ícone Ilustrado com Cor de Fundo */}
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.sectionHeading, { color: isDark ? colors.text : '#173D3B' }]}>
              Ou escolha um ícone e cor
            </Text>

            {/* Grid de Ícones */}
            <View style={styles.iconsGrid}>
              {PRESET_ICONS.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedType === 'icon' && selectedIconId === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      setSelectedType('icon');
                      setSelectedIconId(item.id);
                    }}
                    style={[
                      styles.iconSelectBtn,
                      isSelected && {
                        borderColor: '#2F7F7C',
                        backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
                      },
                      {
                        borderColor: isSelected ? '#2F7F7C' : isDark ? colors.border : '#EBF1EF',
                        backgroundColor: isDark ? colors.surface : '#FFFFFF',
                      },
                    ]}
                  >
                    <Icon
                      size={20}
                      color={isSelected ? '#2F7F7C' : isDark ? colors.text : '#173D3B'}
                      strokeWidth={2}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Paleta de Cores */}
            <View style={styles.colorPaletteRow}>
              {AVATAR_COLORS.map((c) => {
                const isSelected = selectedType === 'icon' && selectedColor === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => {
                      setSelectedType('icon');
                      setSelectedColor(c);
                    }}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      isSelected && styles.colorDotSelected,
                    ]}
                  >
                    {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Botões de Ação */}
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
                title="Salvar Avatar"
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    zIndex: 1000,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  previewCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  previewInitial: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  previewLabel: {
    fontSize: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  optionCardSelected: {
    borderWidth: 2,
  },
  miniCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCircleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  optionSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  iconSelectBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPaletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotSelected: {
    transform: [{ scale: 1.15 }],
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});
