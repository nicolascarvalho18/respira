import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ViewStyle,
  StatusBar,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  withSafeArea?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  keyboardVerticalOffset?: number;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = false,
  withSafeArea = true,
  style,
  contentContainerStyle,
  keyboardVerticalOffset = Platform.OS === 'ios' ? 0 : 20,
}) => {
  const { colors, isDark } = useTheme();

  const ContainerComponent = withSafeArea ? SafeAreaView : View;

  const content = (
    <View
      style={{
        flex: 1,
        width: '100%',
        maxWidth: 640,
        alignSelf: 'center',
      }}
      {...(Platform.OS === 'web'
        ? ({ id: 'conteudo-principal', role: 'main', tabIndex: -1 } as any)
        : {})}
    >
      {children}
    </View>
  );

  return (
    <ContainerComponent
      style={[
        {
          flex: 1,
          backgroundColor: colors.background,
        },
        style,
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Skip Link para web */}
      {Platform.OS === 'web' && (
        <TouchableOpacity
          onPress={() => {
            if (typeof document !== 'undefined') {
              const mainEl = document.getElementById('conteudo-principal');
              if (mainEl) {
                mainEl.focus();
                mainEl.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }}
          accessibilityRole="link"
          accessibilityLabel="Pular para o conteúdo principal"
          style={styles.skipLink}
        >
          <Text style={styles.skipLinkText}>Pular para o conteúdo</Text>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardVerticalOffset}
        style={{ flex: 1 }}
      >
        {scrollable ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              {
                flexGrow: 1,
                paddingHorizontal: 20,
                paddingBottom: 32,
              },
              contentContainerStyle,
            ]}
          >
            {content}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1, paddingHorizontal: 20 }, contentContainerStyle]}>
            {content}
          </View>
        )}
      </KeyboardAvoidingView>
    </ContainerComponent>
  );
};

const styles = StyleSheet.create({
  skipLink: {
    position: 'absolute',
    top: -100,
    left: 16,
    zIndex: 9999,
    backgroundColor: '#2F7F7C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  skipLinkText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
