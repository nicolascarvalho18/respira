export interface Soundscape {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: 'nature' | 'water' | 'ambient' | 'noise';
  categoryLabel: string;
  icon: 'cloud-rain' | 'waves' | 'trees' | 'flame' | 'radio' | 'wind' | 'droplet' | 'music' | 'feather' | 'sun' | 'book';
  accentColor: string;
  bgGradient: [string, string];
  audioUrl: string;
  thumbnailUrl: string;
  generatorType:
    | 'rain'
    | 'rain_window'
    | 'rain_roof'
    | 'waves'
    | 'stream'
    | 'waterfall'
    | 'forest_dawn'
    | 'forest_night'
    | 'birds'
    | 'fire'
    | 'wind_trees'
    | 'white_noise'
    | 'brown_noise'
    | 'pink_noise'
    | 'fan'
    | 'library';
  isFavorite?: boolean;
}

export const SOUNDSCAPES: Soundscape[] = [
  // 1. Chuva leve
  {
    id: 'soundscape-rain',
    name: 'Chuva leve',
    subtitle: 'Gotas calmas e reconfortantes',
    description: 'Som contínuo e suave de chuva caindo na vegetação para relaxar o corpo e aliviar a mente.',
    category: 'water',
    categoryLabel: 'Água',
    icon: 'cloud-rain',
    accentColor: '#2F7F7C',
    bgGradient: ['#E2F4F2', '#C7EBE6'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_c9769ee80a.mp3?filename=soft-rain-ambient-111154.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=600&q=80',
    generatorType: 'rain',
  },
  // 2. Chuva na janela
  {
    id: 'soundscape-rain-window',
    name: 'Chuva na janela',
    subtitle: 'Gotículas batendo no vidro',
    description: 'Gotas de água tocando o vidro da janela com sensação de acolhimento e proteção dentro de casa.',
    category: 'water',
    categoryLabel: 'Água',
    icon: 'cloud-rain',
    accentColor: '#366B7C',
    bgGradient: ['#E1EFF3', '#C4DFE7'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_247e112d8a.mp3?filename=rain-on-window-10924.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
    generatorType: 'rain_window',
  },
  // 3. Chuva no telhado
  {
    id: 'soundscape-rain-roof',
    name: 'Chuva no telhado',
    subtitle: 'Ritmo compassado e acolhedor',
    description: 'Ressoar contínuo da chuva sobre as telhas, ideal para descanso profundo e indução ao sono.',
    category: 'water',
    categoryLabel: 'Água',
    icon: 'cloud-rain',
    accentColor: '#4A6273',
    bgGradient: ['#E3E8EC', '#C9D4DC'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/18/audio_651296230f.mp3?filename=rain-on-tin-roof-2451.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=600&q=80',
    generatorType: 'rain_roof',
  },
  // 4. Ondas do mar
  {
    id: 'soundscape-waves',
    name: 'Ondas do mar',
    subtitle: 'Fluxo rítmico da maré na praia',
    description: 'Ondas serenas quebrando suavemente na areia para acalmar pensamentos agitados e sincronizar a respiração.',
    category: 'water',
    categoryLabel: 'Água',
    icon: 'waves',
    accentColor: '#2C648E',
    bgGradient: ['#E3EEF8', '#C9DFEF'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=ocean-waves-ambient-8167.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    generatorType: 'waves',
  },
  // 5. Riacho
  {
    id: 'soundscape-stream',
    name: 'Riacho',
    subtitle: 'Água corrente sobre pedras',
    description: 'Fluxo contínuo e fresco de água cristalina passando por pedras, ideal para leitura e presença.',
    category: 'water',
    categoryLabel: 'Água',
    icon: 'droplet',
    accentColor: '#176F69',
    bgGradient: ['#E0F5F2', '#C2ECE7'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_73229b1399.mp3?filename=gentle-stream-14284.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
    generatorType: 'stream',
  },
  // 6. Cachoeira distante
  {
    id: 'soundscape-waterfall',
    name: 'Cachoeira distante',
    subtitle: 'Queda d’água densa e constante',
    description: 'Som envolvente e suave de uma cascata ao longe, mascarando ruídos da cidade com naturalidade.',
    category: 'water',
    categoryLabel: 'Água',
    icon: 'waves',
    accentColor: '#1E6B8A',
    bgGradient: ['#DFEFF6', '#C1DFED'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_511993425a.mp3?filename=distant-waterfall-6789.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=600&q=80',
    generatorType: 'waterfall',
  },
  // 7. Floresta ao amanhecer
  {
    id: 'soundscape-forest-dawn',
    name: 'Floresta ao amanhecer',
    subtitle: 'Brisa e primeiros cantos da manhã',
    description: 'Despertar calmo da natureza com brisa fresca entre as árvores e pequenos pássaros.',
    category: 'nature',
    categoryLabel: 'Natureza',
    icon: 'trees',
    accentColor: '#4A7A3E',
    bgGradient: ['#E9F2E6', '#CFE5C9'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c3c3a9926e.mp3?filename=forest-wind-birds-10925.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80',
    generatorType: 'forest_dawn',
  },
  // 8. Floresta à noite
  {
    id: 'soundscape-forest-night',
    name: 'Floresta à noite',
    subtitle: 'Grilos e tranquilidade noturna',
    description: 'Ambiente noturno da mata com sons suaves de grilos e folhagens para relaxar antes de dormir.',
    category: 'nature',
    categoryLabel: 'Natureza',
    icon: 'trees',
    accentColor: '#2B4A3C',
    bgGradient: ['#E3ECE8', '#C7D9D1'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_65cf11f8b4.mp3?filename=night-forest-crickets-7890.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=600&q=80',
    generatorType: 'forest_night',
  },
  // 9. Pássaros suaves
  {
    id: 'soundscape-birds',
    name: 'Pássaros suaves',
    subtitle: 'Cantos serenos da natureza',
    description: 'Harmonia delicada de pássaros cantando em um jardim tranquilo, proporcionando leveza e bom humor.',
    category: 'nature',
    categoryLabel: 'Natureza',
    icon: 'feather',
    accentColor: '#5B8C5A',
    bgGradient: ['#EDF6EC', '#D4EBD2'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_32b03657b9.mp3?filename=birds-morning-nature-7521.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=600&q=80',
    generatorType: 'birds',
  },
  // 10. Fogueira
  {
    id: 'soundscape-fire',
    name: 'Fogueira',
    subtitle: 'Estalos acolhedores de lenha',
    description: 'Calor e crepitação suave de lenha queimando para momentos de desaceleração e aconchego.',
    category: 'ambient',
    categoryLabel: 'Ambiente',
    icon: 'flame',
    accentColor: '#D98968',
    bgGradient: ['#FDECE5', '#F8D4C5'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_65cf11f8b4.mp3?filename=fireplace-crackling-ambient-8321.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=600&q=80',
    generatorType: 'fire',
  },
  // 11. Vento entre as árvores
  {
    id: 'soundscape-wind-trees',
    name: 'Vento entre as árvores',
    subtitle: 'Sussurro suave da brisa',
    description: 'Ar soprando gentilmente pelas copas das árvores, transmitindo sensação de vastidão e calma.',
    category: 'nature',
    categoryLabel: 'Natureza',
    icon: 'wind',
    accentColor: '#6B8E89',
    bgGradient: ['#EAF2F1', '#D2E3E1'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_511993425a.mp3?filename=soft-wind-breeze-11234.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80',
    generatorType: 'wind_trees',
  },
  // 12. Ruído branco
  {
    id: 'soundscape-white-noise',
    name: 'Ruído branco',
    subtitle: 'Frequência uniforme e balanceada',
    description: 'Som estático contínuo que bloqueia distrações externas e favorece concentração profunda.',
    category: 'noise',
    categoryLabel: 'Ruídos',
    icon: 'radio',
    accentColor: '#634E99',
    bgGradient: ['#EAE6F2', '#D5CDE7'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_993e506699.mp3?filename=white-noise-calm-1234.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    generatorType: 'white_noise',
  },
  // 13. Ruído marrom
  {
    id: 'soundscape-brown-noise',
    name: 'Ruído marrom',
    subtitle: 'Graves profundos e envolventes',
    description: 'Frequências baixas e densas que acalmam a sobrecarga mental e auxiliam no sono profundo.',
    category: 'noise',
    categoryLabel: 'Ruídos',
    icon: 'wind',
    accentColor: '#C87A24',
    bgGradient: ['#FBF1E6', '#F5DFCA'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_7314227f2c.mp3?filename=brown-noise-deep-sleep-2345.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    generatorType: 'brown_noise',
  },
  // 14. Ruído rosa
  {
    id: 'soundscape-pink-noise',
    name: 'Ruído rosa',
    subtitle: 'Equilíbrio suave de agudos e graves',
    description: 'Frequência mais aveludada que o ruído branco, simulando a cadência natural do vento e das folhas.',
    category: 'noise',
    categoryLabel: 'Ruídos',
    icon: 'radio',
    accentColor: '#B85D83',
    bgGradient: ['#FAEDF2', '#F4D8E3'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_993e506699.mp3?filename=pink-noise-soft-5432.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    generatorType: 'pink_noise',
  },
  // 15. Ventilador suave
  {
    id: 'soundscape-fan',
    name: 'Ventilador suave',
    subtitle: 'Zumbido contínuo e mecânico',
    description: 'Giro rítmico e constante de hélice de ventilador no quarto, promovendo sono tranquilo.',
    category: 'ambient',
    categoryLabel: 'Ambiente',
    icon: 'wind',
    accentColor: '#536E7B',
    bgGradient: ['#E6ECEE', '#CDD9DD'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_7240c9f131.mp3?filename=bedroom-fan-sound-9871.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    generatorType: 'fan',
  },
  // 16. Biblioteca silenciosa
  {
    id: 'soundscape-library',
    name: 'Biblioteca silenciosa',
    subtitle: 'Murmúrio distante e virar de páginas',
    description: 'Atmosfera calma de estudo com silêncio acolhedor e sons discretos de páginas e passos suaves.',
    category: 'ambient',
    categoryLabel: 'Ambiente',
    icon: 'book',
    accentColor: '#7A5B44',
    bgGradient: ['#F2EDE8', '#E3D7CD'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/04/27/audio_93818f9cf0.mp3?filename=quiet-library-ambience-4321.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=600&q=80',
    generatorType: 'library',
  },
];
