import { HelplineInfo } from '../types';

export const HELPLINES_BY_COUNTRY: Record<string, HelplineInfo> = {
  BR: {
    countryCode: 'BR',
    countryName: 'Brasil',
    primaryService: {
      name: 'CVV — Centro de Valorização da Vida',
      number: '188',
      description: 'Atendimento gratuito e sigiloso para apoio emocional e desabafo por telefone e chat, todos os dias.',
      isFree: true,
      availableHours: '24 horas por dia',
    },
    secondaryServices: [
      {
        name: 'SAMU (Atendimento de Urgência)',
        number: '192',
        description: 'Socorro móvel de emergência para situações graves de saúde ou acidentes.',
      },
      {
        name: 'Disque Saúde SUS',
        number: '136',
        description: 'Canal do Ministério da Saúde para orientações sobre atendimento público, remédios e CAPS.',
      },
      {
        name: 'Pode Falar (UNICEF)',
        number: 'https://www.podefalar.org.br',
        description: 'Espaço de escuta anônima para adolescentes e jovens de 13 a 24 anos pelo WhatsApp.',
      },
      {
        name: 'Centros de Atenção Psicossocial (CAPS)',
        number: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-mental/caps',
        description: 'Localize unidades públicas de saúde mental e acolhimento no Brasil.',
      },
    ],
  },
};

