/**
 * Formata uma data ISO para string legível em português.
 */
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/**
 * Formata apenas a hora e minutos.
 */
export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Formata data e hora completos.
 */
export function formatDateTime(isoString: string): string {
  try {
    return `${formatDate(isoString)} às ${formatTime(isoString)}`;
  } catch {
    return isoString;
  }
}

/**
 * Retorna uma saudação acolhedora baseada no horário atual.
 */
export function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  let greeting = 'Olá';

  if (hour >= 5 && hour < 12) {
    greeting = 'Bom dia';
  } else if (hour >= 12 && hour < 18) {
    greeting = 'Boa tarde';
  } else {
    greeting = 'Boa noite';
  }

  const firstName = name ? name.split(' ')[0] : '';
  return firstName ? `${greeting}, ${firstName}` : greeting;
}

/**
 * Retorna texto relativo simples (Hoje, Ontem, ou data).
 */
export function getRelativeDateLabel(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return `Hoje às ${formatTime(isoString)}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return `Ontem às ${formatTime(isoString)}`;

  return formatDateTime(isoString);
}
