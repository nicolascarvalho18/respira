export interface Soundscape {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: 'nature' | 'relax' | 'noise';
  icon: 'cloud-rain' | 'waves' | 'trees' | 'flame' | 'radio' | 'wind';
  accentColor: string;
  bgGradient: [string, string];
  audioUrl: string;
  generatorType: 'rain' | 'waves' | 'forest' | 'fire' | 'white_noise' | 'brown_noise';
}

export const SOUNDSCAPES: Soundscape[] = [
  {
    id: 'soundscape-rain',
    name: 'Chuva suave',
    subtitle: 'Gotas calmas em folhas',
    description: 'Som contínuo e reconfortante de chuva mansa para relaxar o corpo e induzir o sono.',
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
    description: 'Ondas serenas quebrando suavemente na praia para acalmar pensamentos agitados.',
    category: 'nature',
    icon: 'waves',
    accentColor: '#2C648E',
    bgGradient: ['#E3EEF8', '#C9DFEF'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=ocean-waves-ambient-8167.mp3',
    generatorType: 'waves',
  },
  {
    id: 'soundscape-forest',
    name: 'Floresta e vento',
    subtitle: 'Brisa e árvores suaves',
    description: 'Vento soprando entre as copas das árvores com pássaros distantes e tranquilidade.',
    category: 'nature',
    icon: 'trees',
    accentColor: '#4A7A3E',
    bgGradient: ['#E9F2E6', '#CFE5C9'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c3c3a9926e.mp3?filename=forest-wind-birds-10925.mp3',
    generatorType: 'forest',
  },
  {
    id: 'soundscape-fire',
    name: 'Fogueira',
    subtitle: 'Crepitação acolhedora',
    description: 'Calor e estalos suaves de lenha queimando para momentos de leitura ou descanso.',
    category: 'relax',
    icon: 'flame',
    accentColor: '#D98968',
    bgGradient: ['#FDECE5', '#F8D4C5'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_65cf11f8b4.mp3?filename=fireplace-crackling-ambient-8321.mp3',
    generatorType: 'fire',
  },
  {
    id: 'soundscape-white-noise',
    name: 'Ruído branco',
    subtitle: 'Frequência constante e uniforme',
    description: 'Som estático balanceado que bloqueia distrações externas e favorece o foco.',
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
    description: 'Frequências baixas e densas semelhantes a uma cascata distante, ideal para desacelerar.',
    category: 'noise',
    icon: 'wind',
    accentColor: '#C87A24',
    bgGradient: ['#FBF1E6', '#F5DFCA'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_7314227f2c.mp3?filename=brown-noise-deep-sleep-2345.mp3',
    generatorType: 'brown_noise',
  },
];
