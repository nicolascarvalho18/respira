import { practiceService } from '../services/practice/practiceService';

describe('Practices Service and Catalog Tests', () => {
  it('should retrieve all available wellness practices', async () => {
    const practices = await practiceService.getPractices();
    expect(practices.length).toBeGreaterThan(0);
    expect(practices.some((p) => p.category === 'breathing')).toBe(true);
  });

  it('should toggle practice favorite status', async () => {
    const practiceId = 'practice-breathing-478';
    const isFavorite = await practiceService.toggleFavorite(practiceId);
    expect(typeof isFavorite).toBe('boolean');

    const updatedList = await practiceService.getPractices();
    const target = updatedList.find((p) => p.id === practiceId);
    expect(target?.isFavorite).toBe(isFavorite);
  });

  it('should record practice completion and increment completion counter', async () => {
    const practiceId = 'practice-breathing-478';
    const practicesBefore = await practiceService.getPractices();
    const countBefore = practicesBefore.find((p) => p.id === practiceId)?.completedCount || 0;

    await practiceService.recordCompletion(practiceId);

    const practicesAfter = await practiceService.getPractices();
    const countAfter = practicesAfter.find((p) => p.id === practiceId)?.completedCount || 0;

    expect(countAfter).toBe(countBefore + 1);
  });
});
