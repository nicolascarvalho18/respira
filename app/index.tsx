import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Wind } from 'lucide-react-native';
import { useAuth } from '../src/hooks/useAuth';
import { useTheme } from '../src/hooks/useTheme';
import { useReducedMotion } from '../src/hooks/useReducedMotion';

export default function SplashScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isAuthenticated, isLoading, isOnboardingCompleted } = useAuth();
  const reducedMotion = useReducedMotion();

  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!reducedMotion) {
      pulse.value = withRepeat(
        withTiming(1.15, {
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      );
    }
  }, [reducedMotion, pulse]);

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else if (!isOnboardingCompleted) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(auth)/login');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, isOnboardingCompleted, router]);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
        <View style={styles.iconCircle}>
          <Wind size={44} color={colors.primary} />
        </View>
      </Animated.View>

      <Text style={styles.title}>Respira</Text>
      <Text style={styles.tagline}>Acolhimento e bem-estar para o seu dia</Text>

      <View style={styles.footer}>
        <Text style={styles.disclaimerText}>
          Ferramenta de apoio ao bem-estar • Não substitui cuidados médicos
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    color: '#DDEFE9',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 36,
    paddingHorizontal: 24,
  },
  disclaimerText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
  },
});
