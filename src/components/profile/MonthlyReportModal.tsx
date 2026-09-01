import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {
  X,
  FileText,
  Calendar,
  Layers,
  CheckSquare,
  Square,
  AlertCircle,
  Clock,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppButton } from '../ui/AppButton';
import { useAuth } from '../../hooks/useAuth';
import { useMoodStore } from '../../store/moodStore';
import { usePracticeStore } from '../../store/practiceStore';
import { pdfReportService, MONTH_NAMES } from '../../services/report/pdfReportService';
import { useToast } from '../ui/Toast';
import { storage } from '../../services/storage/asyncStorage';

export interface MonthlyReportModalProps {
  visible: boolean;
  onClose: () => void;
}

const AVAILABLE_YEARS = [2024, 2025, 2026, 2027];

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  visible,
  onClose,
}) => {
  const { user } = useAuth();
  const { fetchRecords } = useMoodStore();
  const { fetchPractices } = usePracticeStore();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();

  const currentDate = new Date();
  const [reportType, setReportType] = useState<'month' | 'all'>('month');
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [reportOptions, setReportOptions] = useState({
    includeMoodSummary: true,
    includeSymptoms: true,
    includePractices: true,
    includeDiaryNotes: false,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Carregar preferências persistidas por usuário
  useEffect(() => {
    if (visible && user?.id) {
      const loadUserPrefs = async () => {
        try {
          const saved = await storage.getItem<any>(`respira_report_prefs_${user.id}`);
          if (saved) {
            if (saved.reportType) setReportType(saved.reportType);
            if (typeof saved.selectedMonth === 'number') setSelectedMonth(saved.selectedMonth);
            if (typeof saved.selectedYear === 'number') setSelectedYear(saved.selectedYear);
            if (saved.reportOptions) setReportOptions(saved.reportOptions);
          }
        } catch (_err) {
          // Utiliza valores padrão
        }
      };
      loadUserPrefs();
      setErrorMessage(null);
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

  if (!visible || !user) return null;

  const hasAnyOptionSelected =
    reportOptions.includeMoodSummary ||
    reportOptions.includeSymptoms ||
    reportOptions.includePractices ||
    reportOptions.includeDiaryNotes;

  const toggleOption = (key: keyof typeof reportOptions) => {
    setErrorMessage(null);
    setReportOptions((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      // Salvar preferência atualizada
      if (user?.id) {
        storage.setItem(`respira_report_prefs_${user.id}`, {
          reportType,
          selectedMonth,
          selectedYear,
          reportOptions: updated,
        });
      }
      return updated;
    });
  };

  const handleSelectReportType = (type: 'month' | 'all') => {
    setReportType(type);
    if (user?.id) {
      storage.setItem(`respira_report_prefs_${user.id}`, {
        reportType: type,
        selectedMonth,
        selectedYear,
        reportOptions,
      });
    }
  };

  const handleSelectMonth = (monthIdx: number) => {
    setSelectedMonth(monthIdx);
    if (user?.id) {
      storage.setItem(`respira_report_prefs_${user.id}`, {
        reportType,
        selectedMonth: monthIdx,
        selectedYear,
        reportOptions,
      });
    }
  };

  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
    if (user?.id) {
      storage.setItem(`respira_report_prefs_${user.id}`, {
        reportType,
        selectedMonth,
        selectedYear: year,
        reportOptions,
      });
    }
  };

  const handleGeneratePdf = async () => {
    if (!hasAnyOptionSelected) {
      setErrorMessage('Selecione pelo menos uma informação para incluir.');
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage(null);

      // Sempre busca os dados mais recentes do usuário autenticado
      await Promise.all([fetchRecords(), fetchPractices()]);

      const currentRecords = useMoodStore.getState().records;
      const currentPractices = usePracticeStore.getState().practices;

      const html = pdfReportService.generateHtmlReport(
        user,
        currentRecords,
        currentPractices,
        {
          allMonths: reportType === 'all',
          month: selectedMonth,
          year: selectedYear,
          includeMoodSummary: reportOptions.includeMoodSummary,
          includeSymptoms: reportOptions.includeSymptoms,
          includePractices: reportOptions.includePractices,
          includeDiaryNotes: reportOptions.includeDiaryNotes,
        }
      );

      const fileName =
        reportType === 'all'
          ? `respira-relatorio-completo-${selectedYear}.pdf`
          : `respira-relatorio-${MONTH_NAMES[selectedMonth].toLowerCase()}-${selectedYear}.pdf`;

      await pdfReportService.exportOrPrintReport(html, fileName);

      showToast({ message: 'Relatório pronto', type: 'success' });
      onClose();
    } catch (err: any) {
      console.error('[MonthlyReportModal] Erro ao gerar relatório:', err);
      setErrorMessage('Não foi possível gerar o relatório. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const isSmallScreen = width < 360;
  const numColumns = isSmallScreen ? 2 : 3;

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
                style={[styles.title, { color: isDark ? '#FFFFFF' : '#17332F' }]}
              >
                Relatório em PDF
              </Text>
              <Text style={[styles.subtitle, { color: isDark ? '#F1F5F9' : '#5F706C' }]}>
                Escolha o período e as informações
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Fechar janela"
              style={styles.closeBtn}
            >
              <X size={20} color={isDark ? '#F1F5F9' : '#5F706C'} strokeWidth={1.75} />
            </TouchableOpacity>
          </View>

          {/* Conteúdo Rolável */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Tipo de Relatório */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionLabel, { color: isDark ? '#FFFFFF' : '#17332F' }]}>
                Tipo de relatório
              </Text>
              <View style={styles.scopeTabsRow}>
                <TouchableOpacity
                  onPress={() => handleSelectReportType('month')}
                  activeOpacity={0.8}
                  style={[
                    styles.scopeTab,
                    reportType === 'month' && {
                      backgroundColor: isDark ? '#5ECFC3' : '#247B74',
                      borderColor: isDark ? '#5ECFC3' : '#247B74',
                    },
                    reportType !== 'month' && {
                      backgroundColor: isDark ? '#1F2937' : '#F8FAF9',
                      borderColor: isDark ? '#334155' : '#DDE6E3',
                    },
                  ]}
                >
                  <Calendar
                    size={16}
                    color={
                      reportType === 'month'
                        ? isDark
                          ? '#172033'
                          : '#FFFFFF'
                        : isDark
                        ? '#F1F5F9'
                        : '#5F706C'
                    }
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.scopeTabText,
                      {
                        color:
                          reportType === 'month'
                            ? isDark
                              ? '#172033'
                              : '#FFFFFF'
                            : isDark
                            ? '#F1F5F9'
                            : '#5F706C',
                        fontWeight: reportType === 'month' ? '700' : '500',
                      },
                    ]}
                  >
                    Mês específico
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSelectReportType('all')}
                  activeOpacity={0.8}
                  style={[
                    styles.scopeTab,
                    reportType === 'all' && {
                      backgroundColor: isDark ? '#5ECFC3' : '#247B74',
                      borderColor: isDark ? '#5ECFC3' : '#247B74',
                    },
                    reportType !== 'all' && {
                      backgroundColor: isDark ? '#1F2937' : '#F8FAF9',
                      borderColor: isDark ? '#334155' : '#DDE6E3',
                    },
                  ]}
                >
                  <Layers
                    size={16}
                    color={
                      reportType === 'all'
                        ? isDark
                          ? '#172033'
                          : '#FFFFFF'
                        : isDark
                        ? '#F1F5F9'
                        : '#5F706C'
                    }
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.scopeTabText,
                      {
                        color:
                          reportType === 'all'
                            ? isDark
                              ? '#172033'
                              : '#FFFFFF'
                            : isDark
                            ? '#F1F5F9'
                            : '#5F706C',
                        fontWeight: reportType === 'all' ? '700' : '500',
                      },
                    ]}
                  >
                    Histórico completo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Período (Mês e Ano) - Apenas se for mês específico */}
            {reportType === 'month' && (
              <View style={styles.sectionBlock}>
                {/* Seletor de Ano */}
                <View style={styles.yearRowHeader}>
                  <Text style={[styles.sectionLabel, { color: isDark ? '#FFFFFF' : '#17332F' }]}>
                    Ano
                  </Text>
                  <View style={styles.yearPills}>
                    {AVAILABLE_YEARS.map((y) => {
                      const isSelected = selectedYear === y;
                      return (
                        <TouchableOpacity
                          key={y}
                          onPress={() => handleSelectYear(y)}
                          style={[
                            styles.yearBtn,
                            isSelected && {
                              backgroundColor: isDark ? '#5ECFC3' : '#247B74',
                              borderColor: isDark ? '#5ECFC3' : '#247B74',
                            },
                            !isSelected && {
                              backgroundColor: isDark ? '#1F2937' : '#F8FAF9',
                              borderColor: isDark ? '#334155' : '#DDE6E3',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.yearBtnText,
                              {
                                color: isSelected
                                  ? isDark
                                    ? '#172033'
                                    : '#FFFFFF'
                                  : isDark
                                  ? '#F1F5F9'
                                  : '#5F706C',
                                fontWeight: isSelected ? '700' : '500',
                              },
                            ]}
                          >
                            {y}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Grade dos 12 Meses (3 Colunas) */}
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: isDark ? '#FFFFFF' : '#17332F', marginTop: 12 },
                  ]}
                >
                  Mês
                </Text>
                <View style={styles.monthGrid}>
                  {MONTH_NAMES.map((monthName, idx) => {
                    const isSelected = selectedMonth === idx;
                    return (
                      <TouchableOpacity
                        key={monthName}
                        onPress={() => handleSelectMonth(idx)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={`Selecionar mês de ${monthName}`}
                        style={[
                          styles.monthGridItem,
                          { width: `${100 / numColumns - 2}%` },
                          isSelected && {
                            backgroundColor: isDark ? '#5ECFC3' : '#247B74',
                            borderColor: isDark ? '#5ECFC3' : '#247B74',
                          },
                          !isSelected && {
                            backgroundColor: isDark ? '#1F2937' : '#F8FAF9',
                            borderColor: isDark ? '#334155' : '#DDE6E3',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.monthGridText,
                            {
                              color: isSelected
                                ? isDark
                                  ? '#172033'
                                  : '#FFFFFF'
                                : isDark
                                ? '#FFFFFF'
                                : '#17332F',
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {monthName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Dados Incluídos no Documento (Checkboxes) */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionLabel, { color: isDark ? '#FFFFFF' : '#17332F' }]}>
                Incluir no relatório
              </Text>
              <View
                style={[
                  styles.optionsCard,
                  {
                    backgroundColor: isDark ? '#1F2937' : '#F8FAF9',
                    borderColor: isDark ? '#334155' : '#DDE6E3',
                  },
                ]}
              >
                {/* 1. Humor e ansiedade */}
                <TouchableOpacity
                  onPress={() => toggleOption('includeMoodSummary')}
                  activeOpacity={0.8}
                  style={styles.optionRow}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: reportOptions.includeMoodSummary }}
                  accessibilityLabel="Humor e ansiedade"
                >
                  {reportOptions.includeMoodSummary ? (
                    <CheckSquare size={18} color={isDark ? '#5ECFC3' : '#247B74'} strokeWidth={2.2} />
                  ) : (
                    <Square size={18} color={isDark ? '#64748B' : '#A0AEC0'} strokeWidth={2} />
                  )}
                  <Text style={[styles.optionLabel, { color: isDark ? '#FFFFFF' : '#17332F' }]}>
                    Humor e ansiedade
                  </Text>
                </TouchableOpacity>

                {/* 2. Sintomas e emoções */}
                <TouchableOpacity
                  onPress={() => toggleOption('includeSymptoms')}
                  activeOpacity={0.8}
                  style={styles.optionRow}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: reportOptions.includeSymptoms }}
                  accessibilityLabel="Sintomas e emoções"
                >
                  {reportOptions.includeSymptoms ? (
                    <CheckSquare size={18} color={isDark ? '#5ECFC3' : '#247B74'} strokeWidth={2.2} />
                  ) : (
                    <Square size={18} color={isDark ? '#64748B' : '#A0AEC0'} strokeWidth={2} />
                  )}
                  <Text style={[styles.optionLabel, { color: isDark ? '#FFFFFF' : '#17332F' }]}>
                    Sintomas e emoções
                  </Text>
                </TouchableOpacity>

                {/* 3. Práticas concluídas */}
                <TouchableOpacity
                  onPress={() => toggleOption('includePractices')}
                  activeOpacity={0.8}
                  style={styles.optionRow}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: reportOptions.includePractices }}
                  accessibilityLabel="Práticas concluídas"
                >
                  {reportOptions.includePractices ? (
                    <CheckSquare size={18} color={isDark ? '#5ECFC3' : '#247B74'} strokeWidth={2.2} />
                  ) : (
                    <Square size={18} color={isDark ? '#64748B' : '#A0AEC0'} strokeWidth={2} />
                  )}
                  <Text style={[styles.optionLabel, { color: isDark ? '#FFFFFF' : '#17332F' }]}>
                    Práticas concluídas
                  </Text>
                </TouchableOpacity>

                {/* 4. Anotações do diário */}
                <TouchableOpacity
                  onPress={() => toggleOption('includeDiaryNotes')}
                  activeOpacity={0.8}
                  style={[styles.optionRow, { borderBottomWidth: 0 }]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: reportOptions.includeDiaryNotes }}
                  accessibilityLabel="Anotações do diário"
                >
                  {reportOptions.includeDiaryNotes ? (
                    <CheckSquare size={18} color={isDark ? '#5ECFC3' : '#247B74'} strokeWidth={2.2} />
                  ) : (
                    <Square size={18} color={isDark ? '#64748B' : '#A0AEC0'} strokeWidth={2} />
                  )}
                  <Text style={[styles.optionLabel, { color: isDark ? '#FFFFFF' : '#17332F' }]}>
                    Anotações do diário
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Aviso informativo curto */}
            <View style={styles.disclaimerBox}>
              <Text style={[styles.disclaimerText, { color: isDark ? '#CBD5E1' : '#5F706C' }]}>
                Este relatório é pessoal e pode ser impresso ou salvo para levar ao seu psicólogo ou médico.
              </Text>
            </View>

            {/* Mensagem de Erro ou Validação */}
            {errorMessage && (
              <View style={styles.errorAlert}>
                <AlertCircle size={16} color="#C84E45" style={{ marginRight: 6 }} />
                <Text style={styles.errorAlertText}>{errorMessage}</Text>
              </View>
            )}
          </ScrollView>

          {/* Botões de Ação na Base */}
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
              disabled={isGenerating}
              style={[
                styles.cancelBtn,
                {
                  borderColor: isDark ? '#334155' : '#DDE6E3',
                },
              ]}
              accessibilityRole="button"
            >
              <Text style={[styles.cancelBtnText, { color: isDark ? '#F1F5F9' : '#5F706C' }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <AppButton
              title={isGenerating ? 'Preparando relatório...' : 'Gerar PDF'}
              onPress={handleGeneratePdf}
              isLoading={isGenerating}
              disabled={isGenerating || !hasAnyOptionSelected}
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
  sectionBlock: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  scopeTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scopeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  scopeTabText: {
    fontSize: 13.5,
  },
  yearRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  yearPills: {
    flexDirection: 'row',
    gap: 6,
  },
  yearBtn: {
    paddingHorizontal: 10,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  yearBtnText: {
    fontSize: 12.5,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  monthGridItem: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginBottom: 2,
  },
  monthGridText: {
    fontSize: 13,
    textAlign: 'center',
  },
  optionsCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DDE6E3',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  disclaimerBox: {
    paddingHorizontal: 4,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 17,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEB',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F8C8C6',
  },
  errorAlertText: {
    color: '#9B2C2C',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
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
