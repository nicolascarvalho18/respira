import { validatePasswordStrength, sanitizeText, maskIpAddress } from '../utils/security';
import { aiAssistantService } from '../server/services/aiAssistantService';

describe('Security & LGPD Utilities Tests', () => {
  describe('Password Strength Validator', () => {
    it('rejects passwords shorter than 10 characters', () => {
      const res = validatePasswordStrength('123456');
      expect(res.isValid).toBe(false);
      expect(res.errors).toContain('A senha deve ter pelo menos 10 caracteres.');
    });

    it('rejects common blacklisted passwords', () => {
      const res = validatePasswordStrength('password1234');
      expect(res.isValid).toBe(false);
      expect(res.errors).toContain('Esta senha é muito comum ou fácil de adivinhar.');
    });

    it('approves strong passwords with letters, numbers and symbols', () => {
      const res = validatePasswordStrength('Segura@Forte2024');
      expect(res.isValid).toBe(true);
      expect(res.score).toBeGreaterThanOrEqual(3);
      expect(res.errors.length).toBe(0);
    });
  });

  describe('Input Sanitization & IP Masking', () => {
    it('escapes dangerous HTML characters', () => {
      const raw = '<script>alert("xss")</script>';
      const clean = sanitizeText(raw);
      expect(clean).not.toContain('<script>');
      expect(clean).toContain('&lt;script&gt;');
    });

    it('correctly masks IPv4 addresses for audit logging', () => {
      expect(maskIpAddress('192.168.1.100')).toBe('192.168.***.***');
    });
  });

  describe('AI Assistant PII Scrubbing & Crisis Detection', () => {
    it('removes CPF, email and phone numbers before sending to AI', () => {
      const text = 'Meu CPF é 123.456.789-00, email ana@exemplo.com e tel (11) 98888-7777';
      const scrubbed = aiAssistantService.scrubPII(text);
      expect(scrubbed).not.toContain('123.456.789-00');
      expect(scrubbed).not.toContain('ana@exemplo.com');
      expect(scrubbed).not.toContain('98888-7777');
      expect(scrubbed).toContain('[CPF REMOVIDO]');
      expect(scrubbed).toContain('[E-MAIL REMOVIDO]');
      expect(scrubbed).toContain('[TELEFONE REMOVIDO]');
    });

    it('detects acute crisis and triggers immediate safety protocol', () => {
      expect(aiAssistantService.detectCrisis('não aguento mais viver quero acabar com tudo')).toBe(true);
      expect(aiAssistantService.detectCrisis('como fazer a respiração 4-7-8?')).toBe(false);
    });
  });
});
