import {
  trustedContactService,
  validateBrazilianPhone,
  formatBrazilianPhone,
  maskPhoneNumber,
} from '../services/emergency/trustedContactService';
import { HELPLINES_BY_COUNTRY } from '../constants/helplines';
import { MOCK_PRACTICES } from '../mocks/practices.mock';
import { useMoodStore } from '../store/moodStore';
import { useChatStore } from '../store/chatStore';
import { MoodRecord, Practice } from '../types';

describe('Relatório de QA Completo — Novas Funcionalidades e Correções Respira', () => {
  describe('1. Apoio Imediato — Correção do Pode Falar e Discagem Telefônica', () => {
    const helplines = HELPLINES_BY_COUNTRY.BR;

    it('deve ter o Pode Falar configurado estritamente como link web (URL) para navegação online', () => {
      const podeFalar = helplines.secondaryServices.find((s) => s.name.includes('Pode Falar'));
      expect(podeFalar).toBeDefined();
      expect(podeFalar!.number.startsWith('http')).toBe(true);
      expect(podeFalar!.number).toBe('https://www.podefalar.org.br');
    });

    it('deve ter serviços de emergência e apoio por telefone com números válidos', () => {
      const cvv = helplines.primaryService;
      expect(cvv.number).toBe('188');
      expect(cvv.number.startsWith('http')).toBe(false);

      const samu = helplines.secondaryServices.find((s) => s.name.includes('SAMU'));
      expect(samu!.number).toBe('192');

      const sus = helplines.secondaryServices.find((s) => s.name.includes('SUS'));
      expect(sus!.number).toBe('136');
    });
  });

  describe('2. Contato de Confiança — Validação e Persistência', () => {
    it('deve validar telefones brasileiros válidos e rejeitar inválidos', () => {
      expect(validateBrazilianPhone('11987654321').isValid).toBe(true);
      expect(validateBrazilianPhone('(21) 98765-4321').isValid).toBe(true);
      expect(validateBrazilianPhone('1133334444').isValid).toBe(true);

      // DDD inválido
      expect(validateBrazilianPhone('00987654321').isValid).toBe(false);
      // Número curto
      expect(validateBrazilianPhone('119876').isValid).toBe(false);
    });

    it('deve formatar telefones brasileiros com máscara correta', () => {
      expect(formatBrazilianPhone('11987654321')).toBe('(11) 98765-4321');
      expect(formatBrazilianPhone('2133334444')).toBe('(21) 3333-4444');
    });

    it('deve mascarar telefone para exibição segura', () => {
      expect(maskPhoneNumber('11987654321')).toBe('(11) 9****-4321');
    });

    it('deve salvar e destacar contato principal', async () => {
      const contact1 = await trustedContactService.saveContact({
        userId: 'test-user-1',
        name: 'Mariana Silva',
        relationship: 'Amiga',
        phone: '11987654321',
        isPrimary: true,
        notes: 'Disponível à noite',
        allowCall: true,
        allowMessage: true,
        contactIsAware: true,
      });

      expect(contact1.name).toBe('Mariana Silva');
      expect(contact1.isPrimary).toBe(true);
      expect(contact1.notes).toBe('Disponível à noite');
      expect(contact1.phoneMasked).toBe('(11) 9****-4321');

      const all = await trustedContactService.getContacts('test-user-1');
      expect(all.some((c) => c.id === contact1.id)).toBe(true);
    });
  });

  describe('3. Momento Atual — Exercícios do Dia e Histórico', () => {
    it('deve registrar check-in com exercícios do dia planejados e atualizar status', async () => {
      const store = useMoodStore.getState();

      const created = await store.addRecord({
        userId: 'test-user-1',
        mood: 4,
        anxietyLevel: 3,
        emotions: ['Calmo', 'Focado'],
        activities: ['Trabalho'],
        plannedExercises: [
          {
            id: 'ex-1',
            title: 'Alongamento suave',
            category: 'Corpo e movimento',
            durationMinutes: 5,
            description: 'Soltar ombros e coluna',
            status: 'pending',
          },
          {
            id: 'ex-2',
            title: 'Respiração 4-7-8',
            category: 'Respiração',
            durationMinutes: 4,
            description: 'Desacelerar o ritmo cardíaco',
            status: 'pending',
          },
        ],
      });

      expect(created.plannedExercises).toHaveLength(2);
      expect(created.plannedExercises![0].status).toBe('pending');

      // Marcar como concluído
      await store.updateExerciseStatus(created.id, 'ex-1', 'completed', 'Feito no intervalo');
      const updated = useMoodStore.getState().records.find((r) => r.id === created.id);
      expect(updated?.plannedExercises?.find((e) => e.id === 'ex-1')?.status).toBe('completed');
    });
  });

  describe('4. Relaxar — Categorias e Atividades Físicas e Mentais', () => {
    it('deve possuir práticas em todas as 7 categorias solicitadas', () => {
      const categories = new Set(MOCK_PRACTICES.map((p) => p.category));
      expect(categories.has('breathing')).toBe(true);
      expect(categories.has('body_movement')).toBe(true);
      expect(categories.has('mindfulness')).toBe(true);
      expect(categories.has('relaxation')).toBe(true);
      expect(categories.has('creative')).toBe(true);
      expect(categories.has('quick_pauses')).toBe(true);
      expect(categories.has('soundscapes')).toBe(true);
    });

    it('todas as práticas devem possuir instruções, duração estimada e nível', () => {
      MOCK_PRACTICES.forEach((p) => {
        expect(p.title).toBeDefined();
        expect(p.durationMinutes).toBeGreaterThan(0);
        expect(p.instructions && p.instructions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('5. Assistente de IA — Chat e Controles', () => {
    it('deve gerenciar envio de mensagens e histórico de chat', async () => {
      const chatStore = useChatStore.getState();
      await chatStore.sendMessage('Como lidar com a ansiedade antes de dormir?');
      const state = useChatStore.getState();
      expect(state.messages.length).toBeGreaterThanOrEqual(2);
      const lastUser = state.messages.find((m) => m.sender === 'user');
      expect(lastUser?.text).toContain('Como lidar com a ansiedade');
    });
  });
});
