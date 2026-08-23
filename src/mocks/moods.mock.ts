import { MoodRecord } from '../types';

export const MOCK_MOOD_RECORDS: MoodRecord[] = [
  {
    id: 'mood-1',
    userId: 'user-demo-1',
    mood: 4, // Bem
    anxietyLevel: 3,
    emotions: ['Calmo', 'Focado', 'Esperançoso'],
    activities: ['Trabalho', 'Exercício', 'Leitura'],
    notes: 'Consegui fazer a pausa para respiração no meio da tarde e ajudou muito a focar.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'mood-2',
    userId: 'user-demo-1',
    mood: 2, // Mal
    anxietyLevel: 7,
    emotions: ['Preocupado', 'Inquieto', 'Sobrecarga'],
    activities: ['Trabalho', 'Reuniões'],
    notes: 'Muitos prazos acumulados hoje. Senti o peito um pouco apertado.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
  },
  {
    id: 'mood-3',
    userId: 'user-demo-1',
    mood: 3, // Neutro
    anxietyLevel: 5,
    emotions: ['Pensativo', 'Cansado'],
    activities: ['Estudos', 'Família'],
    notes: 'Dia tranquilo, mas um pouco de cansaço mental no fim da tarde.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
  },
  {
    id: 'mood-4',
    userId: 'user-demo-1',
    mood: 5, // Muito bem
    anxietyLevel: 2,
    emotions: ['Alegre', 'Grato', 'Relaxado'],
    activities: ['Descanso', 'Lazer', 'Caminhada'],
    notes: 'Passeio ao ar livre no parque. Me senti muito presente e renovada.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
  },
  {
    id: 'mood-5',
    userId: 'user-demo-1',
    mood: 3, // Neutro
    anxietyLevel: 4,
    emotions: ['Inseguro', 'Esperançoso'],
    activities: ['Trabalho'],
    notes: 'Início de um novo projeto. Um pouco de frio na barriga, mas estou me organizando.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days ago
  },
  {
    id: 'mood-6',
    userId: 'user-demo-1',
    mood: 4, // Bem
    anxietyLevel: 3,
    emotions: ['Conectado', 'Presente'],
    activities: ['Família', 'Descanso'],
    notes: 'Jantar agradável e conversa leve em família.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
  },
  {
    id: 'mood-7',
    userId: 'user-demo-1',
    mood: 2, // Mal
    anxietyLevel: 8,
    emotions: ['Ansioso', 'Sobrecarga', 'Inquieto'],
    activities: ['Estudos'],
    notes: 'Dificuldade para dormir na noite anterior gerou mais sensibilidade ao estresse.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(), // 6 days ago
  },
];

export const AVAILABLE_EMOTIONS = [
  'Calmo',
  'Esperançoso',
  'Grato',
  'Alegre',
  'Focado',
  'Presente',
  'Relaxado',
  'Conectado',
  'Preocupado',
  'Inquieto',
  'Sobrecarga',
  'Cansado',
  'Triste',
  'Irritado',
  'Inseguro',
  'Frustrado',
];

export const AVAILABLE_ACTIVITIES = [
  'Trabalho',
  'Estudos',
  'Exercício',
  'Descanso',
  'Família',
  'Amigos',
  'Lazer',
  'Caminhada',
  'Alimentação',
  'Leitura',
  'Natureza',
  'Tarefas de Casa',
];
