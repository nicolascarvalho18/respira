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
} from 'react-native';
import {
  X,
  Bell,
  Clock,
  Coffee,
  AlertCircle,
  Check,
  Send,
  HelpCircle,
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
    dailyReminderEnabled: false,
    reminderTime: '18:00',
    selectedDays: [1, 2, 3, 4, 5, 6, 0],
    microPausesEnabled: false,
    microPausesIntervalHours: 4,
  });

  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (visible) {
      notificationService.getSavedConfig(user?.id).then((saved) => {
        notificationService.getPermissionStatus().then((perm) => {
          setPermissionStatus(perm);
          if (perm === 'denied') {
            setConfig({
              ...saved,
              dailyReminderEnabled: false,
              microPausesEnabled: false,
            });
          } else {
            setConfig(saved);
          }
        });
      });
    }
  }, [visible, user?.id]);

  useEffect(() => {
    if (visible && Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  const toggleDay = (dayId: number) => {
    const exists = config.selectedDays.includes(dayId);
    if (exists && config.selectedDays.length === 1) {
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
      const currentStatus = await notificationService.getPermissionStatus();
      setPermissionStatus(currentStatus);

      if (!granted || currentStatus === 'denied') {
        showToast({
          message: 'Permissão de notificação bloqueada no navegador.',
          type: 'error',
        });
        setConfig((prev) => ({ ...prev, dailyReminderEnabled: false }));
        return;
      }
    }
    setConfig((prev) => ({ ...prev, dailyReminderEnabled: enabled }));
  };

  const handleToggleMicroPauses = async (enabled: boolean) => {
    if (enabled) {
      const granted = await notificationService.requestPermissionContextually();
      const currentStatus = await notificationService.getPermissionStatus();
      setPermissionStatus(currentStatus);

      if (!granted || currentStatus === 'denied') {
        showToast({
          message: 'Permissão de notificação bloqueada no navegador.',
          type: 'error',
        });
        setConfig((prev) => ({ ...prev, microPausesEnabled: false }));
        return;
      }
    }
    setConfig((prev) => ({ ...prev, microPausesEnabled: enabled }));
  };

  const handleSendTest = async () => {
    try {
      setIsTesting(true);
      const sent = await notificationService.sendTestNotification();
      if (sent) {
        showToast({ message: 'Notificação de teste enviada!', type: 'success' });
      } else {
        showToast({
          message: 'Permissão necessária para enviar notificação.',
          type: 'info',
        });
      }
    } catch {
      showToast({ message: 'Erro ao enviar notificação de teste.', type: 'error' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await notificationService.saveConfig(config, user?.id);
      showToast({ message: 'Preferências salvas com sucesso', type: 'success' });
      onClose();
    } catch (err: any) {
      showToast({
        message: err?.message || 'Não foi possível salvar as preferências.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const accentColor = isDark ? '#5ECFC3' : '#1F766E';
  const cardBg = isDark ? '#1F2937' : '#F8FAF9';
  const cardBorder = isDark ? '#334155' : '#DDE6E3';
  const textPrimary = isDark ? '#FFFFFF' : '#17332F';
  const textSecondary = isDark ? '#F1F5F9' : '#5F706C';

  const isBlocked = permissionStatus === 'denied';

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
            {/* Aviso quando as permissões estiverem bloqueadas */}
            {isBlocked && (
              <View style={styles.warningBox}>
                <AlertCircle size={18} color="#D87556" style={{ marginRight: 8, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.warningTitle}>Notificações bloqueadas no navegador</Text>
                  <Text style={styles.warningText}>
                    Para receber lembretes no horário programado:
                  </Text>
                  <Text style={styles.warningStep}>
                    1. Clique no ícone de cadeado / configurações na barra de endereços do navegador.
                  </Text>
                  <Text style={styles.warningStep}>
                    2. Altere a permissão de &ldquo;Notificações&rdquo; para &ldquo;Permitir&rdquo;.
                  </Text>
                  <Text style={styles.warningStep}>
                    3. Recarregue a página para ativar os lembretes.
                  </Text>
                </View>
              </View>
            )}

            {/* 1. Lembrete Diário */}
            <View
              style={[
                styles.configCard,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                  opacity: isBlocked ? 0.65 : 1,
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
                      {isBlocked
                        ? 'Bloqueado no navegador'
                        : config.dailyReminderEnabled
                        ? 'Ativado para check-in de humor'
                        : 'Desativado'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={!isBlocked && config.dailyReminderEnabled}
                  disabled={isBlocked}
                  onValueChange={handleToggleDaily}
                  trackColor={{ false: isDark ? '#334155' : '#DDE6E3', true: accentColor }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel="Ativar lembrete diário"
                />
              </View>

              {!isBlocked && config.dailyReminderEnabled && (
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
                            accessibilityState={{ selected: isSelected }}
                            accessibilityLabel={`Horário: ${hour} ${isSelected ? '(selecionado)' : ''}`}
                            style={[
                              styles.timePill,
                              isSelected && {
                                backgroundColor: accentColor,
                                borderColor: isDark ? '#7FE0D6' : '#147D78',
                                borderWidth: 2,
                              },
                              !isSelected && {
                                backgroundColor: isDark ? '#172033' : '#FFFFFF',
                                borderColor: isDark ? '#334155' : cardBorder,
                                borderWidth: 1,
                              },
                            ]}
                          >
                            {isSelected && (
                              <Check size={12} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 4 }} />
                            )}
                            <Text
                              style={[
                                styles.timePillText,
                                {
                                  color: isSelected ? '#FFFFFF' : textPrimary,
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
                                backgroundColor: accentColor,
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
                                styles.dayBtnText,
                                {
                                  color: isSelected ? '#FFFFFF' : textPrimary,
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
                  opacity: isBlocked ? 0.65 : 1,
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
                      {isBlocked
                        ? 'Bloqueado no navegador'
                        : config.microPausesEnabled
                        ? 'Avisos breves ao longo do dia'
                        : 'Desativado'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={!isBlocked && config.microPausesEnabled}
                  disabled={isBlocked}
                  onValueChange={handleToggleMicroPauses}
                  trackColor={{ false: isDark ? '#334155' : '#DDE6E3', true: accentColor }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel="Ativar micro-pausas"
                />
              </View>

              {!isBlocked && config.microPausesEnabled && (
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

            {/* Teste de Notificação */}
            {permissionStatus === 'granted' && (
              <TouchableOpacity
                onPress={handleSendTest}
                disabled={isTesting}
                style={[
                  styles.testBtn,
                  {
                    borderColor: isDark ? '#334155' : '#DDE6E3',
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  },
                ]}
              >
                <Send size={15} color={accentColor} style={{ marginRight: 6 }} />
                <Text style={[styles.testBtnText, { color: accentColor }]}>
                  {isTesting ? 'Enviando teste...' : 'Enviar notificação de teste'}
                </Text>
              </TouchableOpacity>
            )}
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
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  closeBtn: {
    padding: 4,
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FDF2E9',
    borderColor: '#F6B7A5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A3B24',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#733722',
    lineHeight: 16,
    marginBottom: 6,
  },
  warningStep: {
    fontSize: 11,
    color: '#5C2D24',
    lineHeight: 15,
    marginTop: 2,
  },
  configCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
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
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardDesc: {
    fontSize: 12,
    marginTop: 1,
  },
  cardBody: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    gap: 16,
  },
  fieldSection: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  timePillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  timePillText: {
    fontSize: 13,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBtnText: {
    fontSize: 13,
  },
  frequencyList: {
    gap: 8,
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  frequencyOptionText: {
    fontSize: 13,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  testBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
