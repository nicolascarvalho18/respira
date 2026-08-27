import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import {
  X,
  Check,
  Search,
  Wind,
  Activity,
  Compass,
  Leaf,
  Heart,
  Square,
  ChevronRight,
  Bookmark,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { Practice } from '../../types';
import { ConfirmationModal } from '../ui/ConfirmationModal';

export interface PracticeSelectorModalProps {
  visible: boolean;
  practices: Practice[];
  currentPracticeId: string;
  isActivityInProgress: boolean;
  onClose: () => void;
  onSelectPractice: (practice: Practice) => void;
}

export const PracticeSelectorModal: React.FC<PracticeSelectorModalProps> = ({
  visible,
  practices,
  currentPracticeId,
  isActivityInProgress,
  onClose,
  onSelectPractice,
}) => {
  const { colors, isDark } = useTheme();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pendingPractice, setPendingPractice] = useState<Practice | null>(null);

  if (!visible) return null;

  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'breathing', label: 'Respiração' },
    { id: 'guided_meditation', label: 'Meditação' },
    { id: 'body_movement', label: 'Corpo & Movimento' },
    { id: 'relaxation', label: 'Relaxamento' },
    { id: 'sleep', label: 'Sono' },
    { id: 'mindfulness_focus', label: 'Atenção & Foco' },
    { id: 'quick_pauses', label: 'Pausas Rápidas' },
    { id: 'morning_routine', label: 'Rotina Manhã' },
    { id: 'bedtime_prep', label: 'Prep. Dormir' },
  ];

  const filteredPractices = practices.filter((p) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.subtitle && p.subtitle.toLowerCase().includes(q)) ||
      p.description.toLowerCase().includes(q);

    if (!matchSearch) return false;
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'guided_meditation') {
      return p.category === 'guided_meditation' || p.category === 'meditation';
    }
    if (selectedCategory === 'mindfulness_focus') {
      return p.category === 'mindfulness_focus' || p.category === 'mindfulness';
    }
    return p.category === selectedCategory;
  });

  const handlePracticeClick = (p: Practice) => {
    if (p.id === currentPracticeId) {
      onClose();
      return;
    }

    if (isActivityInProgress) {
      setPendingPractice(p);
    } else {
      onSelectPractice(p);
      onClose();
    }
  };

  const handleConfirmSwitch = () => {
    if (pendingPractice) {
      onSelectPractice(pendingPractice);
      setPendingPractice(null);
      onClose();
    }
  };

  const renderIcon = (iconName: string, isSelected: boolean) => {
    const color = isSelected ? '#FFFFFF' : '#2F7F7C';
    switch (iconName) {
      case 'wind':
        return <Wind size={20} color={color} />;
      case 'activity':
        return <Activity size={20} color={color} />;
      case 'compass':
        return <Compass size={20} color={color} />;
      case 'leaf':
      case 'sparkles':
        return <Leaf size={20} color={color} aria-hidden={true} />;
      case 'square':
        return <Square size={20} color={color} />;
      case 'heart':
      default:
        return <Heart size={20} color={color} />;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalBox,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          {/* Topo do Modal */}
          <View style={styles.topRow}>
            <View>
              <Text style={[styles.modalTitle, { color: '#173D3B' }]}>Alterar Exercício</Text>
              <Text style={[styles.modalSubtitle, { color: '#667775' }]}>
                Selecione uma nova prática para iniciar
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Fechar seleção de práticas"
            >
              <X size={20} color="#667775" />
            </TouchableOpacity>
          </View>

          {/* Campo de Busca */}
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F2F6F5',
                borderColor: isDark ? colors.border : '#DCE5E2',
              },
            ]}
          >
            <Search size={16} color="#8C9E9B" style={{ marginRight: 8 }} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por nome ou objetivo..."
              placeholderTextColor="#8C9E9B"
              style={[styles.searchInput, { color: colors.text }]}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <X size={16} color="#8C9E9B" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filtros de Categoria */}
          <View style={styles.catChipsRow}>
            {categories.map((c) => {
              const active = selectedCategory === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setSelectedCategory(c.id)}
                  style={[
                    styles.catChip,
                    active && styles.catChipActive,
                    {
                      backgroundColor: active
                        ? '#2F7F7C'
                        : isDark
                        ? colors.surfaceSecondary
                        : '#FFFFFF',
                      borderColor: active ? '#2F7F7C' : isDark ? colors.border : '#DCE5E2',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      { color: active ? '#FFFFFF' : '#667775', fontWeight: active ? '700' : '500' },
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Lista com Rolagem dos Exercícios */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {filteredPractices.map((p) => {
              const isSelected = p.id === currentPracticeId;

              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => handlePracticeClick(p)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`Selecionar ${p.title}`}
                  style={[
                    styles.practiceItem,
                    isSelected && styles.practiceItemSelected,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? '#1C3835'
                          : '#E7F3EF'
                        : isDark
                        ? colors.surfaceSecondary
                        : '#FFFFFF',
                      borderColor: isSelected ? '#2F7F7C' : isDark ? colors.border : '#EBF1EF',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.itemIconCircle,
                      { backgroundColor: isSelected ? '#2F7F7C' : '#E7F3EF' },
                    ]}
                  >
                    {renderIcon(p.icon || 'wind', isSelected)}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.itemTitle, { color: '#173D3B' }]}>{p.title}</Text>
                      {isSelected && (
                        <View style={styles.activeTag}>
                          <Text style={styles.activeTagText}>EM USO</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.itemSub, { color: '#667775' }]} numberOfLines={1}>
                      {p.subtitle || p.description}
                    </Text>
                    <Text style={[styles.itemMeta, { color: '#2F7F7C' }]}>
                      {p.durationMinutes} min • {p.level}
                    </Text>
                  </View>

                  {isSelected ? (
                    <Check size={20} color="#2F7F7C" strokeWidth={2.5} />
                  ) : (
                    <ChevronRight size={18} color="#8C9E9B" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Diálogo de Confirmação para Troca em Andamento */}
      <ConfirmationModal
        visible={!!pendingPractice}
        title="Trocar de exercício?"
        message={`Você possui uma atividade em andamento. Deseja pausar o exercício atual e iniciar "${pendingPractice?.title}"?`}
        confirmTitle="Trocar exercício"
        cancelTitle="Continuar atual"
        onConfirm={handleConfirmSwitch}
        onCancel={() => setPendingPractice(null)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 61, 59, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '88%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
    padding: 0,
  },
  catChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  catChipActive: {
    borderWidth: 1.5,
  },
  catChipText: {
    fontSize: 12,
  },
  practiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  practiceItemSelected: {
    borderWidth: 2,
  },
  itemIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  itemMeta: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  activeTag: {
    backgroundColor: '#2F7F7C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
