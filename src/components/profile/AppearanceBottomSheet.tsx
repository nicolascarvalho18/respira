import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Check, X, Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useThemeStore } from '../../store/themeStore';

export interface AppearanceBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const AppearanceBottomSheet: React.FC<AppearanceBottomSheetProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const { mode, setThemeMode } = useThemeStore();

  if (!visible) return null;

  const handleSelectMode = (newMode: 'light' | 'dark') => {
    setThemeMode(newMode);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E0E5E2',
            },
          ]}
        >
          <View style={styles.header}>
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={[styles.title, { color: isDark ? colors.text : '#1F2927' }]}
            >
              Aparência
            </Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              style={styles.closeBtn}
            >
              <X size={20} color={isDark ? colors.text : '#1F2927'} strokeWidth={1.75} />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsList}>
            {/* Opção Claro */}
            <TouchableOpacity
              onPress={() => handleSelectMode('light')}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === 'light' }}
              style={[
                styles.optionRow,
                { borderBottomColor: isDark ? colors.border : '#E7EBE9' },
              ]}
            >
              <View style={styles.optionLeft}>
                <Sun size={20} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} style={{ marginRight: 12 }} />
                <Text
                  style={[
                    styles.optionLabel,
                    {
                      color: isDark ? colors.text : '#1F2927',
                      fontWeight: mode === 'light' ? '600' : '400',
                    },
                  ]}
                >
                  Claro
                </Text>
              </View>
              {mode === 'light' && (
                <Check size={20} color="#247B74" strokeWidth={2.5} />
              )}
            </TouchableOpacity>

            {/* Opção Escuro */}
            <TouchableOpacity
              onPress={() => handleSelectMode('dark')}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === 'dark' }}
              style={styles.optionRow}
            >
              <View style={styles.optionLeft}>
                <Moon size={20} color={isDark ? colors.textMuted : '#68736F'} strokeWidth={1.75} style={{ marginRight: 12 }} />
                <Text
                  style={[
                    styles.optionLabel,
                    {
                      color: isDark ? colors.text : '#1F2927',
                      fontWeight: mode === 'dark' ? '600' : '400',
                    },
                  ]}
                >
                  Escuro
                </Text>
              </View>
              {mode === 'dark' && (
                <Check size={20} color="#247B74" strokeWidth={2.5} />
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
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
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
  optionsList: {
    width: '100%',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    borderBottomWidth: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 15,
  },
});
