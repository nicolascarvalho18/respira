import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

export interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  debounceMs?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Buscar conteúdos ou práticas...',
  debounceMs = 250,
  style,
  accessibilityLabel = 'Campo de busca',
}) => {
  const { colors, isDark } = useTheme();
  const [internalText, setInternalText] = useState(value);

  useEffect(() => {
    setInternalText(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onChangeText(internalText);
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [internalText, debounceMs, onChangeText]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Search size={18} color={colors.textMuted} style={styles.searchIcon} />

      <TextInput
        value={internalText}
        onChangeText={setInternalText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        style={[
          styles.input,
          { color: colors.text },
          Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : undefined,
        ]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="search"
      />

      {internalText.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            setInternalText('');
            onChangeText('');
          }}
          accessibilityLabel="Limpar busca"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.clearBtn}
        >
          <X size={16} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 48,
    marginVertical: 6,
    width: '100%',
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
});
