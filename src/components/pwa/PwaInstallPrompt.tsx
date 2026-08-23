import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Download, X } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

export const PwaInstallPrompt: React.FC = () => {
  const { colors, isDark } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isVisible || !deferredPrompt) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderColor: isDark ? colors.border : '#DCE5E2',
        },
      ]}
    >
      <View style={styles.iconCircle}>
        <Download size={16} color="#2F7F7C" />
      </View>
      <View style={{ flex: 1, paddingHorizontal: 10 }}>
        <Text style={[styles.title, { color: '#173D3B' }]}>Instalar o Respira</Text>
        <Text style={[styles.subtitle, { color: '#667775' }]}>
          Acesse direto da sua tela inicial, mesmo sem internet
        </Text>
      </View>
      <TouchableOpacity
        onPress={handleInstallClick}
        style={styles.installBtn}
        accessibilityRole="button"
        accessibilityLabel="Instalar aplicativo"
      >
        <Text style={styles.installBtnText}>Instalar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setIsVisible(false)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.closeBtn}
      >
        <X size={16} color="#8C9E9B" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'fixed' as any,
    bottom: 20,
    left: 20,
    right: 20,
    maxWidth: 420,
    marginHorizontal: 'auto' as any,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#173D3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 9999,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E7F3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  installBtn: {
    backgroundColor: '#2F7F7C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  installBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
});
