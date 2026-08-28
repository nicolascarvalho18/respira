import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';
import {
  X,
  Bell,
  Clock,
  Coffee,
  AlertCircle,
  Check,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppButton } from '../ui/AppButton';
import { useAuth } from '../../hooks/useAuth';
import {
  notificationService,
  NotificationScheduleConfig,
} from '../../services/notifications/notificationService';
import { useToast } from '../ui/Toast';

export interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const WEEK_DAYS = [
  { id: 1, label: 'S', name: 'Segunda-feira' },
  { id: 2, label: 'T', name: 'Terça-feira' },
  { id: 3, label: 'Q', name: 'Quarta-feira' },
  { id: 4, label: 'Q', name: 'Quinta-feira' },
  { id: 5, label: 'S', name: 'Sexta-feira' },
  { id: 6, label: 'S', name: 'Sábado' },
  { id: 0, label: 'D', name: 'Domingo' },
];

const PRESET_HOURS = ['08:00', '12:30', '18:00', '20:30', '22:00'];
const MICRO_PAUSE_INTERVALS = [
  { hours: 2, label: 'A cada 2 horas' },
  { hours: 3, label: 'A cada 3 horas' },
  { hours: 4, label: 'A cada 4 horas' },
];

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [config, setConfig] = useState<NotificationScheduleConfig>({
    dailyReminderEnabled: true,
    reminderTime: '18:00',
    selectedDays: [1, 2, 3, 4, 5, 6, 0],
    microPausesEnabled: false,
    microPausesIntervalHours: 4,
  });

  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      notificationService.getSavedConfig(user?.id).then(setConfig);
      notificationService.getPermissionStatus().then(setPermissionStatus);
    }
  }, [visible, user?.id]);

  if (!visible) return null;

  const toggleDay = (dayId: number) => {
    const exists = config.selectedDays.includes(dayId);
    if (exists && config.selectedDays.length === 1) {
      // Manter pelo menos 1 dia selecionado
      return;
    }
    const updated = exists
      ? config.selectedDays.filter((d) => d !== dayId)
      : [...config.selectedDays, dayId];
    setConfig((prev) => ({ ...prev, selectedDays: updated }));
  };

  const handleToggleDaily = async (enabled: boolean) => {
    if (enabled) {
      const granted = await notificationService.requestPermissionContextually();
      if (!granted) {
        const currentStatus = await notificationService.getPermissionStatus();
        setPermissionStatus(currentStatus);
      }
    }
    setConfig((prev) => ({ ...prev, dailyReminderEnabled: enabled }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await notificationService.saveConfig(config, user?.id);
      showToast({ message: 'Preferências salvas', type: 'success' });
      onClose();
    } catch (_err) {
      showToast({ message: 'Não foi possível salvar as preferências.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const accentColor = isDark ? '#5ECFC3' : '#238C82';
  const cardBg = isDark ? '#1F2937' : '#F8FAF9';
  const cardBorder = isDark ? '#334155' : '#DDE6E3';
  const textPrimary = isDark ? '#FFFFFF' : '#17332F';
  const textSecondary = isDark ? '#F1F5F9' : '#5F706C';

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
              backgroundColor: isDark ? '#172033' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#DDE6E3',
            },
          ]}
        >
          {/* Cabeçalho */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text
                accessibilityRole="header"
                aria-level={2}
                style={[styles.title, { color: textPrimary }]}
              >
                Lembretes e Notificações
              </Text>
              <Text style={[styles.subtitle, { color: textSecondary }]}>
                Avisos gentis para desacelerar no seu ritmo
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Fechar janela"
              style={styles.closeBtn}
            >
              <X size={20} color={textSecondary} strokeWidth={1.75} />
            </TouchableOpacity>
          </View>

          {/* Conteúdo Rolável */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Aviso se notificações estiverem bloqueadas */}
            {permissionStatus === 'denied' && (
              <View style={styles.warningBox}>
                <AlertCircle size={16} color="#D87556" style={{ marginRight: 8, marginTop: 1 }} />
                <Text style={styles.warningText}>
                  Notificações bloqueadas no navegador. Para receber lembretes, revise as permissões do site nas configurações do navegador.
                </Text>
              </View>
            )}

            {/* 1. Lembrete Diário */}
            <View
              style={[
                styles.configCard,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconTitleGroup}>
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? '#183B38' : '#EAF7F3' }]}>
                    <Bell size={18} color={accentColor} strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: textPrimary }]}>
                      Lembrete diário
                    </Text>
                    <Text style={[styles.cardDesc, { color: textSecondary }]}>
                      {config.dailyReminderEnabled ? 'Ativado para check-in de humor' : 'Desativado'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={config.dailyReminderEnabled}
                  onValueChange={handleToggleDaily}
                  trackColor={{ false: isDark ? '#334155' : '#DDE6E3', true: accentColor }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel="Ativar lembrete diário"
                />
              </View>

              {config.dailyReminderEnabled && (
                <View style={styles.cardBody}>
                  {/* Horário */}
                  <View style={styles.fieldSection}>
                    <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                      Horário
                    </Text>
                    <View style={styles.timePillsWrap}>
                      {PRESET_HOURS.map((hour) => {
                        const isSelected = config.reminderTime === hour;
                        return (
                          <TouchableOpacity
                            key={hour}
                            onPress={() => setConfig((prev) => ({ ...prev, reminderTime: hour }))}
                            accessibilityRole="button"
                            accessibilityLabel={`Horário: ${hour}`}
                            style={[
                              styles.timePill,
                              isSelected && {
                                backgroundColor: isDark ? '#5ECFC3' : '#238C82',
                                borderColor: isDark ? '#5ECFC3' : '#238C82',
                              },
                              !isSelected && {
                                backgroundColor: isDark ? '#172033' : '#FFFFFF',
                                borderColor: cardBorder,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.timePillText,
                                {
                                  color: isSelected
                                    ? isDark
                                      ? '#172033'
                                      : '#FFFFFF'
                                    : textPrimary,
                                  fontWeight: isSelected ? '700' : '500',
                                },
                              ]}
                            >
                              {hour}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Dias da Semana */}
                  <View style={styles.fieldSection}>
                    <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                      Dias da semana
                    </Text>
                    <View style={styles.daysRow}>
                      {WEEK_DAYS.map((day) => {
                        const isSelected = config.selectedDays.includes(day.id);
                        return (
                          <TouchableOpacity
                            key={day.id}
                            onPress={() => toggleDay(day.id)}
                            accessibilityRole="button"
                            accessibilityLabel={`${day.name} (${isSelected ? 'selecionado' : 'não selecionado'})`}
                            style={[
                              styles.dayBtn,
                              isSelected && {
                                backgroundColor: isDark ? '#5ECFC3' : '#238C82',
                                borderColor: isDark ? '#5ECFC3' : '#238C82',
                              },
                              !isSelected && {
                                backgroundColor: isDark ? '#172033' : '#FFFFFF',
                                borderColor: cardBorder,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.dayBtnText,
                                {
                                  color: isSelected
                                    ? isDark
                                      ? '#172033'
                                      : '#FFFFFF'
                                    : textPrimary,
                                  fontWeight: isSelected ? '700' : '600',
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
                </View>
              )}
            </View>

            {/* 2. Micro-pausas */}
            <View
              style={[
                styles.configCard,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconTitleGroup}>
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? '#183B38' : '#EAF7F3' }]}>
                    <Coffee size={18} color={accentColor} strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: textPrimary }]}>
                      Micro-pausas
                    </Text>
                    <Text style={[styles.cardDesc, { color: textSecondary }]}>
                      {config.microPausesEnabled ? 'Avisos breves ao longo do dia' : 'Desativado'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={config.microPausesEnabled}
                  onValueChange={(val) =>
                    setConfig((prev) => ({ ...prev, microPausesEnabled: val }))
                  }
                  trackColor={{ false: isDark ? '#334155' : '#DDE6E3', true: accentColor }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel="Ativar micro-pausas"
                />
              </View>

              {config.microPausesEnabled && (
                <View style={styles.cardBody}>
                  <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                    Frequência
                  </Text>
                  <View style={styles.frequencyList}>
                    {MICRO_PAUSE_INTERVALS.map((item) => {
                      const isSelected = config.microPausesIntervalHours === item.hours;
                      return (
                        <TouchableOpacity
                          key={item.hours}
                          onPress={() =>
                            setConfig((prev) => ({
                              ...prev,
                              microPausesIntervalHours: item.hours,
                            }))
                          }
                          accessibilityRole="button"
                          accessibilityLabel={item.label}
                          style={[
                            styles.frequencyOption,
                            isSelected && {
                              backgroundColor: isDark ? '#183B38' : '#EAF7F3',
                              borderColor: accentColor,
                            },
                            !isSelected && {
                              backgroundColor: isDark ? '#172033' : '#FFFFFF',
                              borderColor: cardBorder,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.frequencyOptionText,
                              {
                                color: isSelected ? accentColor : textPrimary,
                                fontWeight: isSelected ? '700' : '500',
                              },
                            ]}
                          >
                            {item.label}
                          </Text>
                          {isSelected && <Check size={16} color={accentColor} strokeWidth={2.5} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Ações na Base */}
          <View
            style={[
              styles.footerActions,
              {
                borderTopColor: isDark ? '#334155' : '#DDE6E3',
              },
            ]}
          >
            <TouchableOpacity
              onPress={onClose}
              disabled={isSaving}
              style={[
                styles.cancelBtn,
                {
                  borderColor: isDark ? '#334155' : '#DDE6E3',
                },
              ]}
              accessibilityRole="button"
            >
              <Text style={[styles.cancelBtnText, { color: textSecondary }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <AppButton
              title="Salvar alterações"
              onPress={handleSave}
              isLoading={isSaving}
              disabled={isSaving}
              style={{ flex: 1.5, height: 48 }}
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: 16,
    borderWidth: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.16)',
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    marginLeft: 8,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    padding: 12,
    borderRadius: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#975A16',
    lineHeight: 18,
  },
  configCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardIconTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 13,
    marginTop: 1,
  },
  cardBody: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DDE6E3',
    gap: 14,
  },
  fieldSection: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  timePillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timePill: {
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePillText: {
    fontSize: 13.5,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBtnText: {
    fontSize: 13.5,
  },
  frequencyList: {
    gap: 8,
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  frequencyOptionText: {
    fontSize: 13.5,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
