import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView, Platform } from 'react-native';
import { Phone, HeartHandshake, ShieldAlert, ExternalLink, PhoneCall, Globe } from 'lucide-react-native';
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

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Apoio Imediato — Respira';
    }
  }, []);

  const [selectedServiceToCall, setSelectedServiceToCall] = useState<{
    name: string;
    number: string;
  } | null>(null);

  const countryData = HELPLINES_BY_COUNTRY.BR;

  const handleAction = (service: { name: string; number: string }) => {
    if (service.number.startsWith('http://') || service.number.startsWith('https://')) {
      Linking.openURL(service.number).catch(() => {
        showToast({
          message: 'Não foi possível abrir este endereço online no momento. Tente novamente mais tarde.',
          type: 'error',
        });
      });
    } else {
      setSelectedServiceToCall(service);
    }
  };

  const handleDialConfirm = () => {
    if (!selectedServiceToCall) return;
    const cleanNumber = selectedServiceToCall.number.replace(/\D/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      showToast({ message: 'Não foi possível abrir o discador de telefone.', type: 'error' });
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
            borderColor: '#F2B5A0',
          },
        ]}
      >
        <ShieldAlert size={22} color="#D98968" style={{ marginRight: 10, marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.alertTitle, { color: '#D98968' }]}>
            O Respira não é um serviço de emergência
          </Text>
          <Text style={[styles.alertBody, { color: isDark ? '#F0D0C8' : '#733722' }]}>
            Se você estiver em risco iminente ou vivenciando sofrimento intenso, entre em contato
            com os canais de apoio gratuito abaixo ou procure uma pessoa de sua confiança.
          </Text>
        </View>
      </View>

      {/* Seção 1: Contatos de Confiança Pessoais */}
      <TrustedContactSection />

      {/* Seção 2: Canal Principal de Apoio (CVV 188) */}
      <View
        style={[
          styles.primaryCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: '#2F7F7C',
          },
        ]}
      >
        <View style={styles.primaryBadge}>
          <HeartHandshake size={15} color="#2F7F7C" style={{ marginRight: 5 }} />
          <Text style={styles.primaryBadgeText}>
            Apoio Emocional Gratuito 24h
          </Text>
        </View>

        <Text style={[styles.serviceName, { color: isDark ? colors.text : '#173D3B' }]}>
          {countryData.primaryService.name}
        </Text>
        <Text style={[styles.serviceDesc, { color: isDark ? colors.textMuted : '#667775' }]}>
          {countryData.primaryService.description}
        </Text>
        <Text style={styles.serviceHours}>
          Disponibilidade: {countryData.primaryService.availableHours}
        </Text>

        <AppButton
          title={`Ligar para ${countryData.primaryService.number} (Gratuito)`}
          leftIcon={<Phone size={18} color="#FFFFFF" />}
          onPress={() =>
            handleAction({
              name: countryData.primaryService.name,
              number: countryData.primaryService.number,
            })
          }
          size="lg"
          style={{ marginTop: 14 }}
        />
      </View>

      {/* Seção 3: Outros Serviços e Canais Públicos do Brasil */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#173D3B' }]}>
          Outros Contatos e Serviços Públicos do Brasil
        </Text>

        {countryData.secondaryServices.map((service, index) => {
          const isWebLink = service.number.startsWith('http');

          return (
            <View
              key={index}
              style={[
                styles.secondaryCard,
                {
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  borderColor: isDark ? colors.border : '#DCE5E2',
                },
              ]}
            >
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.secName, { color: isDark ? colors.text : '#173D3B' }]}>
                  {service.name}
                </Text>
                <Text style={[styles.secDesc, { color: isDark ? colors.textMuted : '#667775' }]}>
                  {service.description}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleAction(service)}
                accessibilityRole="button"
                accessibilityLabel={`${isWebLink ? 'Abrir página de' : 'Ligar para'} ${service.name}`}
                style={[
                  styles.actionSmallBtn,
                  {
                    backgroundColor: isWebLink
                      ? isDark
                        ? colors.surfaceSecondary
                        : '#E7F3EF'
                      : isDark
                      ? colors.surfaceSecondary
                      : '#FFF5F0',
                    borderColor: isWebLink ? '#2F7F7C' : '#D98968',
                  },
                ]}
              >
                {isWebLink ? (
                  <ExternalLink size={14} color="#2F7F7C" />
                ) : (
                  <PhoneCall size={14} color="#D98968" />
                )}
                <Text
                  style={[
                    styles.actionSmallText,
                    { color: isWebLink ? '#2F7F7C' : '#D98968' },
                  ]}
                >
                  {isWebLink ? 'Abrir' : `Ligar (${service.number})`}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Modal de Confirmação para Chamada Telefônica */}
      <ConfirmationModal
        visible={!!selectedServiceToCall}
        title={`Ligar para ${selectedServiceToCall?.name}?`}
        message={`Esta ação abrirá o discador telefônico no número ${selectedServiceToCall?.number}.`}
        confirmTitle="Ligar agora"
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
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  alertBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  primaryCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 20,
    shadowColor: '#2F7F7C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F3EF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2F7F7C',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  serviceHours: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2F7F7C',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  secondaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  secName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  secDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 5,
  },
  actionSmallText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
