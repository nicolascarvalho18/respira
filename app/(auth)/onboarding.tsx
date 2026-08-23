import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { HeartHandshake, Wind, Sparkles, ArrowRight } from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AppButton } from '../../src/components/ui/AppButton';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/hooks/useTheme';

const SLIDES = [
  {
    id: 1,
    title: 'Entenda como você está',
    subtitle: 'Autoconhecimento diário',
    description:
      'Acompanhe seu humor, nível de ansiedade e emoções sem julgamentos. Um espaço seguro para escutar o seu próprio ritmo.',
    icon: HeartHandshake,
  },
  {
    id: 2,
    title: 'Encontre práticas que combinam com você',
    subtitle: 'Ferramentas de relaxamento',
    description:
      'Exercícios de respiração interativos, relaxamento muscular e meditações breves para momentos de tensão ou desaceleração.',
    icon: Wind,
  },
  {
    id: 3,
    title: 'Construa uma rotina de cuidado',
    subtitle: 'Pequenos passos consistentes',
    description:
      'Conteúdos educativos embasados e lembretes gentis para apoiar seu bem-estar emocional todos os dias.',
    icon: Sparkles,
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();
  const { setOnboardingCompleted } = useAuth();
  const { colors, isDark } = useTheme();

  const handleFinish = async () => {
    await setOnboardingCompleted(true);
    router.replace('/(auth)/login');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const currentSlide = SLIDES[currentIndex];
  const IconComponent = currentSlide.icon;

  return (
    <ScreenContainer scrollable={false}>
      {/* Topo com Pular */}
      <View style={styles.topBar}>
        <View style={styles.logoBadge}>
          <Wind size={16} color={colors.primary} />
          <Text style={[styles.logoText, { color: colors.primary }]}>Respira</Text>
        </View>

        <TouchableOpacity
          onPress={handleFinish}
          accessibilityRole="button"
          accessibilityLabel="Pular apresentação inicial"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.skipText, { color: colors.textMuted }]}>Pular</Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo Central */}
      <View style={styles.content}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark ? colors.surfaceSubtle : colors.highlight,
              borderColor: colors.secondaryLight,
            },
          ]}
        >
          <IconComponent size={64} color={colors.primary} />
        </View>

        <View style={[styles.subtitleBadge, { backgroundColor: colors.highlight }]}>
          <Text style={[styles.subtitleBadgeText, { color: colors.primaryDark }]}>
            {currentSlide.subtitle}
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{currentSlide.title}</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          {currentSlide.description}
        </Text>
      </View>

      {/* Rodapé com Indicador e Botão */}
      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex ? colors.primary : colors.borderStrong,
                  width: index === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <AppButton
          title={currentIndex === SLIDES.length - 1 ? 'Começar agora' : 'Continuar'}
          rightIcon={<ArrowRight size={18} color="#FFFFFF" />}
          onPress={handleNext}
          size="lg"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  subtitleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  subtitleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
