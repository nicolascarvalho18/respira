import { HelplineInfo } from '../types';

export const HELPLINES_BY_COUNTRY: Record<string, HelplineInfo> = {
  BR: {
    countryCode: 'BR',
    countryName: 'Brasil',
    primaryService: {
      name: 'CVV - Centro de Valorização da Vida',
      number: '188',
      description: 'Apoio emocional gratuito, confidencial e disponível 24 horas por telefone e chat.',
      isFree: true,
      availableHours: '24 horas / 7 dias por semana',
    },
    secondaryServices: [
      {
        name: 'SAMU (Emergência Médica)',
        number: '192',
        description: 'Serviço de atendimento móvel de urgência em casos de crise aguda grave.',
      },
      {
        name: 'CAPS (Rede Pública de Saúde Mental)',
        number: '136',
        description: 'Disque Saúde SUS para localizar a unidade CAPS mais próxima.',
      },
      {
        name: 'Pode Falar (UNICEF - Jovens)',
        number: 'https://www.podefalar.org.br',
        description: 'Canal de escuta virtual para adolescentes e jovens de 13 a 24 anos.',
      },
    ],
  },
  US: {
    countryCode: 'US',
    countryName: 'Estados Unidos',
    primaryService: {
      name: '988 Suicide & Crisis Lifeline',
      number: '988',
      description: 'Free, confidential support available 24/7 via call or text.',
      isFree: true,
      availableHours: '24/7',
    },
    secondaryServices: [
      {
        name: 'Emergency Services',
        number: '911',
        description: 'Immediate emergency dispatch.',
      },
      {
        name: 'Crisis Text Line',
        number: '741741',
        description: 'Text HOME to 741741 to connect with a Crisis Counselor.',
      },
    ],
  },
  PT: {
    countryCode: 'PT',
    countryName: 'Portugal',
    primaryService: {
      name: 'Linha SOS Voz Amiga',
      number: '213544545',
      description: 'Apoio emocional confidencial e gratuito.',
      isFree: true,
      availableHours: '16h às 24h',
    },
    secondaryServices: [
      {
        name: 'SNS 24 (Saúde 24)',
        number: '808242424',
        description: 'Triagem e aconselhamento psicológico do Serviço Nacional de Saúde.',
      },
      {
        name: 'Número de Emergência Europeu',
        number: '112',
        description: 'Linha europeia de socorro.',
      },
    ],
  },
};
