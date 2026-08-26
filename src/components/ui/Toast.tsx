import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

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
  const { colors, isDark } = useTheme();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const hideToast = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setToast(null);
    });
  }, [fadeAnim]);

  const showToast = useCallback(
    (options: ToastOptions | string) => {
      const opts: ToastOptions =
        typeof options === 'string' ? { message: options, type: 'info' } : options;

      setToast({
        message: opts.message,
        type: opts.type || 'info',
      });

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }).start();

      const duration = opts.duration || 3500;
      setTimeout(() => {
        hideToast();
      }, duration);
    },
    [fadeAnim, hideToast]
  );

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: isDark ? colors.successLight : '#E8F5EF',
          border: colors.success,
          text: isDark ? '#C7E8D8' : '#1F533E',
          icon: <CheckCircle2 size={20} color={colors.success} />,
        };
      case 'error':
        return {
          bg: isDark ? colors.errorLight : '#FDF0F0',
          border: colors.error,
          text: isDark ? '#F5C6C6' : '#732222',
          icon: <AlertCircle size={20} color={colors.error} />,
        };
      case 'warning':
        return {
          bg: isDark ? colors.warningLight : '#FDF2EC',
          border: colors.warning,
          text: isDark ? '#F7D0C0' : '#8A4126',
          icon: <AlertTriangle size={20} color={colors.warning} />,
        };
      default:
        return {
          bg: isDark ? colors.infoLight : '#EDF4F9',
          border: colors.info,
          text: isDark ? '#BED8EB' : '#1C4B6B',
          icon: <Info size={20} color={colors.info} />,
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
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
                  styles.toastBubble,
                  {
                    backgroundColor: style.bg,
                    borderColor: style.border,
                  },
                ]}
              >
                {style.icon}
                <Text style={[styles.toastText, { color: style.text }]}>{toast.message}</Text>
                <TouchableOpacity
                  onPress={hideToast}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Fechar aviso"
                  style={styles.closeBtn}
                >
                  <X size={16} color={style.text} />
                </TouchableOpacity>
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
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 99999,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  toastBubble: {
    maxWidth: 500,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    gap: 12,
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  closeBtn: {
    padding: 4,
  },
});
