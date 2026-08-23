import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ViewStyle,
  StatusBar,
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
        maxWidth: 640, // Centralização ideal para tablets e Expo Web
        alignSelf: 'center',
      }}
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
