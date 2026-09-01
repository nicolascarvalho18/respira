import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import {
  X,
  Plus,
  Play,
  Pause,
  Trash2,
  Bookmark,
  Volume2,
  VolumeX,
  Sliders,
  Check,
  Sparkles,
} from 'lucide-react-native';
import { useSoundMixerStore } from '../../store/soundMixerStore';
import { useSoundscapeStore } from '../../store/soundscapeStore';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ui/Toast';

interface SoundMixerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SoundMixerModal: React.FC<SoundMixerModalProps> = ({ visible, onClose }) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  const { soundscapes } = useSoundscapeStore();
  const {
    activeLayers,
    masterVolume,
    isPlaying,
    savedPresets,
    activePresetName,
    loadPresets,
    addLayer,
    removeLayer,
    setLayerVolume,
    setMasterVolume,
    togglePlayPause,
    applyPreset,
    saveCurrentAsPreset,
    deletePreset,
  } = useSoundMixerStore();

  const [showAddPicker, setShowAddPicker] = useState(false);
  const [showSavePresetInput, setShowSavePresetInput] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');

  useEffect(() => {
    if (visible) {
      loadPresets(user?.id);
    }
  }, [visible, user?.id, loadPresets]);

  const handleSavePreset = async () => {
    if (!presetNameInput.trim()) {
      showToast({ message: 'Digite um nome para a combinação.', type: 'error' });
      return;
    }
    if (!user?.id) {
      showToast({ message: 'Faça login para salvar suas combinações.', type: 'info' });
      return;
    }

    try {
      await saveCurrentAsPreset(presetNameInput.trim(), user.id);
      setPresetNameInput('');
      setShowSavePresetInput(false);
      showToast({ message: 'Combinação de som salva com sucesso!', type: 'success' });
    } catch (_e) {
      showToast({ message: 'Não foi possível salvar a combinação.', type: 'error' });
    }
  };

  const availableSounds = soundscapes.filter(
    (s) => !activeLayers.some((layer) => layer.soundId === s.id)
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: isDark ? '#16222F' : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E2E8E5',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.headerIconCircle, { backgroundColor: isDark ? '#1C3833' : '#EDF7F5' }]}>
                <Sliders size={20} color="#247B74" />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                  Misturador de Sons
                </Text>
                <Text style={[styles.modalSubTitle, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  Combine até 3 sons ambientes simultaneamente
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color={isDark ? colors.textMuted : '#68736F'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Presets Rápidos */}
            <View style={styles.presetsSection}>
              <Text style={[styles.sectionLabel, { color: isDark ? colors.textMuted : '#68736F' }]}>
                COMBINAÇÕES PRONTAS
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
                {savedPresets.map((preset) => {
                  const isCurrent = activePresetName === preset.name;
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      onPress={() => applyPreset(preset)}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: isCurrent
                            ? '#247B74'
                            : isDark ? colors.surfaceSecondary : '#F0F5F3',
                          borderColor: isCurrent ? '#247B74' : isDark ? colors.border : '#DFE5E2',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          { color: isCurrent ? '#FFFFFF' : isDark ? colors.text : '#1F2927' },
                        ]}
                      >
                        {preset.name}
                      </Text>
                      {user?.id && !preset.id.includes('default') && (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            deletePreset(preset.id, user.id);
                          }}
                          style={{ marginLeft: 6 }}
                        >
                          <Trash2 size={13} color={isCurrent ? '#FFFFFF' : '#D87556'} />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Slots Ativos (Até 3 sons) */}
            <View style={styles.slotsSection}>
              <View style={styles.slotsHeaderRow}>
                <Text style={[styles.sectionLabel, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  SONS ATIVOS ({activeLayers.length}/3)
                </Text>
                {activeLayers.length < 3 && (
                  <TouchableOpacity
                    onPress={() => setShowAddPicker(true)}
                    style={styles.addSoundTriggerBtn}
                  >
                    <Plus size={14} color="#247B74" />
                    <Text style={styles.addSoundTriggerText}>Adicionar som</Text>
                  </TouchableOpacity>
                )}
              </View>

              {activeLayers.length === 0 ? (
                <View style={[styles.emptySlotsCard, { backgroundColor: isDark ? '#1E2C39' : '#F9FBFA' }]}>
                  <Text style={[styles.emptySlotsText, { color: isDark ? colors.textMuted : '#68736F' }]}>
                    Nenhum som ativo no momento. Clique em "+ Adicionar som" para criar sua mistura.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {activeLayers.map((layer) => {
                    const pct = Math.round(layer.volume * 100);
                    return (
                      <View
                        key={layer.soundId}
                        style={[
                          styles.layerCard,
                          {
                            backgroundColor: isDark ? '#1A2938' : '#F9FBFA',
                            borderColor: isDark ? colors.border : '#E0E7E4',
                          },
                        ]}
                      >
                        <View style={styles.layerHeaderRow}>
                          <Text style={[styles.layerName, { color: isDark ? colors.text : '#1F2927' }]}>
                            {layer.name}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Text style={styles.volumePctBadge}>{pct}%</Text>
                            <TouchableOpacity
                              onPress={() => removeLayer(layer.soundId)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Trash2 size={16} color="#D87556" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Sliders / Degraus de Volume do Som */}
                        <View style={styles.stepVolumeRow}>
                          {[0.2, 0.4, 0.6, 0.8, 1.0].map((v) => {
                            const isFilled = layer.volume >= v - 0.05;
                            return (
                              <TouchableOpacity
                                key={v}
                                onPress={() => setLayerVolume(layer.soundId, v)}
                                style={[
                                  styles.volBarStep,
                                  isFilled && { backgroundColor: '#247B74' },
                                  !isFilled && { backgroundColor: isDark ? '#2D3D4E' : '#DFE5E2' },
                                ]}
                              />
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Picker de Adicionar Som */}
            {showAddPicker && (
              <View
                style={[
                  styles.addPickerCard,
                  {
                    backgroundColor: isDark ? '#1C2E3F' : '#EDF6F3',
                    borderColor: isDark ? colors.border : '#C5E2DC',
                  },
                ]}
              >
                <View style={styles.pickerTopRow}>
                  <Text style={[styles.pickerTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                    Escolha um som para adicionar:
                  </Text>
                  <TouchableOpacity onPress={() => setShowAddPicker(false)}>
                    <X size={18} color={isDark ? colors.textMuted : '#68736F'} />
                  </TouchableOpacity>
                </View>
                <View style={styles.pickerGrid}>
                  {availableSounds.map((snd) => (
                    <TouchableOpacity
                      key={snd.id}
                      onPress={() => {
                        addLayer({
                          id: snd.id,
                          name: snd.name,
                          audioUrl: snd.audioUrl,
                          icon: snd.icon,
                        });
                        setShowAddPicker(false);
                      }}
                      style={[
                        styles.pickerSoundChip,
                        {
                          backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                          borderColor: isDark ? colors.border : '#D8E2DF',
                        },
                      ]}
                    >
                      <Text style={[styles.pickerSoundText, { color: isDark ? colors.text : '#1F2927' }]}>
                        {snd.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Controle de Volume Master */}
            <View style={[styles.masterVolumeCard, { backgroundColor: isDark ? '#1A2938' : '#F2F8F6' }]}>
              <View style={styles.masterHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Volume2 size={18} color="#247B74" />
                  <Text style={[styles.masterTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                    Volume Geral da Mistura
                  </Text>
                </View>
                <Text style={styles.volumePctBadge}>{Math.round(masterVolume * 100)}%</Text>
              </View>

              <View style={styles.stepVolumeRow}>
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((v) => {
                  const isFilled = masterVolume >= v - 0.05;
                  return (
                    <TouchableOpacity
                      key={v}
                      onPress={() => setMasterVolume(v)}
                      style={[
                        styles.volBarStep,
                        isFilled && { backgroundColor: '#247B74' },
                        !isFilled && { backgroundColor: isDark ? '#2D3D4E' : '#DFE5E2' },
                      ]}
                    />
                  );
                })}
              </View>
            </View>

            {/* Salvar como Novo Preset */}
            {showSavePresetInput ? (
              <View style={styles.savePresetBox}>
                <TextInput
                  value={presetNameInput}
                  onChangeText={setPresetNameInput}
                  placeholder="Nome da combinação (ex: Dormir no bosque)"
                  placeholderTextColor={isDark ? '#7E918E' : '#94A3B8'}
                  style={[
                    styles.presetInput,
                    {
                      backgroundColor: isDark ? colors.surface : '#FFFFFF',
                      color: isDark ? colors.text : '#1F2927',
                      borderColor: isDark ? colors.border : '#CCD6D3',
                    },
                  ]}
                />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TouchableOpacity onPress={handleSavePreset} style={styles.confirmSaveBtn}>
                    <Check size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Salvar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowSavePresetInput(false)}
                    style={[styles.cancelSaveBtn, { borderColor: isDark ? colors.border : '#CCD6D3' }]}
                  >
                    <Text style={{ color: isDark ? colors.textMuted : '#68736F', fontSize: 13 }}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowSavePresetInput(true)}
                style={[styles.savePresetTriggerBtn, { borderColor: isDark ? colors.border : '#CCD6D3' }]}
              >
                <Bookmark size={15} color="#247B74" style={{ marginRight: 6 }} />
                <Text style={styles.savePresetTriggerText}>Salvar esta combinação como preset</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Rodapé com Play / Pause Grande */}
          <View style={[styles.modalFooter, { borderTopColor: isDark ? colors.border : '#E2E8E5' }]}>
            <TouchableOpacity
              onPress={togglePlayPause}
              style={[
                styles.footerPlayBtn,
                { backgroundColor: activeLayers.length === 0 ? '#8FA39F' : '#247B74' },
              ]}
              disabled={activeLayers.length === 0}
            >
              {isPlaying ? (
                <>
                  <Pause size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.footerPlayBtnText}>Pausar Mistura</Text>
                </>
              ) : (
                <>
                  <Play size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.footerPlayBtnText}>Tocar Mistura</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '70%',
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalSubTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  presetsSection: {
    marginBottom: 18,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  slotsSection: {
    marginBottom: 18,
  },
  slotsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addSoundTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  addSoundTriggerText: {
    color: '#247B74',
    fontSize: 12.5,
    fontWeight: '600',
  },
  emptySlotsCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptySlotsText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  layerCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  layerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  layerName: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  volumePctBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#247B74',
  },
  stepVolumeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  volBarStep: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  addPickerCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  pickerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pickerTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pickerSoundChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  pickerSoundText: {
    fontSize: 12,
    fontWeight: '500',
  },
  masterVolumeCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  masterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  masterTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  savePresetBox: {
    marginBottom: 16,
  },
  presetInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  confirmSaveBtn: {
    backgroundColor: '#247B74',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  cancelSaveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  savePresetTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  savePresetTriggerText: {
    color: '#247B74',
    fontSize: 13,
    fontWeight: '600',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  footerPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
  },
  footerPlayBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
