import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Phone,
  Ambulance,
  CirclePlus,
  MessageCircle,
  Building2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { ConfirmationModal } from '../../src/components/ui/ConfirmationModal';
import { HELPLINES_BY_COUNTRY } from '../../src/constants/helplines';
import { useTheme } from '../../src/hooks/useTheme';
import { TrustedContactSection } from '../../src/components/emergency/TrustedContactSection';
import { useToast } from '../../src/components/ui/Toast';

export default function SupportScreen() {
  const router = useRouter();
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

  // Mapeamento visual para serviços públicos com cores sóbrias
  const getServiceConfig = (index: number) => {
    switch (index) {
      case 0:
        return {
          icon: Ambulance,
          iconColor: '#E64A2E',
          btnType: 'call' as const,
          btnLabel: 'Ligar 192',
          btnColor: '#E64A2E',
          btnBorder: '#F4A58A',
          btnBg: '#FFF7F5',
        };
      case 1:
        return {
          icon: CirclePlus,
          iconColor: '#E64A2E',
          btnType: 'call' as const,
          btnLabel: 'Ligar 136',
          btnColor: '#E64A2E',
          btnBorder: '#F4A58A',
          btnBg: '#FFF7F5',
        };
      case 2:
        return {
          icon: MessageCircle,
          iconColor: '#147D78',
          btnType: 'web' as const,
          btnLabel: 'Acessar',
          btnColor: '#147D78',
          btnBorder: '#147D78',
          btnBg: '#E7F3EF',
        };
      case 3:
      default:
        return {
          icon: Building2,
          iconColor: '#147D78',
          btnType: 'web' as const,
          btnLabel: 'Consultar',
          btnColor: '#147D78',
          btnBorder: '#147D78',
          btnBg: '#E7F3EF',
        };
    }
  };

  return (
    <ScreenContainer scrollable style={styles.screenContainer}>
      {/* 1. Cabeçalho com Seta ArrowLeft e Título */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a tela anterior"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color={isDark ? colors.text : '#44514F'} strokeWidth={1.75} />
        </TouchableOpacity>
        <Text
          accessibilityRole="header"
          aria-level={1}
          style={[styles.headerTitle, { color: isDark ? colors.text : '#123F3A' }]}
        >
          Apoio imediato
        </Text>
      </View>

      {/* 2. Aviso Compacto com Fundo Coral Claro e Barra Lateral */}
      <View
        style={[
          styles.alertCard,
          {
            backgroundColor: isDark ? '#261C19' : '#FFF7F5',
            borderColor: isDark ? '#4A2A22' : '#F6B7A5',
          },
        ]}
      >
        <View style={styles.alertAccentBar} />
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>
            Aviso importante
          </Text>
          <Text style={[styles.alertBody, { color: isDark ? '#F5DDD6' : '#733722' }]}>
            O Respira não substitui atendimento médico ou de emergência. Em situações de perigo urgente, ligue para o SAMU (192) ou procure o pronto-atendimento mais próximo.
          </Text>
        </View>
      </View>

      {/* 3. Seção Contatos de Confiança */}
      <TrustedContactSection />

      {/* 4. Card Discreto do CVV (Sem badge verde artificial e sem sombras pesadas) */}
      <View
        style={[
          styles.cvvCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#E8EDEA',
          },
        ]}
      >
        <Text
          accessibilityRole="header"
          aria-level={2}
          style={[styles.cvvTitle, { color: isDark ? colors.text : '#123F3A' }]}
        >
          {countryData.primaryService.name}
        </Text>
        <Text style={[styles.cvvDesc, { color: isDark ? colors.textMuted : '#65736F' }]}>
          {countryData.primaryService.description}
        </Text>
        <Text style={styles.cvvHours}>
          {countryData.primaryService.availableHours}
        </Text>

        <TouchableOpacity
          onPress={() =>
            handleAction({
              name: countryData.primaryService.name,
              number: countryData.primaryService.number,
            })
          }
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Ligar para ${countryData.primaryService.number} gratuitamente`}
          style={styles.cvvCallBtn}
        >
          <Phone size={18} color="#FFFFFF" strokeWidth={1.75} aria-hidden={true} />
          <Text style={styles.cvvCallBtnText}>
            Ligar para o {countryData.primaryService.number} (Gratuito)
          </Text>
        </TouchableOpacity>
      </View>

      {/* 5. Seção Outros Serviços Públicos de Saúde */}
      <View style={styles.publicServicesSection}>
        <Text
          accessibilityRole="header"
          aria-level={2}
          style={[styles.sectionTitle, { color: isDark ? colors.text : '#123F3A' }]}
        >
          Outros serviços públicos de saúde
        </Text>

        <View style={styles.servicesListWrap}>
          {countryData.secondaryServices.map((service, index) => {
            const config = getServiceConfig(index);
            const Icon = config.icon;

            return (
              <View
                key={index}
                style={[
                  styles.serviceCard,
                  {
                    backgroundColor: isDark ? colors.surface : '#FFFFFF',
                    borderColor: isDark ? colors.border : '#E8EDEA',
                  },
                ]}
              >
                {/* Ícone à esquerda */}
                <Icon
                  size={22}
                  color={config.iconColor}
                  strokeWidth={1.75}
                  style={styles.serviceIcon}
                  aria-hidden={true}
                />

                {/* Informações centrais */}
                <View style={styles.serviceInfoCol}>
                  <Text
                    accessibilityRole="header"
                    aria-level={3}
                    style={[styles.serviceName, { color: isDark ? colors.text : '#123F3A' }]}
                  >
                    {service.name}
                  </Text>
                  <Text style={[styles.serviceDesc, { color: isDark ? colors.textMuted : '#65736F' }]}>
                    {service.description}
                  </Text>
                </View>

                {/* Botão de Ação à direita */}
                <TouchableOpacity
                  onPress={() => handleAction(service)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`${config.btnType === 'web' ? 'Abrir página de' : 'Ligar para'} ${service.name}`}
                  style={[
                    styles.serviceActionBtn,
                    {
                      borderColor: config.btnBorder,
                      backgroundColor: isDark ? colors.surfaceSecondary : config.btnBg,
                    },
                  ]}
                >
                  {config.btnType === 'call' ? (
                    <Phone size={14} color={config.btnColor} strokeWidth={1.75} aria-hidden={true} />
                  ) : (
                    <ExternalLink size={14} color={config.btnColor} strokeWidth={1.75} aria-hidden={true} />
                  )}
                  <Text style={[styles.serviceActionBtnText, { color: config.btnColor }]}>
                    {config.btnLabel}
                  </Text>
                  <ChevronRight size={14} color={config.btnColor} strokeWidth={1.75} aria-hidden={true} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
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
  screenContainer: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 4,
    gap: 12,
  },
  backBtn: {
    padding: 6,
    marginLeft: -6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  alertCard: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 14,
  },
  alertAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#E64A2E',
  },
  alertContent: {
    padding: 14,
    paddingLeft: 16,
  },
  alertTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#E64A2E',
    marginBottom: 4,
  },
  alertBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  cvvCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  cvvTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  cvvDesc: {
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: 6,
  },
  cvvHours: {
    fontSize: 13,
    fontWeight: '600',
    color: '#147D78',
    marginBottom: 16,
  },
  cvvCallBtn: {
    backgroundColor: '#147D78',
    borderRadius: 10,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cvvCallBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  publicServicesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  servicesListWrap: {
    gap: 10,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  serviceIcon: {
    flexShrink: 0,
    marginTop: 2,
  },
  serviceInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  serviceName: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.1,
    marginBottom: 3,
  },
  serviceDesc: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  serviceActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    flexShrink: 0,
  },
  serviceActionBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
});
