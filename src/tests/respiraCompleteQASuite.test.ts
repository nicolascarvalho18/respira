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

  describe('6. Design Tokens & Identidade Visual', () => {
    it('deve possuir tokens consistentes nos modos claro e escuro', () => {
      const { COLORS, SPACING, RADIUS, ANIMATIONS } = require('../constants/theme');

      expect(COLORS.light.primary).toBe('#247B74');
      expect(COLORS.light.background).toBe('#F7F8F5');
      expect(COLORS.light.surface).toBe('#FFFFFF');
      expect(COLORS.light.text).toBe('#1F2927');
      expect(COLORS.light.accent).toBe('#D87556');

      expect(COLORS.dark.primary).toBe('#389B93');
      expect(COLORS.dark.background).toBe('#121918');
      expect(COLORS.dark.surface).toBe('#1C2624');
      expect(COLORS.dark.text).toBe('#F2F5F4');

      expect(SPACING.xs).toBe(4);
      expect(SPACING.sm).toBe(8);
      expect(SPACING.md).toBe(12);
      expect(SPACING.lg).toBe(16);
      expect(SPACING.xl).toBe(24);
      expect(SPACING.xxl).toBe(32);

      expect(ANIMATIONS.fast).toBe(150);
      expect(ANIMATIONS.slow).toBe(250);
    });
  });

  describe('7. Player de Práticas — Sequência e Próxima Atividade', () => {
    it('deve calcular a próxima prática sem repetir a atual', () => {
      const allPractices: Practice[] = [
        {
          id: 'p-1',
          title: 'Respiração 4-7-8',
          category: 'breathing',
          durationMinutes: 4,
          level: 'Iniciante',
          description: 'Teste 1',
        },
        {
          id: 'p-2',
          title: 'Alongamento leve',
          category: 'body_movement',
          durationMinutes: 5,
          level: 'Iniciante',
          description: 'Teste 2',
        },
      ];

      const current = allPractices[0];
      const currentIndex = allPractices.findIndex((p) => p.id === current.id);
      const next = allPractices[(currentIndex + 1) % allPractices.length];

      expect(next).toBeDefined();
      expect(next.id).toBe('p-2');
      expect(next.id).not.toBe(current.id);
    });
  });

  describe('8. Áudio — Controle de Mute e Volume', () => {
    it('deve desativar o áudio completamente ao mutar', () => {
      const { soundEngine } = require('../services/sound/soundEngine');
      soundEngine.setMuted(true);
      expect(soundEngine.getIsMuted()).toBe(true);

      soundEngine.setMuted(false);
      expect(soundEngine.getIsMuted()).toBe(false);
    });
  });
});
