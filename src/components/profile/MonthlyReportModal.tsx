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
  const { records } = useMoodStore();
  const { practices } = usePracticeStore();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [includeStats, setIncludeStats] = useState(true);
  const [includeEmotions, setIncludeEmotions] = useState(true);
  const [includePractices, setIncludePractices] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);

  if (!visible || !user) return null;

  const handleGeneratePdf = async () => {
    try {
      setIsGenerating(true);
      const options: ReportOptions = {
        month: selectedMonth,
        year: selectedYear,
        includeStats,
        includeEmotions,
        includePractices,
        includeNotes,
      };

      const html = pdfReportService.generateHtmlReport(user, records, practices, options);
      const fileName = `respira-relatorio-${MONTHS[selectedMonth].toLowerCase()}-${selectedYear}.pdf`;
      await pdfReportService.exportOrPrintReport(html, fileName);

      showToast({ message: 'Relatório gerado para impressão e salvamento.', type: 'success' });
      onClose();
    } catch {
      showToast({ message: 'Erro ao gerar relatório em PDF.', type: 'error' });
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
              <Text style={[styles.title, { color: '#173D3B' }]}>
                Relatório Mensal em PDF
              </Text>
              <Text style={[styles.subtitle, { color: '#667775' }]}>
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

          <ScrollView style={{ maxHeight: 380 }}>
            {/* 1. Seletor de Mês e Ano */}
            <Text style={[styles.sectionHeading, { color: '#173D3B' }]}>
              Selecione o mês do relatório:
            </Text>
            <View style={styles.monthScrollWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthsRow}>
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
                          backgroundColor: isDark ? colors.surfaceSecondary : isSelected ? '#2F7F7C' : '#F2F6F5',
                          borderColor: isDark ? colors.border : '#DCE5E2',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.monthPillText,
                          {
                            color: isSelected ? '#FFFFFF' : isDark ? colors.text : '#173D3B',
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

            {/* 2. Seleção de Dados Incluídos */}
            <Text style={[styles.sectionHeading, { color: '#173D3B', marginTop: 14 }]}>
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
                {includeStats ? <CheckSquare size={18} color="#2F7F7C" /> : <Square size={18} color="#8C9E9B" />}
                <Text style={[styles.checkboxLabel, { color: '#173D3B' }]}>
                  Resumo estatístico de humor e ansiedade
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIncludeEmotions(!includeEmotions)}
                style={styles.checkboxRow}
              >
                {includeEmotions ? <CheckSquare size={18} color="#2F7F7C" /> : <Square size={18} color="#8C9E9B" />}
                <Text style={[styles.checkboxLabel, { color: '#173D3B' }]}>
                  Detalhamento de sintomas e emoções relatadas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIncludePractices(!includePractices)}
                style={styles.checkboxRow}
              >
                {includePractices ? <CheckSquare size={18} color="#2F7F7C" /> : <Square size={18} color="#8C9E9B" />}
                <Text style={[styles.checkboxLabel, { color: '#173D3B' }]}>
                  Práticas de respiração e relaxamento concluídas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIncludeNotes(!includeNotes)}
                style={styles.checkboxRow}
              >
                {includeNotes ? <CheckSquare size={18} color="#2F7F7C" /> : <Square size={18} color="#8C9E9B" />}
                <Text style={[styles.checkboxLabel, { color: '#173D3B' }]}>
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
              <Text style={[styles.disclaimerText, { color: '#567571' }]}>
                Este relatório é um documento pessoal para fins informativos e de suporte terapêutico, sem diagnósticos automáticos.
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
                title="Gerar PDF"
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
    backgroundColor: 'rgba(23, 61, 59, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
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
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  monthScrollWrapper: {
    marginBottom: 4,
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
  },
});
