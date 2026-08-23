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
});
