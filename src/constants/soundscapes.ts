export interface Soundscape {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: 'nature' | 'relax' | 'noise' | 'music';
  icon: 'cloud-rain' | 'waves' | 'trees' | 'flame' | 'radio' | 'wind' | 'droplet' | 'music' | 'feather' | 'sun';
  accentColor: string;
  bgGradient: [string, string];
  audioUrl: string;
  generatorType:
    | 'rain'
    | 'waves'
    | 'forest'
    | 'stream'
    | 'fire'
    | 'wind'
    | 'birds'
    | 'white_noise'
    | 'brown_noise'
    | 'piano'
    | 'ambient';
}

export const SOUNDSCAPES: Soundscape[] = [
  {
    id: 'soundscape-rain',
    name: 'Chuva leve',
    subtitle: 'Gotas suaves e reconfortantes',
    description: 'Som contínuo e acolhedor de chuva mansa caindo para relaxar o corpo e induzir o sono.',
    category: 'nature',
    icon: 'cloud-rain',
    accentColor: '#2F7F7C',
    bgGradient: ['#E2F4F2', '#C7EBE6'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_c9769ee80a.mp3?filename=soft-rain-ambient-111154.mp3',
    generatorType: 'rain',
  },
  {
    id: 'soundscape-waves',
    name: 'Ondas do mar',
    subtitle: 'Fluxo rítmico da maré',
    description: 'Ondas serenas quebrando suavemente na areia para acalmar pensamentos acelerados.',
    category: 'nature',
    icon: 'waves',
    accentColor: '#2C648E',
    bgGradient: ['#E3EEF8', '#C9DFEF'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=ocean-waves-ambient-8167.mp3',
    generatorType: 'waves',
  },
  {
    id: 'soundscape-forest',
    name: 'Floresta',
    subtitle: 'Brisa e árvores suaves',
    description: 'Vento soprando entre as copas das árvores com sensação de frescor e tranquilidade.',
    category: 'nature',
    icon: 'trees',
    accentColor: '#4A7A3E',
    bgGradient: ['#E9F2E6', '#CFE5C9'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c3c3a9926e.mp3?filename=forest-wind-birds-10925.mp3',
    generatorType: 'forest',
  },
  {
    id: 'soundscape-stream',
    name: 'Riacho',
    subtitle: 'Água corrente e cristalina',
    description: 'Fluxo contínuo de água sobre pedras para limpar a mente e renovar as energias.',
    category: 'nature',
    icon: 'droplet',
    accentColor: '#176F69',
    bgGradient: ['#E0F5F2', '#C2ECE7'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_73229b1399.mp3?filename=gentle-stream-14284.mp3',
    generatorType: 'stream',
  },
  {
    id: 'soundscape-fire',
    name: 'Fogueira',
    subtitle: 'Crepitação acolhedora',
    description: 'Calor e estalos suaves de lenha queimando para momentos de leitura ou descanso aconchegante.',
    category: 'relax',
    icon: 'flame',
    accentColor: '#D98968',
    bgGradient: ['#FDECE5', '#F8D4C5'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_65cf11f8b4.mp3?filename=fireplace-crackling-ambient-8321.mp3',
    generatorType: 'fire',
  },
  {
    id: 'soundscape-wind',
    name: 'Vento suave',
    subtitle: 'Brisa calma de fim de tarde',
    description: 'Sussurro suave do ar em movimento para desacelerar a respiração e soltar tensões.',
    category: 'relax',
    icon: 'wind',
    accentColor: '#6B8E89',
    bgGradient: ['#EAF2F1', '#D2E3E1'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_511993425a.mp3?filename=soft-wind-breeze-11234.mp3',
    generatorType: 'wind',
  },
  {
    id: 'soundscape-birds',
    name: 'Pássaros',
    subtitle: 'Canto matinal sereno',
    description: 'Cantos suaves de pássaros ao amanhecer para despertar foco e presença tranquila.',
    category: 'nature',
    icon: 'feather',
    accentColor: '#5B8C5A',
    bgGradient: ['#EDF6EC', '#D4EBD2'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_32b03657b9.mp3?filename=birds-morning-nature-7521.mp3',
    generatorType: 'birds',
  },
  {
    id: 'soundscape-white-noise',
    name: 'Ruído branco',
    subtitle: 'Frequência constante e uniforme',
    description: 'Som estático equilibrado que mascara ruídos externos e favorece a concentração profunda.',
    category: 'noise',
    icon: 'radio',
    accentColor: '#634E99',
    bgGradient: ['#EAE6F2', '#D5CDE7'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_993e506699.mp3?filename=white-noise-calm-1234.mp3',
    generatorType: 'white_noise',
  },
  {
    id: 'soundscape-brown-noise',
    name: 'Ruído marrom',
    subtitle: 'Graves profundos e envolventes',
    description: 'Frequências baixas e aveludadas semelhantes a uma cachoeira distante, ideal para desacelerar.',
    category: 'noise',
    icon: 'wind',
    accentColor: '#C87A24',
    bgGradient: ['#FBF1E6', '#F5DFCA'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_7314227f2c.mp3?filename=brown-noise-deep-sleep-2345.mp3',
    generatorType: 'brown_noise',
  },
  {
    id: 'soundscape-piano',
    name: 'Piano instrumental tranquilo',
    subtitle: 'Acordes lentos e harmoniosos',
    description: 'Melodias suaves de piano acústico tocadas em tempo calmo para relaxamento e acolhimento.',
    category: 'music',
    icon: 'music',
    accentColor: '#536B82',
    bgGradient: ['#E7EEF4', '#CBDCE9'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_7240c9f131.mp3?filename=gentle-piano-calm-6893.mp3',
    generatorType: 'piano',
  },
  {
    id: 'soundscape-ambient',
    name: 'Música ambiente suave',
    subtitle: 'Texturas sonoras etéreas',
    description: 'Camadas harmônicas sutis que criam uma atmosfera segura de paz e desaceleração mental.',
    category: 'music',
    icon: 'sun',
    accentColor: '#4A6B69',
    bgGradient: ['#E5EFEB', '#CBE0D8'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/04/27/audio_93818f9cf0.mp3?filename=ambient-pad-serenity-110294.mp3',
    generatorType: 'ambient',
  },
];
