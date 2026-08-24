import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import {
  X,
  Bell,
  Clock,
  Calendar,
  Sparkles,
  CheckCircle2,
  Check,
  Coffee,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppButton } from '../ui/AppButton';
import {
  notificationService,
  NotificationScheduleConfig,
  GENTLE_NOTIFICATION_MESSAGES,
} from '../../services/notifications/notificationService';
import { useToast } from '../ui/Toast';

export interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const WEEK_DAYS = [
  { id: 1, label: 'Seg' },
  { id: 2, label: 'Ter' },
  { id: 3, label: 'Qua' },
  { id: 4, label: 'Qui' },
  { id: 5, label: 'Sex' },
  { id: 6, label: 'Sáb' },
  { id: 0, label: 'Dom' },
];

const PRESET_TIMES = ['08:00', '12:30', '18:00', '20:30', '22:00'];

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  const [config, setConfig] = useState<NotificationScheduleConfig>({
    dailyReminderEnabled: true,
    reminderTime: '20:30',
    selectedDays: [1, 2, 3, 4, 5, 6, 0],
    microPausesEnabled: false,
    microPausesIntervalHours: 4,
  });

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      notificationService.getSavedConfig().then(setConfig);
    }
  }, [visible]);

  if (!visible) return null;

  const toggleDay = (dayId: number) => {
    const exists = config.selectedDays.includes(dayId);
    const updated = exists
      ? config.selectedDays.filter((d) => d !== dayId)
      : [...config.selectedDays, dayId];
    setConfig((prev) => ({ ...prev, selectedDays: updated }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await notificationService.saveConfig(config);
      showToast({ message: 'Preferências de notificação salvas.', type: 'success' });
      onClose();
    } catch {
      showToast({ message: 'Erro ao salvar preferências.', type: 'error' });
    } finally {
      setIsSaving(false);
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
              <Text style={[styles.title, { color: isDark ? colors.text : '#173D3B' }]}>
                Lembretes e Notificações
              </Text>
              <Text style={[styles.subtitle, { color: isDark ? colors.textMuted : '#667775' }]}>
                Avisos gentis para desacelerar no seu ritmo
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

          <ScrollView style={{ maxHeight: 390 }} showsVerticalScrollIndicator={false}>
            {/* 1. Lembrete Diário */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFA',
                  borderColor: isDark ? colors.border : '#EBF1EF',
                },
              ]}
            >
              <View style={styles.toggleRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Bell size={18} color="#2F7F7C" style={{ marginRight: 8 }} />
                  <View>
                    <Text style={[styles.cardTitle, { color: isDark ? colors.text : '#173D3B' }]}>
                      Lembrete diário
                    </Text>
                    <Text style={[styles.cardSub, { color: isDark ? colors.textMuted : '#667775' }]}>
                      Momento para check-in e respiração
                    </Text>
                  </View>
                </View>
                <Switch
                  value={config.dailyReminderEnabled}
                  onValueChange={(val) =>
                    setConfig((prev) => ({ ...prev, dailyReminderEnabled: val }))
                  }
                  trackColor={{ false: '#DCE5E2', true: '#2F7F7C' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {config.dailyReminderEnabled && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.fieldLabel, { color: isDark ? colors.text : '#173D3B' }]}>
                    Horário preferido:
                  </Text>
                  <View style={styles.pillsRow}>
                    {PRESET_TIMES.map((time) => {
                      const isSelected = config.reminderTime === time;
                      return (
                        <TouchableOpacity
                          key={time}
                          onPress={() =>
                            setConfig((prev) => ({ ...prev, reminderTime: time }))
                          }
                          style={[
                            styles.timePill,
                            isSelected && {
                              backgroundColor: '#2F7F7C',
                              borderColor: '#79B8A4',
                            },
                            {
                              backgroundColor: isSelected
                                ? '#2F7F7C'
                                : isDark
                                ? colors.surface
                                : '#FFFFFF',
                              borderColor: isSelected
                                ? '#79B8A4'
                                : isDark
                                ? colors.borderStrong || colors.border
                                : '#DCE5E2',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.timePillText,
                              {
                                color: isSelected
                                  ? '#FFFFFF'
                                  : isDark
                                  ? colors.text
                                  : '#173D3B',
                                fontWeight: isSelected ? '700' : '500',
                              },
                            ]}
                          >
                            {time}
                          </Text>
                          {isSelected && (
                            <Check size={12} color="#FFFFFF" strokeWidth={3} style={{ marginLeft: 3 }} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: isDark ? colors.text : '#173D3B', marginTop: 12 },
                    ]}
                  >
                    Dias da semana:
                  </Text>
                  <View style={styles.daysRow}>
                    {WEEK_DAYS.map((day) => {
                      const isSelected = config.selectedDays.includes(day.id);
                      return (
                        <TouchableOpacity
                          key={day.id}
                          onPress={() => toggleDay(day.id)}
                          style={[
                            styles.dayCircle,
                            isSelected && {
                              backgroundColor: '#2F7F7C',
                              borderColor: '#79B8A4',
                            },
                            {
                              backgroundColor: isSelected
                                ? '#2F7F7C'
                                : isDark
                                ? colors.surface
                                : '#FFFFFF',
                              borderColor: isSelected
                                ? '#79B8A4'
                                : isDark
                                ? colors.borderStrong || colors.border
                                : '#DCE5E2',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              {
                                color: isSelected
                                  ? '#FFFFFF'
                                  : isDark
                                  ? colors.text
                                  : '#667775',
                                fontWeight: isSelected ? '700' : '500',
                              },
                            ]}
                          >
                            {day.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* 2. Micro-pausas no dia */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFA',
                  borderColor: isDark ? colors.border : '#EBF1EF',
                  marginTop: 10,
                },
              ]}
            >
              <View style={styles.toggleRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Coffee size={18} color="#2F7F7C" style={{ marginRight: 8 }} />
                  <View>
                    <Text style={[styles.cardTitle, { color: isDark ? colors.text : '#173D3B' }]}>
                      Micro-pausas na rotina
                    </Text>
                    <Text style={[styles.cardSub, { color: isDark ? colors.textMuted : '#667775' }]}>
                      Lembretes para afastar os olhos da tela
                    </Text>
                  </View>
                </View>
                <Switch
                  value={config.microPausesEnabled}
                  onValueChange={(val) =>
                    setConfig((prev) => ({ ...prev, microPausesEnabled: val }))
                  }
                  trackColor={{ false: '#DCE5E2', true: '#2F7F7C' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {config.microPausesEnabled && (
                <View style={{ marginTop: 10 }}>
                  <Text style={[styles.fieldLabel, { color: isDark ? colors.text : '#173D3B' }]}>
                    Frequência das pausas:
                  </Text>
                  <View style={styles.pillsRow}>
                    {[2, 3, 4].map((hours) => {
                      const isSelected = config.microPausesIntervalHours === hours;
                      return (
                        <TouchableOpacity
                          key={hours}
                          onPress={() =>
                            setConfig((prev) => ({
                              ...prev,
                              microPausesIntervalHours: hours,
                            }))
                          }
                          style={[
                            styles.timePill,
                            isSelected && {
                              backgroundColor: '#2F7F7C',
                              borderColor: '#79B8A4',
                            },
                            {
                              backgroundColor: isSelected
                                ? '#2F7F7C'
                                : isDark
                                ? colors.surface
                                : '#FFFFFF',
                              borderColor: isSelected
                                ? '#79B8A4'
                                : isDark
                                ? colors.borderStrong || colors.border
                                : '#DCE5E2',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.timePillText,
                              {
                                color: isSelected
                                  ? '#FFFFFF'
                                  : isDark
                                  ? colors.text
                                  : '#173D3B',
                                fontWeight: isSelected ? '700' : '500',
                              },
                            ]}
                          >
                            A cada {hours}h
                          </Text>
                          {isSelected && (
                            <Check size={12} color="#FFFFFF" strokeWidth={3} style={{ marginLeft: 3 }} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* 3. Prévia de Notificação de Exemplo */}
            <TouchableOpacity
              onPress={() => setIsPreviewOpen(!isPreviewOpen)}
              style={styles.previewToggleBtn}
            >
              <Sparkles size={14} color="#2F7F7C" style={{ marginRight: 6 }} />
              <Text style={styles.previewToggleText}>
                {isPreviewOpen ? 'Ocultar exemplo' : 'Ver exemplo de notificação'}
              </Text>
            </TouchableOpacity>

            {isPreviewOpen && (
              <View
                style={[
                  styles.previewBox,
                  {
                    backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
                    borderColor: isDark ? colors.border : '#D8EBE4',
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Bell size={12} color="#2F7F7C" style={{ marginRight: 4 }} />
                  <Text style={styles.previewAppTitle}>Respira • Momento de pausa</Text>
                </View>
                <Text style={[styles.previewMessage, { color: isDark ? colors.text : '#173D3B' }]}>
                  {`"${GENTLE_NOTIFICATION_MESSAGES[0]}"`}
                </Text>
                <Text style={[styles.previewNote, { color: isDark ? colors.textMuted : '#667775' }]}>
                  Mensagens acolhedoras, sem cobranças ou pressão por sequências.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Ações */}
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
                title="Salvar"
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
    maxWidth: 440,
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
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardSub: {
    fontSize: 11,
    marginTop: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  timePillText: {
    fontSize: 11,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 11,
  },
  previewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  previewToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2F7F7C',
  },
  previewBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  previewAppTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2F7F7C',
    letterSpacing: 0.5,
  },
  previewMessage: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginBottom: 4,
  },
  previewNote: {
    fontSize: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
});
