import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Check, AlertCircle, AlertTriangle, Info } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextData {
  showToast: (options: ToastOptions | string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextData>({
  showToast: () => {},
  hideToast: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const reducedMotion = user?.preferences?.reducedMotion ?? false;

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<any>(null);

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (reducedMotion) {
      fadeAnim.setValue(0);
      setToast(null);
      return;
    }

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setToast(null);
    });
  }, [fadeAnim, reducedMotion]);

  const showToast = useCallback(
    (options: ToastOptions | string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const opts: ToastOptions =
        typeof options === 'string' ? { message: options, type: 'info' } : options;

      setToast({
        message: opts.message,
        type: opts.type || 'info',
      });

      if (reducedMotion) {
        fadeAnim.setValue(1);
      } else {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      }

      // Desaparece automaticamente após 2,5 segundos
      const duration = opts.duration || 2500;
      timeoutRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [fadeAnim, hideToast, reducedMotion]
  );

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: isDark ? '#183B38' : '#EAF7F3',
          border: isDark ? '#2C5D58' : '#B8E0D8',
          text: isDark ? '#FFFFFF' : '#176B61',
          iconColor: isDark ? '#5ECFC3' : '#238C82',
          icon: <Check size={17} color={isDark ? '#5ECFC3' : '#238C82'} strokeWidth={2.5} />,
        };
      case 'error':
        return {
          bg: isDark ? '#3D1D1B' : '#FDECEB',
          border: isDark ? '#5E2E2A' : '#F8C8C6',
          text: isDark ? '#FFFFFF' : '#9B2C2C',
          iconColor: isDark ? '#F28B82' : '#C84E45',
          icon: <AlertCircle size={17} color={isDark ? '#F28B82' : '#C84E45'} strokeWidth={2.2} />,
        };
      case 'warning':
        return {
          bg: isDark ? '#3A2714' : '#FFF7E6',
          border: isDark ? '#5D3F20' : '#FFE0B2',
          text: isDark ? '#FFFFFF' : '#975A16',
          iconColor: isDark ? '#F28B82' : '#D87556',
          icon: <AlertTriangle size={17} color={isDark ? '#F28B82' : '#D87556'} strokeWidth={2.2} />,
        };
      default:
        return {
          bg: isDark ? '#183B38' : '#EAF7F3',
          border: isDark ? '#2C5D58' : '#B8E0D8',
          text: isDark ? '#FFFFFF' : '#176B61',
          iconColor: isDark ? '#5ECFC3' : '#238C82',
          icon: <Info size={17} color={isDark ? '#5ECFC3' : '#238C82'} strokeWidth={2.2} />,
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastWrapper,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          {(() => {
            const style = getToastStyle(toast.type);
            return (
              <View
                style={[
                  styles.toastPill,
                  {
                    backgroundColor: style.bg,
                    borderColor: style.border,
                  },
                ]}
              >
                <View style={styles.iconWrap}>{style.icon}</View>
                <Text
                  style={[
                    styles.toastMessage,
                    { color: style.text },
                  ]}
                  numberOfLines={2}
                >
                  {toast.message}
                </Text>
              </View>
            );
          })()}
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 24,
    left: 16,
    right: 16,
    zIndex: 999999,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  toastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    maxHeight: 52,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'center',
    maxWidth: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  iconWrap: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastMessage: {
    fontSize: 14.5,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
});
