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
    | 'thunder'
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
    subtitle: 'Gotas suaves e tranquilas',
    description: 'Som suave e contínuo de chuva caindo na vegetação para relaxar o corpo e aliviar a mente.',
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
    subtitle: 'Gotas batendo no vidro',
    description: 'Gotículas de água tocando o vidro da janela com sensação de acolhimento e proteção dentro de casa.',
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
    subtitle: 'Chuva atingindo telhas',
    description: 'Ressoar contínuo e compassado da chuva sobre as telhas, ideal para descanso profundo e indução ao sono.',
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
    subtitle: 'Ondas chegando naturalmente à praia',
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
    subtitle: 'Água corrente passando sobre pedras',
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
    subtitle: 'Queda-d’água contínua ao longe',
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
  // 7. Floresta
  {
    id: 'soundscape-forest-dawn',
    name: 'Floresta',
    subtitle: 'Folhas, pássaros e ambiente natural',
    description: 'Ambiente natural discreto com brisa fresca entre as árvores, farfalhar de folhas e pequenos pássaros.',
    category: 'nature',
    categoryLabel: 'Natureza',
    icon: 'trees',
    accentColor: '#4A7A3E',
    bgGradient: ['#E9F2E6', '#CFE5C9'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c3c3a9926e.mp3?filename=forest-wind-birds-10925.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80',
    generatorType: 'forest_dawn',
  },
  // 8. Noite na floresta
  {
    id: 'soundscape-forest-night',
    name: 'Noite na floresta',
    subtitle: 'Grilos e sons noturnos suaves',
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
  // 9. Fogueira
  {
    id: 'soundscape-fire',
    name: 'Fogueira',
    subtitle: 'Madeira queimando com pequenos estalos',
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
  // 10. Vento suave
  {
    id: 'soundscape-wind-trees',
    name: 'Vento suave',
    subtitle: 'Corrente de ar leve e constante',
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
  // 11. Tempestade distante
  {
    id: 'soundscape-thunder',
    name: 'Tempestade distante',
    subtitle: 'Chuva forte com trovões distantes',
    description: 'Chuva acolhedora com trovões abafados e lentos no horizonte, sem sobressaltos.',
    category: 'water',
    categoryLabel: 'Água',
    icon: 'cloud-rain',
    accentColor: '#475569',
    bgGradient: ['#E2E8F0', '#CBD5E1'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_145d2f3473.mp3?filename=distant-thunder-storm-8123.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=600&q=80',
    generatorType: 'thunder',
  },
  // 12. Cafeteria
  {
    id: 'soundscape-library',
    name: 'Cafeteria',
    subtitle: 'Ambiente discreto de cafeteria',
    description: 'Ambiente acolhedor e discreto de cafeteria com xícaras sutis e fundo suave, sem conversas compreensíveis.',
    category: 'ambient',
    categoryLabel: 'Ambiente',
    icon: 'book',
    accentColor: '#7A5B44',
    bgGradient: ['#F2EDE8', '#E3D7CD'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/04/27/audio_93818f9cf0.mp3?filename=quiet-cafe-ambience-4321.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    generatorType: 'library',
  },
  // 13. Ventilador
  {
    id: 'soundscape-fan',
    name: 'Ventilador',
    subtitle: 'Ruído contínuo e uniforme de ventilador',
    description: 'Giro rítmico e constante de hélice de ventilador no quarto, promovendo sono tranquilo e foco.',
    category: 'ambient',
    categoryLabel: 'Ambiente',
    icon: 'wind',
    accentColor: '#536E7B',
    bgGradient: ['#E6ECEE', '#CDD9DD'],
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_7240c9f131.mp3?filename=bedroom-fan-sound-9871.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    generatorType: 'fan',
  },
  // 14. Ruído branco
  {
    id: 'soundscape-white-noise',
    name: 'Ruído branco',
    subtitle: 'Frequência uniforme e constante',
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
  // 15. Ruído rosa
  {
    id: 'soundscape-pink-noise',
    name: 'Ruído rosa',
    subtitle: 'Frequência equilibrada e suave',
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
  // 16. Ruído marrom
  {
    id: 'soundscape-brown-noise',
    name: 'Ruído marrom',
    subtitle: 'Frequência grave, profunda e constante',
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
];
