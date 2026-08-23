import { MoodValue } from '../types';

export function getMoodLabel(mood: MoodValue): string {
  switch (mood) {
    case 1:
      return 'Muito difícil';
    case 2:
      return 'Difícil';
    case 3:
      return 'Neutro / Estável';
    case 4:
      return 'Bem';
    case 5:
      return 'Muito bem';
    default:
      return 'Não informado';
  }
}

export function getMoodColor(mood: MoodValue): string {
  switch (mood) {
    case 1:
      return '#B94A48'; // erro / atenção
    case 2:
      return '#D97757'; // atenção
    case 3:
      return '#66737D'; // neutro
    case 4:
      return '#79B8A4'; // verde suave
    case 5:
      return '#2E6F73'; // petróleo
    default:
      return '#66737D';
  }
}

export function getMoodEmoji(mood: MoodValue): string {
  switch (mood) {
    case 1:
      return '🌧️';
    case 2:
      return '⛅';
    case 3:
      return '🌱';
    case 4:
      return '🌿';
    case 5:
      return '☀️';
    default:
      return '🌱';
  }
}

export function getAnxietyDescription(level: number): string {
  if (level <= 2) return 'Leve / Calmo';
  if (level <= 5) return 'Moderado';
  if (level <= 8) return 'Elevado';
  return 'Muito intenso';
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.com';
  const [user, domain] = email.split('@');
  if (user.length <= 2) {
    return `${user[0]}***@${domain}`;
  }
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}
