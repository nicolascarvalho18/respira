import { ImageSourcePropType } from 'react-native';

export const PRACTICE_IMAGES: Record<string, ImageSourcePropType> = {
  'respiracao-4-7-8': require('../../assets/images/respiracao-4-7-8.jpg'),
  'respiracao-quadrada': require('../../assets/images/respiracao-quadrada.jpg'),
  'coerencia-cardiaca': require('../../assets/images/coerencia-cardiaca.jpg'),
  'pausa-consciente': require('../../assets/images/pausa-consciente.jpg'),
  'ancoragem-momento-presente': require('../../assets/images/ancoragem-momento-presente.jpg'),
  'relaxamento-muscular-progressivo': require('../../assets/images/relaxamento-muscular-progressivo.jpg'),
};

export const PRACTICE_ALT_TEXTS: Record<string, string> = {
  'respiracao-4-7-8': 'Pessoa realizando uma prática de respiração perto de uma janela.',
  'respiracao-quadrada': 'Pessoa seguindo um exercício de respiração quadrada.',
  'coerencia-cardiaca': 'Pessoa respirando calmamente com a mão apoiada no peito.',
  'pausa-consciente': 'Pessoa fazendo uma pequena pausa perto da janela.',
  'ancoragem-momento-presente': 'Pessoa observando e tocando uma árvore durante uma prática de atenção.',
  'relaxamento-muscular-progressivo': 'Pessoa deitada confortavelmente durante uma prática de relaxamento.',
};

export function getPracticeImage(practiceIdOrImageKey: string): ImageSourcePropType {
  if (PRACTICE_IMAGES[practiceIdOrImageKey]) {
    return PRACTICE_IMAGES[practiceIdOrImageKey];
  }

  switch (practiceIdOrImageKey) {
    case 'practice-breathing-478':
      return PRACTICE_IMAGES['respiracao-4-7-8'];
    case 'practice-breathing-box':
      return PRACTICE_IMAGES['respiracao-quadrada'];
    case 'practice-heart-coherence':
      return PRACTICE_IMAGES['coerencia-cardiaca'];
    case 'practice-quick-conscious-pause':
      return PRACTICE_IMAGES['pausa-consciente'];
    case 'practice-mindfulness-grounding':
      return PRACTICE_IMAGES['ancoragem-momento-presente'];
    case 'practice-pmr-relaxation':
    case 'practice-body-relaxation':
      return PRACTICE_IMAGES['relaxamento-muscular-progressivo'];
    case 'practice-breathing-extended-exhale':
    case 'practice-breathing-diaphragmatic':
      return PRACTICE_IMAGES['respiracao-4-7-8'];
    case 'practice-focus-recovery':
      return PRACTICE_IMAGES['pausa-consciente'];
    case 'practice-mindful-walking':
      return PRACTICE_IMAGES['ancoragem-momento-presente'];
    case 'practice-sleep-deceleration':
    case 'practice-bedtime-preparation':
      return PRACTICE_IMAGES['relaxamento-muscular-progressivo'];
    default:
      return PRACTICE_IMAGES['respiracao-4-7-8'];
  }
}

export function getPracticeAltText(practiceIdOrImageKey: string): string {
  if (PRACTICE_ALT_TEXTS[practiceIdOrImageKey]) {
    return PRACTICE_ALT_TEXTS[practiceIdOrImageKey];
  }
  switch (practiceIdOrImageKey) {
    case 'practice-breathing-478':
      return PRACTICE_ALT_TEXTS['respiracao-4-7-8'];
    case 'practice-breathing-box':
      return PRACTICE_ALT_TEXTS['respiracao-quadrada'];
    case 'practice-heart-coherence':
      return PRACTICE_ALT_TEXTS['coerencia-cardiaca'];
    case 'practice-quick-conscious-pause':
      return PRACTICE_ALT_TEXTS['pausa-consciente'];
    case 'practice-mindfulness-grounding':
      return PRACTICE_ALT_TEXTS['ancoragem-momento-presente'];
    case 'practice-pmr-relaxation':
      return PRACTICE_ALT_TEXTS['relaxamento-muscular-progressivo'];
    default:
      return 'Fotografia editorial da prática de autocuidado e respiração.';
  }
}
