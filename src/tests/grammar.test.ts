import { formatTimesRealized, formatPracticesCompleted, formatCheckinsCount } from '../utils/grammar';

describe('Grammar and Pluralization Tests (PT-BR)', () => {
  it('correctly pluralizes times realized', () => {
    expect(formatTimesRealized(0)).toBe('0 vezes realizadas');
    expect(formatTimesRealized(1)).toBe('1 vez realizada');
    expect(formatTimesRealized(2)).toBe('2 vezes realizadas');
    expect(formatTimesRealized(12)).toBe('12 vezes realizadas');
  });

  it('correctly pluralizes practices completed', () => {
    expect(formatPracticesCompleted(0)).toBe('0 práticas concluídas');
    expect(formatPracticesCompleted(1)).toBe('1 prática concluída');
    expect(formatPracticesCompleted(12)).toBe('12 práticas concluídas');
  });

  it('correctly pluralizes checkins count', () => {
    expect(formatCheckinsCount(1)).toBe('1 registro');
    expect(formatCheckinsCount(5)).toBe('5 registros');
  });
});
