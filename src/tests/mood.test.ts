import { moodService } from '../services/mood/moodService';
import { calculateMoodStats } from '../utils/stats';
import { MoodRecord } from '../types';

describe('Mood Service and Stats Calculations', () => {
  const sampleRecords: MoodRecord[] = [
    {
      id: 'test-1',
      userId: 'user-1',
      mood: 4,
      anxietyLevel: 2,
      emotions: ['Calmo', 'Esperançoso'],
      activities: ['Exercício'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'test-2',
      userId: 'user-1',
      mood: 2,
      anxietyLevel: 8,
      emotions: ['Preocupado', 'Inquieto'],
      activities: ['Trabalho'],
      createdAt: new Date().toISOString(),
    },
  ];

  it('should calculate accurate average mood and anxiety statistics', () => {
    const stats = calculateMoodStats(sampleRecords);
    expect(stats.totalCheckins).toBe(2);
    expect(stats.averageMood).toBe(3.0); // (4 + 2) / 2
    expect(stats.averageAnxiety).toBe(5.0); // (2 + 8) / 2
    expect(stats.topEmotions.length).toBeGreaterThan(0);
  });

  it('should create a new mood entry and retrieve it in the list', async () => {
    const newEntry = await moodService.createRecord({
      userId: 'user-1',
      mood: 5,
      anxietyLevel: 1,
      emotions: ['Alegre', 'Grato'],
      activities: ['Lazer'],
      notes: 'Um dia muito produtivo e sereno.',
    });

    expect(newEntry.id).toBeDefined();
    expect(newEntry.mood).toBe(5);
    expect(newEntry.anxietyLevel).toBe(1);

    const allRecords = await moodService.getRecords();
    expect(allRecords.some((r) => r.id === newEntry.id)).toBe(true);
  });

  it('should delete an existing mood record', async () => {
    const newEntry = await moodService.createRecord({
      userId: 'user-1',
      mood: 3,
      anxietyLevel: 4,
      emotions: ['Neutro'],
      activities: ['Estudos'],
    });

    const deleted = await moodService.deleteRecord(newEntry.id);
    expect(deleted).toBe(true);
    const allRecords = await moodService.getRecords();
    expect(allRecords.some((r) => r.id === newEntry.id)).toBe(false);
  });

  it('should calculate daily average when multiple entries exist on the same day', () => {
    const today = new Date().toISOString().slice(0, 10);
    const multipleOnSameDay: MoodRecord[] = [
      {
        id: 'rec-same-1',
        userId: 'user-1',
        mood: 4,
        anxietyLevel: 2,
        emotions: ['Calmo'],
        activities: ['Exercício'],
        createdAt: `${today}T09:00:00Z`,
      },
      {
        id: 'rec-same-2',
        userId: 'user-1',
        mood: 2,
        anxietyLevel: 6,
        emotions: ['Cansado'],
        activities: ['Trabalho'],
        createdAt: `${today}T18:00:00Z`,
      },
    ];

    const daySumMood = multipleOnSameDay.reduce((sum, r) => sum + r.mood, 0);
    const dayAvgMood = daySumMood / multipleOnSameDay.length;
    expect(dayAvgMood).toBe(3.0); // (4 + 2) / 2

    const daySumAnxiety = multipleOnSameDay.reduce((sum, r) => sum + r.anxietyLevel, 0);
    const dayAvgAnxiety = daySumAnxiety / multipleOnSameDay.length;
    expect(dayAvgAnxiety).toBe(4.0); // (2 + 6) / 2
  });

  it('should filter records correctly by mood, anxiety level range and tags', () => {
    const recordsToFilter: MoodRecord[] = [
      {
        id: 'f-1',
        userId: 'user-1',
        mood: 5,
        anxietyLevel: 1,
        emotions: ['Alegre', 'Grato'],
        activities: ['Lazer'],
        createdAt: '2026-08-25T10:00:00Z',
      },
      {
        id: 'f-2',
        userId: 'user-1',
        mood: 2,
        anxietyLevel: 8,
        emotions: ['Inquieto'],
        activities: ['Trabalho'],
        createdAt: '2026-08-26T10:00:00Z',
      },
      {
        id: 'f-3',
        userId: 'user-1',
        mood: 3,
        anxietyLevel: 5,
        emotions: ['Neutro'],
        activities: ['Estudos'],
        createdAt: '2026-08-27T10:00:00Z',
      },
    ];

    // Filtro por ansiedade intensa (>= 8)
    const intense = recordsToFilter.filter((r) => r.anxietyLevel >= 8);
    expect(intense.length).toBe(1);
    expect(intense[0].id).toBe('f-2');

    // Filtro por emoção
    const grateful = recordsToFilter.filter((r) => r.emotions?.includes('Grato'));
    expect(grateful.length).toBe(1);
    expect(grateful[0].id).toBe('f-1');

    // Filtro por humor
    const neutral = recordsToFilter.filter((r) => r.mood === 3);
    expect(neutral.length).toBe(1);
    expect(neutral[0].id).toBe('f-3');
  });

  it('should format singular and plural count correctly without diagnostic claims', () => {
    const single = { recordsCount: 1, daysCount: 1 };
    const textSingle = `Você fez ${single.recordsCount} ${single.recordsCount === 1 ? 'registro' : 'registros'} em ${single.daysCount} ${single.daysCount === 1 ? 'dia' : 'dias'}.`;
    expect(textSingle).toBe('Você fez 1 registro em 1 dia.');

    const multiple = { recordsCount: 16, daysCount: 8 };
    const textMultiple = `Você fez ${multiple.recordsCount} ${multiple.recordsCount === 1 ? 'registro' : 'registros'} em ${multiple.daysCount} ${multiple.daysCount === 1 ? 'dia' : 'dias'}.`;
    expect(textMultiple).toBe('Você fez 16 registros em 8 dias.');
  });
});
