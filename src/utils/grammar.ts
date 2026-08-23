/**
 * Grammar and pluralization helpers for Brazilian Portuguese
 */

export function formatTimesRealized(count: number): string {
  if (count === 1) {
    return '1 vez realizada';
  }
  return `${count} vezes realizadas`;
}

export function formatPracticesCompleted(count: number): string {
  if (count === 1) {
    return '1 prática concluída';
  }
  return `${count} práticas concluídas`;
}

export function formatCheckinsCount(count: number): string {
  if (count === 1) {
    return '1 registro';
  }
  return `${count} registros`;
}

export function formatReadTime(minutes: number): string {
  return `${minutes} min`;
}
