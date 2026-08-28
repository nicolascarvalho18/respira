import { COLOR_TOKENS, COLORS } from '../constants/theme';
import { HELPLINES_BY_COUNTRY } from '../constants/helplines';
import { trustedContactService, maskPhoneNumber } from '../services/emergency/trustedContactService';
import { MOCK_PRACTICES } from '../mocks/practices.mock';
import fs from 'fs';
import path from 'path';

describe('Relatório QA #1 — Regras, Validações e Persistência', () => {
  describe('1. Paleta de Cores e Tokens de Design', () => {
    it('deve possuir os tokens oficiais do Respira', () => {
      expect(COLOR_TOKENS.primary).toBe('#247B74'); // Verde Petróleo oficial
      expect(COLOR_TOKENS.backgroundLight).toBe('#F7F8F5'); // Fundo Neutro Respira
      expect(COLOR_TOKENS.textPrimaryLight).toBe('#1F2927'); // Texto Escuro
      expect(COLOR_TOKENS.warning).toBe('#D87556'); // Coral Acolhedor
    });

    it('deve ter tokens semânticos completos no tema claro e escuro', () => {
      expect(COLORS.light.primary).toBe('#247B74');
      expect(COLORS.dark.primary).toBeDefined();
      expect(COLORS.dark.background).toBe('#121918');
    });
  });

  describe('2. Canais de Apoio Imediato (Brasil e Links Oficiais)', () => {
    it('deve conter exclusivamente o Brasil como país de suporte', () => {
      const countries = Object.keys(HELPLINES_BY_COUNTRY);
      expect(countries).toEqual(['BR']);
    });

    it('deve ter CVV 188 como serviço primário', () => {
      expect(HELPLINES_BY_COUNTRY.BR.primaryService.number).toBe('188');
    });

    it('deve conter Pode Falar com URL HTTPS e sem prefixo tel:', () => {
      const podeFalar = HELPLINES_BY_COUNTRY.BR.secondaryServices.find((s) =>
        s.name.includes('Pode Falar')
      );
      expect(podeFalar).toBeDefined();
      expect(podeFalar?.number).toMatch(/^https:\/\//);
      expect(podeFalar?.number).not.toContain('tel:');
      expect(podeFalar?.number).toBe('https://www.podefalar.org.br');
    });

    it('deve conter Disque Saúde 136 com descrição informativa de SUS', () => {
      const sus = HELPLINES_BY_COUNTRY.BR.secondaryServices.find((s) => s.number === '136');
      expect(sus).toBeDefined();
      expect(sus?.description).toContain('Ministério da Saúde');
    });
  });

  describe('3. Contato de Confiança (Trusted Contacts)', () => {
    it('deve mascarar o telefone corretamente preservando DDD e últimos 4 dígitos', () => {
      expect(maskPhoneNumber('11987654321')).toBe('(11) 9****-4321');
      expect(maskPhoneNumber('(21) 91234-5678')).toBe('(21) 9****-5678');
      expect(maskPhoneNumber('1133334444')).toBe('(11) ****-4444');
    });

    it('deve salvar, listar e excluir contatos de confiança', async () => {
      const created = await trustedContactService.saveContact({
        userId: 'user-test-qa',
        name: 'Mariana Silva',
        relationship: 'Amigo',
        phone: '11987654321',
        allowCall: true,
        allowMessage: true,
        contactIsAware: true,
      });

      expect(created.id).toBeDefined();
      expect(created.phoneMasked).toBe('(11) 9****-4321');

      const list = await trustedContactService.getContacts('user-test-qa');
      expect(list.some((c) => c.id === created.id)).toBe(true);

      const deleted = await trustedContactService.deleteContact(created.id);
      expect(deleted).toBe(true);

      const listAfter = await trustedContactService.getContacts('user-test-qa');
      expect(listAfter.some((c) => c.id === created.id)).toBe(false);
    });
  });

  describe('4. Seção Relaxar e Exercícios Físicos/Mentais', () => {
    it('deve conter exercícios físicos suaves com aviso de limites e dor', () => {
      const physicals = MOCK_PRACTICES.filter((p) => p.id.startsWith('practice-physical'));
      expect(physicals.length).toBeGreaterThanOrEqual(4);

      // Verify safety disclaimer in instructions
      physicals.forEach((p) => {
        const hasSafetyNotice = p.instructions?.some((inst) =>
          inst.includes('Faça os movimentos suavemente e respeite seus limites')
        );
        expect(hasSafetyNotice).toBe(true);
      });
    });

    it('deve conter exercícios mentais de mindfulness e aterramento', () => {
      const mentals = MOCK_PRACTICES.filter((p) => p.category === 'mindfulness');
      expect(mentals.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('5. Migration SQL de Contatos de Confiança', () => {
    it('deve conter migration 05 com tabela trusted_contacts e RLS', () => {
      const migrationPath = path.join(
        __dirname,
        '../../supabase/migrations/20260823000005_trusted_contacts.sql'
      );
      expect(fs.existsSync(migrationPath)).toBe(true);

      const sql = fs.readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('create table if not exists public.trusted_contacts');
      expect(sql).toContain('alter table public.trusted_contacts enable row level security;');
      expect(sql).toContain('trusted_contacts_select_own');
      expect(sql).toContain('auth.uid() = user_id');
    });
  });
});
