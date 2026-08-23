import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Phone, HeartHandshake, ShieldAlert, Compass, ExternalLink, Globe } from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { ConfirmationModal } from '../../src/components/ui/ConfirmationModal';
import { AppButton } from '../../src/components/ui/AppButton';
import { HELPLINES_BY_COUNTRY } from '../../src/constants/helplines';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuth } from '../../src/hooks/useAuth';

export default function SupportScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [selectedCountry, setSelectedCountry] = useState<string>(
    user?.preferences?.countryHelpline || 'BR'
  );
  const [selectedServiceToCall, setSelectedServiceToCall] = useState<{
    name: string;
    number: string;
  } | null>(null);

  const countryData = HELPLINES_BY_COUNTRY[selectedCountry] || HELPLINES_BY_COUNTRY.BR;

  const handleDialConfirm = () => {
    if (!selectedServiceToCall) return;

    if (selectedServiceToCall.number.startsWith('http')) {
      Linking.openURL(selectedServiceToCall.number);
    } else {
      Linking.openURL(`tel:${selectedServiceToCall.number}`);
    }
    setSelectedServiceToCall(null);
  };

  return (
    <ScreenContainer scrollable>
      <AppHeader showBack title="Apoio Imediato e Escuta" />

      {/* Alerta Institucional de Não Emergência */}
      <View
        style={[
          styles.alertBanner,
          {
            backgroundColor: isDark ? '#3A201A' : '#FFF4EE',
            borderColor: colors.warning,
          },
        ]}
      >
        <ShieldAlert size={24} color={colors.warning} style={{ marginRight: 10, marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.alertTitle, { color: colors.warning }]}>
            O Respira não é um serviço de emergência
          </Text>
          <Text style={[styles.alertBody, { color: isDark ? '#F5DDD6' : '#68291A' }]}>
            Se você estiver em risco iminente ou vivenciando sofrimento intenso, entre em contato
            com os canais de apoio gratuito abaixo ou procure uma pessoa de sua confiança.
          </Text>
        </View>
      </View>

      {/* Seletor de País para Linhas de Ajuda */}
      <View style={styles.countrySection}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Globe size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.countryLabel, { color: colors.text }]}>
            Região selecionada para contatos:
          </Text>
        </View>

        <View style={styles.countryButtonsRow}>
          {Object.entries(HELPLINES_BY_COUNTRY).map(([code, info]) => {
            const isSelected = selectedCountry === code;

            return (
              <TouchableOpacity
                key={code}
                onPress={() => setSelectedCountry(code)}
                style={[
                  styles.countryChip,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : isDark
                        ? colors.surfaceSubtle
                        : '#FFFFFF',
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityLabel={`Selecionar país ${info.countryName}`}
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.countryChipText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {info.countryName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Canal Principal de Apoio (Destaque Proeminente) */}
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
        <Text style={[styles.serviceDesc, { color: colors.textMuted }]}>
          {countryData.primaryService.description}
        </Text>
        <Text style={[styles.serviceHours, { color: colors.primary }]}>
          Disponibilidade: {countryData.primaryService.availableHours}
        </Text>

        <AppButton
          title={`Ligar para ${countryData.primaryService.number}`}
          leftIcon={<Phone size={18} color="#FFFFFF" />}
          onPress={() =>
            setSelectedServiceToCall({
              name: countryData.primaryService.name,
              number: countryData.primaryService.number,
            })
          }
          size="lg"
          style={{ marginTop: 16 }}
        />
      </View>

      {/* Outros Serviços e Emergência Médica */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Outros Contatos e Serviços de Saúde
        </Text>

        {countryData.secondaryServices.map((service, index) => (
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
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.secName, { color: colors.text }]}>{service.name}</Text>
              <Text style={[styles.secDesc, { color: colors.textMuted }]}>{service.description}</Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                setSelectedServiceToCall({
                  name: service.name,
                  number: service.number,
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Acessar ${service.name}`}
              style={[styles.callSmallBtn, { backgroundColor: colors.highlight }]}
            >
              {service.number.startsWith('http') ? (
                <ExternalLink size={16} color={colors.primary} />
              ) : (
                <Phone size={16} color={colors.primary} />
              )}
              <Text style={[styles.callSmallText, { color: colors.primary }]}>
                {service.number.startsWith('http') ? 'Abrir' : service.number}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Exercício Rápido de Aterramento Sensorial (Técnica 5-4-3-2-1) */}
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

        <Text style={[styles.groundingDesc, { color: colors.textMuted }]}>
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

      {/* Modal de Confirmação antes de Efetuar Ligação */}
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
    borderRadius: 20,
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
  countrySection: {
    marginVertical: 10,
  },
  countryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  countryButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  countryChipText: {
    fontSize: 12,
  },
  primaryCard: {
    padding: 20,
    borderRadius: 24,
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
    borderRadius: 18,
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
    borderRadius: 12,
    gap: 6,
  },
  callSmallText: {
    fontSize: 13,
    fontWeight: '700',
  },
  groundingCard: {
    padding: 20,
    borderRadius: 24,
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
