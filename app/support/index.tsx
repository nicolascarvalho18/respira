import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Phone, HeartHandshake, ShieldAlert, Compass, ExternalLink } from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { ConfirmationModal } from '../../src/components/ui/ConfirmationModal';
import { AppButton } from '../../src/components/ui/AppButton';
import { HELPLINES_BY_COUNTRY } from '../../src/constants/helplines';
import { useTheme } from '../../src/hooks/useTheme';
import { TrustedContactSection } from '../../src/components/emergency/TrustedContactSection';
import { useToast } from '../../src/components/ui/Toast';

export default function SupportScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  const [selectedServiceToCall, setSelectedServiceToCall] = useState<{
    name: string;
    number: string;
  } | null>(null);

  const countryData = HELPLINES_BY_COUNTRY.BR;

  const handleAction = (service: { name: string; number: string }) => {
    if (service.number.startsWith('http')) {
      Linking.openURL(service.number).catch(() => {
        showToast({ message: 'Não foi possível abrir este canal no momento.', type: 'error' });
      });
    } else {
      setSelectedServiceToCall(service);
    }
  };

  const handleDialConfirm = () => {
    if (!selectedServiceToCall) return;
    Linking.openURL(`tel:${selectedServiceToCall.number}`).catch(() => {
      showToast({ message: 'Não foi possível abrir o discador.', type: 'error' });
    });
    setSelectedServiceToCall(null);
  };

  return (
    <ScreenContainer scrollable>
      <AppHeader showBack title="Apoio Imediato" />

      {/* Alerta Institucional de Não Emergência */}
      <View
        style={[
          styles.alertBanner,
          {
            backgroundColor: isDark ? '#3D201A' : '#FFF1EB',
            borderColor: colors.error,
          },
        ]}
      >
        <ShieldAlert size={22} color={colors.error} style={{ marginRight: 10, marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.alertTitle, { color: colors.error }]}>
            O Respira não é um serviço de emergência
          </Text>
          <Text style={[styles.alertBody, { color: isDark ? '#F0D0C8' : '#733722' }]}>
            Se você estiver em risco iminente ou vivenciando sofrimento intenso, entre em contato
            com os canais de apoio gratuito abaixo ou procure uma pessoa de sua confiança.
          </Text>
        </View>
      </View>

      {/* Seção 1: Contato de Confiança */}
      <TrustedContactSection />

      {/* Seção 2: Canal Principal de Apoio (CVV 188) */}
      <View
        style={[
          styles.primaryCard,
          {
            backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
            borderColor: colors.primary,
          },
        ]}
      >
        <View style={[styles.primaryBadge, { backgroundColor: colors.highlight }]}>
          <HeartHandshake size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.primaryBadgeText, { color: colors.primaryDark }]}>
            Apoio Emocional Gratuito
          </Text>
        </View>

        <Text style={[styles.serviceName, { color: colors.text }]}>
          {countryData.primaryService.name}
        </Text>
        <Text style={[styles.serviceDesc, { color: colors.textSecondary }]}>
          {countryData.primaryService.description}
        </Text>
        <Text style={[styles.serviceHours, { color: colors.primary }]}>
          Disponibilidade: {countryData.primaryService.availableHours}
        </Text>

        <AppButton
          title={`Ligar para ${countryData.primaryService.number}`}
          leftIcon={<Phone size={18} color="#FFFFFF" />}
          onPress={() =>
            handleAction({
              name: countryData.primaryService.name,
              number: countryData.primaryService.number,
            })
          }
          size="lg"
          style={{ marginTop: 16 }}
        />
      </View>

      {/* Seção 3: Outros Serviços Oficiais do Brasil */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Outros Contatos e Serviços Públicos do Brasil
        </Text>

        {countryData.secondaryServices.map((service, index) => {
          const isLink = service.number.startsWith('http');

          return (
            <View
              key={index}
              style={[
                styles.secondaryCard,
                {
                  backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[styles.secName, { color: colors.text }]}>{service.name}</Text>
                <Text style={[styles.secDesc, { color: colors.textSecondary }]}>{service.description}</Text>
              </View>

              <TouchableOpacity
                onPress={() => handleAction(service)}
                accessibilityRole="button"
                accessibilityLabel={`${isLink ? 'Abrir' : 'Ligar para'} ${service.name}`}
                style={[
                  styles.callSmallBtn,
                  {
                    backgroundColor: isLink ? colors.surfaceSecondary : colors.highlight,
                    borderColor: isLink ? colors.secondary : colors.primary,
                  },
                ]}
              >
                {isLink ? (
                  <ExternalLink size={15} color={colors.secondaryDark} />
                ) : (
                  <Phone size={15} color={colors.primary} />
                )}
                <Text
                  style={[
                    styles.callSmallText,
                    { color: isLink ? colors.secondaryDark : colors.primary },
                  ]}
                >
                  {isLink ? 'Abrir' : service.number}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Seção 4: Exercício Rápido de Aterramento Sensorial (5-4-3-2-1) */}
      <View
        style={[
          styles.groundingCard,
          {
            backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.groundingHeader}>
          <Compass size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.groundingTitle, { color: colors.text }]}>
            Técnica de Aterramento Sensorial (5-4-3-2-1)
          </Text>
        </View>

        <Text style={[styles.groundingDesc, { color: colors.textSecondary }]}>
          Se você estiver com a mente acelerada, experimente focar no ambiente ao seu redor:
        </Text>

        <View style={styles.stepsList}>
          <Text style={[styles.stepItem, { color: colors.text }]}>
            👀 <Text style={{ fontWeight: '700' }}>5 coisas</Text> que você pode ver agora
          </Text>
          <Text style={[styles.stepItem, { color: colors.text }]}>
            ✋ <Text style={{ fontWeight: '700' }}>4 coisas</Text> que você pode tocar
          </Text>
          <Text style={[styles.stepItem, { color: colors.text }]}>
            👂 <Text style={{ fontWeight: '700' }}>3 sons</Text> que você pode ouvir
          </Text>
          <Text style={[styles.stepItem, { color: colors.text }]}>
            👃 <Text style={{ fontWeight: '700' }}>2 cheiros</Text> que você pode notar
          </Text>
          <Text style={[styles.stepItem, { color: colors.text }]}>
            🌱 <Text style={{ fontWeight: '700' }}>1 palavra</Text> de gentileza consigo mesmo(a)
          </Text>
        </View>
      </View>

      {/* Modal de Confirmação antes de Efetuar Ligação Telefônica */}
      <ConfirmationModal
        visible={!!selectedServiceToCall}
        title="Confirmar Ligação"
        message={`Deseja abrir o discador para ligar para ${selectedServiceToCall?.name} (${selectedServiceToCall?.number})?`}
        confirmTitle="Ligar Agora"
        cancelTitle="Cancelar"
        onConfirm={handleDialConfirm}
        onCancel={() => setSelectedServiceToCall(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginVertical: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  alertBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  primaryCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    marginVertical: 14,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  serviceDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  serviceHours: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  secondaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  secName: {
    fontSize: 14,
    fontWeight: '700',
  },
  secDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  callSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  callSmallText: {
    fontSize: 13,
    fontWeight: '700',
  },
  groundingCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginVertical: 14,
    marginBottom: 32,
  },
  groundingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  groundingTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  groundingDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  stepsList: {
    gap: 8,
  },
  stepItem: {
    fontSize: 14,
    lineHeight: 20,
  },
});
