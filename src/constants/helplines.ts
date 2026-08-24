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
        description: 'Serviço de atendimento móvel de urgência em casos de risco à vida ou crise física aguda.',
      },
      {
        name: 'Disque Saúde SUS (Orientações de Saúde Mental e CAPS)',
        number: '136',
        description: 'Canal oficial do Ministério da Saúde para informações sobre unidades de atendimento e CAPS.',
      },
      {
        name: 'Pode Falar (UNICEF - Jovens)',
        number: 'https://www.podefalar.org.br',
        description: 'Canal de escuta virtual e acolhimento para adolescentes e jovens de 13 a 24 anos.',
      },
      {
        name: 'Encontrar Unidade CAPS (Ministério da Saúde)',
        number: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-mental/caps',
        description: 'Portal oficial para localização de Centros de Atenção Psicossocial no Brasil.',
      },
    ],
  },
};
