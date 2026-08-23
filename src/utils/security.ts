/**
 * Security & LGPD Utilities
 * - Password strength validation (min 10 chars, blacklist checking)
 * - Input sanitization & XSS protection
 * - IP masking
 */

const COMMON_PASSWORDS_BLACKLIST = [
  '123456',
  '12345678',
  '123456789',
  '1234567890',
  'password',
  'senha123',
  'mudar123',
  'admin123',
  'brasil2024',
  'respira123',
  'qwerty1234',
  '11111111',
  '00000000',
];

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 4
  errors: string[];
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  if (!password || password.length < 10) {
    errors.push('A senha deve ter pelo menos 10 caracteres.');
  } else {
    score += 1;
  }

  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS_BLACKLIST.some((common) => lower.includes(common))) {
    errors.push('Esta senha é muito comum ou fácil de adivinhar.');
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 1;
  } else {
    errors.push('Inclua letras maiúsculas e minúsculas.');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    errors.push('Inclua pelo menos um número.');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  }

  return {
    isValid: errors.length === 0 && score >= 3,
    score: Math.min(4, score),
    errors,
  };
}

export function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function maskIpAddress(ip: string): string {
  if (!ip) return '0.0.0.0';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  return '***.***.***.***';
}
