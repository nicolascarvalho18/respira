import { sanitizeMarkdown, parseInlineMarkdown } from '../components/ui/SafeMarkdown';
import { detectDeviceAndBrowser } from '../server/services/userAccountService';
import { correlationInsightsService } from '../services/analytics/correlationInsightsService';
import { MoodRecord, Practice } from '../types';

describe('Suíte Completa de Testes de Qualidade e Acessibilidade (QA-001 a QA-011)', () => {
  // QA-002: Markdown Seguro e Acessível
  describe('QA-002: Safe Markdown Parser & Sanitizer', () => {
    it('deve sanitizar scripts e tags perigosas do texto', () => {
      const dangerous = 'Texto com <script>alert("hack")</script> e <iframe src="evil.com"></iframe> normal.';
      const clean = sanitizeMarkdown(dangerous);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert("hack")');
      expect(clean).not.toContain('<iframe');
    });

    it('deve parsear corretamente tokens em negrito, itálico e links', () => {
      const text = 'Aqui temos **negrito**, *itálico* e um [link](https://exemplo.com).';
      const tokens = parseInlineMarkdown(text);
      expect(tokens).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'bold', text: 'negrito' }),
          expect.objectContaining({ type: 'italic', text: 'itálico' }),
          expect.objectContaining({ type: 'link', text: 'link', url: 'https://exemplo.com' }),
        ])
      );
    });

    it('deve limpar asteriscos isolados no final da linha', () => {
      const text = '*Aviso: Este conteúdo é educativo.*';
      const tokens = parseInlineMarkdown(text);
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens[0].text).not.toContain('**');
    });
  });

  // QA-009: Detecção Conservadora de Dispositivo e Sessão
  describe('QA-009: Detecção Conservadora de Dispositivo e Sessão', () => {
    it('deve retornar valores conservadores padrão quando navigator não estiver disponível', () => {
      const info = detectDeviceAndBrowser();
      expect(info.deviceType).toBeDefined();
      expect(info.browser).toBeDefined();
      expect(info.os).toBeDefined();
      // Não deve conter 'Android / iOS' inventado
      expect(info.os).not.toBe('Android / iOS');
      expect(info.browser).not.toContain('Android / iOS');
    });
  });

  // QA-011: Insights Proporcionais e Responsáveis
  describe('QA-011: Insights Proporcionais aos Dados', () => {
    const practices: Practice[] = [
      {
        id: 'p-1',
        title: 'Respiração Guiada',
        subtitle: 'Sub',
        description: 'Desc',
        category: 'breathing',
        durationMinutes: 5,
        level: 'Iniciante',
        icon: 'wind',
        completedCount: 6,
      },
    ];

    it('deve classificar como dados insuficientes quando houver < 14 registros', () => {
      const records: MoodRecord[] = Array.from({ length: 8 }, (_, i) => ({
        id: `r-${i}`,
        userId: 'u-1',
        mood: 4,
        anxietyLevel: 2,
        emotions: ['Calmo'],
        activities: ['Descanso'],
        createdAt: `2026-08-${(i + 1).toString().padStart(2, '0')}T10:00:00Z`,
      }));

      const insights = correlationInsightsService.calculateInsights(records, practices);
      expect(insights.length).toBe(1);
      expect(insights[0].confidence).toBe('insufficient_data');
      expect(insights[0].description).toContain('Ainda não há dados suficientes para identificar um padrão');
      expect(insights[0].disclaimer).toBeDefined();
    });

    it('deve classificar como observação preliminar com 14-29 registros em dias distintos', () => {
      const records: MoodRecord[] = Array.from({ length: 18 }, (_, i) => ({
        id: `r-${i}`,
        userId: 'u-1',
        mood: 4,
        anxietyLevel: 2,
        emotions: ['Calmo'],
        activities: ['Pausa'],
        createdAt: `2026-08-${(i + 1).toString().padStart(2, '0')}T10:00:00Z`,
      }));

      const insights = correlationInsightsService.calculateInsights(records, practices);
      expect(insights.length).toBeGreaterThan(0);
      expect(insights[0].confidence).toBe('preliminary_observation');
      expect(insights[0].isPreliminary).toBe(true);
      expect(insights[0].distinctDays).toBe(18);
    });

    it('deve classificar como tendência consistente quando houver 30+ registros sem afirmação de causalidade', () => {
      const records: MoodRecord[] = Array.from({ length: 35 }, (_, i) => ({
        id: `r-${i}`,
        userId: 'u-1',
        mood: 4,
        anxietyLevel: 2,
        emotions: ['Calmo'],
        activities: ['Exercício'],
        createdAt: `2026-08-${((i % 28) + 1).toString().padStart(2, '0')}T10:00:00Z`,
      }));

      const insights = correlationInsightsService.calculateInsights(records, practices);
      expect(insights.length).toBeGreaterThan(0);
      expect(insights[0].confidence).toBe('consistent_pattern');
      expect(insights[0].isPreliminary).toBe(false);
      expect(insights[0].description).not.toContain('cura');
      expect(insights[0].description).not.toContain('garantia');
    });
  });
});
