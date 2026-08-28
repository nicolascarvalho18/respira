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
  FileText,
  Printer,
  Calendar,
  ShieldCheck,
  CheckSquare,
  Square,
  AlertCircle,
  Layers,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppButton } from '../ui/AppButton';
import { useAuth } from '../../hooks/useAuth';
import { useMoodStore } from '../../store/moodStore';
import { usePracticeStore } from '../../store/practiceStore';
import { pdfReportService, ReportOptions } from '../../services/report/pdfReportService';
import { useToast } from '../ui/Toast';

export interface MonthlyReportModalProps {
  visible: boolean;
  onClose: () => void;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  visible,
  onClose,
}) => {
  const { user } = useAuth();
  const { records, fetchRecords } = useMoodStore();
  const { practices, fetchPractices } = usePracticeStore();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [generateAllMonths, setGenerateAllMonths] = useState(false);

  const [includeStats, setIncludeStats] = useState(true);
  const [includeEmotions, setIncludeEmotions] = useState(true);
  const [includePractices, setIncludePractices] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);

  if (!visible || !user) return null;

  const handleGeneratePdf = async () => {
    try {
      setIsGenerating(true);

      // Sempre busca os dados mais recentes do backend/storage antes de gerar o PDF
      await Promise.all([fetchRecords(), fetchPractices()]);

      const currentRecords = useMoodStore.getState().records;
      const currentPractices = usePracticeStore.getState().practices;

      const options: ReportOptions = {
        allMonths: generateAllMonths,
        month: selectedMonth,
        year: selectedYear,
        includeStats,
        includeEmotions,
        includePractices,
        includeNotes,
      };

      const html = pdfReportService.generateHtmlReport(
        user,
        currentRecords,
        currentPractices,
        options
      );

      const fileName = generateAllMonths
        ? `respira-relatorio-completo-${selectedYear}.pdf`
        : `respira-relatorio-${MONTHS[selectedMonth].toLowerCase()}-${selectedYear}.pdf`;

      await pdfReportService.exportOrPrintReport(html, fileName);

      showToast({ message: 'Relatório pronto', type: 'success' });
      onClose();
    } catch (_err) {
      showToast({ message: 'Erro ao gerar relatório em PDF. Tente novamente.', type: 'error' });
    } finally {
      setIsGenerating(false);
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
                Relatório Mensal em PDF
              </Text>
              <Text style={[styles.subtitle, { color: isDark ? colors.textMuted : '#667775' }]}>
                Acompanhamento para levar à terapia ou salvar
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
            {/* Modo de Escopo: Mês Único vs Todos os Meses */}
            <View style={styles.scopeSelectorRow}>
              <TouchableOpacity
                onPress={() => setGenerateAllMonths(false)}
                style={[
                  styles.scopeBtn,
                  !generateAllMonths && styles.scopeBtnActive,
                  {
                    backgroundColor: !generateAllMonths
                      ? '#2F7F7C'
                      : isDark
                      ? colors.surfaceSecondary
                      : '#F2F6F5',
                    borderColor: !generateAllMonths ? '#2F7F7C' : isDark ? colors.border : '#DCE5E2',
                  },
                ]}
              >
                <Calendar
                  size={14}
                  color={!generateAllMonths ? '#FFFFFF' : isDark ? colors.text : '#667775'}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.scopeBtnText,
                    {
                      color: !generateAllMonths ? '#FFFFFF' : isDark ? colors.text : '#667775',
                      fontWeight: !generateAllMonths ? '700' : '500',
                    },
                  ]}
                >
                  Mês Específico
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setGenerateAllMonths(true)}
                style={[
                  styles.scopeBtn,
                  generateAllMonths && styles.scopeBtnActive,
                  {
                    backgroundColor: generateAllMonths
                      ? '#2F7F7C'
                      : isDark
                      ? colors.surfaceSecondary
                      : '#F2F6F5',
                    borderColor: generateAllMonths ? '#2F7F7C' : isDark ? colors.border : '#DCE5E2',
                  },
                ]}
              >
                <Layers
                  size={14}
                  color={generateAllMonths ? '#FFFFFF' : isDark ? colors.text : '#667775'}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.scopeBtnText,
                    {
                      color: generateAllMonths ? '#FFFFFF' : isDark ? colors.text : '#667775',
                      fontWeight: generateAllMonths ? '700' : '500',
                    },
                  ]}
                >
                  Histórico Completo
                </Text>
              </TouchableOpacity>
            </View>

            {/* 1. Seletor de Mês se modo mês único estiver ativo */}
            {!generateAllMonths && (
              <>
                <Text style={[styles.sectionHeading, { color: isDark ? colors.text : '#173D3B' }]}>
                  Selecione o mês do relatório:
                </Text>
                <View style={styles.monthScrollWrapper}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.monthsRow}
                  >
                    {MONTHS.map((m, idx) => {
                      const isSelected = selectedMonth === idx;
                      return (
                        <TouchableOpacity
                          key={m}
                          onPress={() => setSelectedMonth(idx)}
                          style={[
                            styles.monthPill,
                            isSelected && {
                              backgroundColor: '#2F7F7C',
                              borderColor: '#2F7F7C',
                            },
                            {
                              backgroundColor: isSelected
                                ? '#2F7F7C'
                                : isDark
                                ? colors.surfaceSecondary
                                : '#F2F6F5',
                              borderColor: isSelected
                                ? '#2F7F7C'
                                : isDark
                                ? colors.border
                                : '#DCE5E2',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.monthPillText,
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
                            {m}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </>
            )}

            {/* 2. Seleção de Dados Incluídos */}
            <Text
              style={[
                styles.sectionHeading,
                { color: isDark ? colors.text : '#173D3B', marginTop: 14 },
              ]}
            >
              Dados incluídos no documento:
            </Text>

            <View
              style={[
                styles.optionsBox,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFA',
                  borderColor: isDark ? colors.border : '#EBF1EF',
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => setIncludeStats(!includeStats)}
                style={styles.checkboxRow}
              >
                {includeStats ? (
                  <CheckSquare size={18} color="#2F7F7C" />
                ) : (
                  <Square size={18} color="#8C9E9B" />
                )}
                <Text style={[styles.checkboxLabel, { color: isDark ? colors.text : '#173D3B' }]}>
                  Resumo estatístico de humor e ansiedade
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIncludeEmotions(!includeEmotions)}
                style={styles.checkboxRow}
              >
                {includeEmotions ? (
                  <CheckSquare size={18} color="#2F7F7C" />
                ) : (
                  <Square size={18} color="#8C9E9B" />
                )}
                <Text style={[styles.checkboxLabel, { color: isDark ? colors.text : '#173D3B' }]}>
                  Detalhamento de sintomas e emoções relatadas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIncludePractices(!includePractices)}
                style={styles.checkboxRow}
              >
                {includePractices ? (
                  <CheckSquare size={18} color="#2F7F7C" />
                ) : (
                  <Square size={18} color="#8C9E9B" />
                )}
                <Text style={[styles.checkboxLabel, { color: isDark ? colors.text : '#173D3B' }]}>
                  Práticas de respiração e relaxamento concluídas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIncludeNotes(!includeNotes)}
                style={styles.checkboxRow}
              >
                {includeNotes ? (
                  <CheckSquare size={18} color="#2F7F7C" />
                ) : (
                  <Square size={18} color="#8C9E9B" />
                )}
                <Text style={[styles.checkboxLabel, { color: isDark ? colors.text : '#173D3B' }]}>
                  Incluir anotações pessoais do diário
                </Text>
              </TouchableOpacity>
            </View>

            {/* Aviso Ético */}
            <View
              style={[
                styles.disclaimerBox,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
                  borderColor: isDark ? colors.border : '#D8EBE4',
                },
              ]}
            >
              <ShieldCheck size={16} color="#2F7F7C" style={{ marginRight: 6 }} />
              <Text
                style={[
                  styles.disclaimerText,
                  { color: isDark ? colors.textMuted : '#567571' },
                ]}
              >
                Este relatório é um documento pessoal para fins informativos e de suporte
                terapêutico, sem diagnósticos automáticos.
              </Text>
            </View>
          </ScrollView>

          {/* Ações */}
          <View style={styles.actionsRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <AppButton
                title="Fechar"
                variant="outline"
                size="md"
                onPress={onClose}
                disabled={isGenerating}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <AppButton
                title={isGenerating ? 'Gerando...' : 'Gerar PDF'}
                leftIcon={<Printer size={16} color="#FFFFFF" />}
                size="md"
                isLoading={isGenerating}
                onPress={handleGeneratePdf}
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
    maxWidth: 460,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
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
  scopeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  scopeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  scopeBtnActive: {
    borderWidth: 1.5,
  },
  scopeBtnText: {
    fontSize: 12,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  monthScrollWrapper: {
    marginBottom: 6,
  },
  monthsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  monthPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  monthPillText: {
    fontSize: 12,
  },
  optionsBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    marginBottom: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 12,
    flex: 1,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 14,
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
});
