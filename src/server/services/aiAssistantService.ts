/**
 * Respira AI Assistant Service (Backend Architecture)
 * - Rate Limiting
 * - Input Validation & Sanitization
 * - LGPD PII Scrubbing (CPF, Phone, Email)
 * - Clinical Safety Guardrails (Crisis / CVV 188 / SAMU 192)
 * - RAG with Approved Respira Psychoeducation Catalog & Platform Architecture
 * - Multi-provider LLM API Integration (OpenAI-compatible / Anthropic / Gemini)
 */

import { MOCK_ARTICLES } from '../../mocks/contents.mock';
import { MOCK_PRACTICES } from '../../mocks/practices.mock';

export interface AIResponsePayload {
  text: string;
  isEmergencyAlert: boolean;
  suggestions: string[];
  recommendedPracticeId?: string;
  recommendedArticleId?: string;
}

// In-memory sliding window rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20; // 20 requests
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // per 1 minute

export class AIAssistantService {
  /**
   * 1. Rate Limiting Check
   */
  checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const current = rateLimitMap.get(identifier);

    if (!current || now > current.resetAt) {
      rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
    }

    if (current.count >= RATE_LIMIT_MAX) {
      return { allowed: false, remaining: 0 };
    }

    current.count += 1;
    return { allowed: true, remaining: RATE_LIMIT_MAX - current.count };
  }

  /**
   * 2. LGPD PII Scrubbing: Remove Personal Identifiable Information before sending to LLM
   */
  scrubPII(input: string): string {
    return input
      // CPF: 000.000.000-00 or 11 digits
      .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[CPF REMOVIDO]')
      // Email
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[E-MAIL REMOVIDO]')
      // Telefone BR: (11) 98888-8888 or 11988888888
      .replace(/(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}\b/g, '[TELEFONE REMOVIDO]');
  }

  /**
   * 3. Safety Guardrails: Crisis detection
   */
  detectCrisis(input: string): boolean {
    const normalized = input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const crisisTerms = [
      'suicidio',
      'me matar',
      'tirar minha vida',
      'acabar com tudo',
      'nao aguento mais viver',
      'quero morrer',
      'cortar meus pulsos',
      'automutilacao',
      'overdose',
    ];

    return crisisTerms.some((term) => normalized.includes(term));
  }

  /**
   * 4. RAG: Retrieve matching psychoeducation articles and practices
   */
  retrieveContext(input: string) {
    const lower = input.toLowerCase();

    const matchedArticle = MOCK_ARTICLES.find(
      (a) =>
        lower.includes(a.title.toLowerCase()) ||
        (a.keywords && a.keywords.some((k) => lower.includes(k.toLowerCase()))) ||
        lower.includes(a.category.toLowerCase())
    );

    const matchedPractice = MOCK_PRACTICES.find(
      (p) =>
        lower.includes(p.title.toLowerCase()) ||
        lower.includes(p.category) ||
        (p.subtitle && lower.includes(p.subtitle.toLowerCase()))
    );

    return { matchedArticle, matchedPractice };
  }

  /**
   * 5. Generate AI Response
   */
  async generateResponse(
    userMessage: string,
    userId: string,
    history: { sender: 'user' | 'assistant'; text: string }[] = []
  ): Promise<AIResponsePayload> {
    // 1. Rate Limit
    const rate = this.checkRateLimit(userId);
    if (!rate.allowed) {
      return {
        text: 'Você enviou muitas mensagens em pouco tempo. Por favor, aguarde um minuto para continuar nossa conversa.',
        isEmergencyAlert: false,
        suggestions: ['Como fazer uma respiração guiada?', 'Como funciona o aplicativo Respira?'],
      };
    }

    // 2. Validate Message Length
    if (!userMessage || userMessage.trim().length === 0) {
      throw new Error('A mensagem não pode ser vazia.');
    }
    if (userMessage.length > 1000) {
      throw new Error('A mensagem excede o limite máximo de 1000 caracteres.');
    }

    // 3. Detect Emergency Crisis
    if (this.detectCrisis(userMessage)) {
      return {
        text: 'Percebo que você está passando por um momento de sofrimento intenso. Sua vida e seu bem-estar são muito importantes.\n\nPor favor, entre em contato imediatamente com o **CVV (Centro de Valorização da Vida)** pelo telefone gratuito **188** (atendimento 24 horas em todo o Brasil) ou procure o serviço de emergência mais próximo (SAMU **192**).\n\nVocê também pode conversar com alguém de sua confiança agora.',
        isEmergencyAlert: true,
        suggestions: ['Ligar para o CVV (188)', 'Como funciona o apoio do CVV?', 'Fazer uma pausa de respiração calma'],
        recommendedPracticeId: 'practice-breathing-478',
      };
    }

    // 4. Scrub PII
    const safePrompt = this.scrubPII(userMessage);

    // 5. RAG Retrieval
    const { matchedArticle, matchedPractice } = this.retrieveContext(safePrompt);

    // 6. External LLM Provider Call (if configured via ENV)
    const apiKey = process.env.LLM_API_KEY;
    const baseUrl = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.LLM_MODEL || 'gpt-4o-mini';

    if (apiKey && apiKey.trim() !== '') {
      try {
        const systemPrompt = `Você é o Assistente Educativo da plataforma Respira.
Sua missão é fornecer acolhimento, psicoeducação e explicar as ferramentas da plataforma Respira.
A plataforma Respira possui os seguintes módulos oficiais:
1. Momento Atual (Check-in de humor, ansiedade de 0 a 10, emoções e atividade recente).
2. Diário e Histórico (registro diário com gráfico de evolução e observações preliminares estatísticas).
3. Práticas Guiadas (exercícios em vídeo e áudio divididos em respiração, meditação, relaxamento, sono, etc.).
4. Conteúdos (artigos educativos sobre ansiedade, regulação emocional, sono e bem-estar).
5. Favoritos e Progresso (acompanhamento de leitura e atividades favoritas).
6. Assistente de Acolhimento (orientações gerais de bem-estar e navegação).
7. Apoio Imediato (informações sobre CVV 188 e canais de ajuda gratuitos).
8. Perfil & Preferências (controle de tema, lembretes suaves, segurança e sessões).

Regras de conduta:
- Nunca faça diagnósticos clínicos, médicas ou psicológicas.
- Nunca prescreva medicamentos ou altere tratamentos de saúde.
- Nunca faça promessas exageradas de cura.
- Use linguagem clara, acolhedora, humana e serena em Português Brasileiro.`;

        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...history.slice(-6).map((h) => ({
                role: h.sender === 'user' ? 'user' : 'assistant',
                content: this.scrubPII(h.text),
              })),
              { role: 'user', content: safePrompt },
            ],
            max_tokens: Number(process.env.AI_MAX_TOKENS) || 450,
            temperature: Number(process.env.AI_TEMPERATURE) || 0.6,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const generatedText = data.choices?.[0]?.message?.content?.trim();
          if (generatedText) {
            return {
              text: generatedText,
              isEmergencyAlert: false,
              suggestions: [
                'Como fazer a respiração 4-7-8?',
                'Como funciona o Momento Atual?',
                'Como desacelerar antes de dormir?',
              ],
              recommendedPracticeId: matchedPractice?.id,
              recommendedArticleId: matchedArticle?.id,
            };
          }
        }
      } catch {
        // Fallback gracefully to local curated engine
      }
    }

    // 7. Curated Knowledge & Psicoeducation Engine (Deterministic & Safe Local Engine)
    const lower = safePrompt.toLowerCase();

    // 7.1 Como funciona o Respira / Apresentação dos módulos
    if (
      lower.includes('como funciona') ||
      lower.includes('o que e o respira') ||
      lower.includes('o que e o aplicativo') ||
      lower.includes('sobre o respira') ||
      lower.includes('modulos') ||
      lower.includes('funcoes do app')
    ) {
      return {
        text: 'O **Respira** é uma plataforma dedicada ao acolhimento emocional, autorregulação e autoconhecimento. O aplicativo é organizado nos seguintes módulos:\n\n' +
          '• **Momento Atual**: Um check-in para você registrar como está se sentindo agora (humor, nível de ansiedade e emoções).\n' +
          '• **Diário e Histórico**: Acompanhamento dos seus registros ao longo do tempo, com gráfico de evolução e observações preliminares de tendências.\n' +
          '• **Biblioteca de Práticas**: Atividades guiadas em vídeo e áudio para respiração (como a técnica 4-7-8), meditação, relaxamento corporal e preparação para dormir.\n' +
          '• **Conteúdos**: Artigos educativos sobre ansiedade, rotina, sono e regulação emocional.\n' +
          '• **Apoio Imediato**: Acesso rápido a canais de escuta profissional gratuita, como o CVV (188).\n' +
          '• **Perfil e Preferências**: Ajustes de tema (claro/escuro), lembretes diários e privacidade.\n\n' +
          'Todas as ferramentas foram pensadas para você usar no seu próprio ritmo, com respeito e sem cobranças.',
        isEmergencyAlert: false,
        suggestions: [
          'Como fazer o check-in no Momento Atual?',
          'Quais práticas de respiração estão disponíveis?',
          'Como acessar os artigos educativos?',
        ],
        recommendedPracticeId: 'practice-breathing-478',
      };
    }

    // 7.2 Momento Atual & Diário
    if (
      lower.includes('momento atual') ||
      lower.includes('check-in') ||
      lower.includes('checkin') ||
      lower.includes('diario') ||
      lower.includes('historico')
    ) {
      return {
        text: 'No **Momento Atual**, você pode registrar suas emoções, nível de ansiedade e atividades em poucos segundos.\n\nSeus registros ficam organizados no **Histórico**, permitindo que você visualize como seu estado emocional varia ao longo dos dias e semanas. Os insights estatísticos servem para reflexão e autoconhecimento pessoal.',
        isEmergencyAlert: false,
        suggestions: [
          'Fazer um check-in agora',
          'Ver o histórico de registros',
          'Qual prática fazer após um dia agitado?',
        ],
      };
    }

    // 7.3 Apoio Imediato e CVV
    if (
      lower.includes('apoio') ||
      lower.includes('cvv') ||
      lower.includes('ligar') ||
      lower.includes('escuta') ||
      lower.includes('socorro')
    ) {
      return {
        text: 'A aba **Apoio Imediato** reúne serviços de acolhimento gratuitos e confidenciais disponíveis no Brasil.\n\nO principal canal é o **CVV (Centro de Valorização da Vida)**, que oferece apoio emocional pelo número **188** (ligação gratuita 24h por dia) e pelo site oficial cvv.org.br. Você também pode cadastrar contatos de confiança no aplicativo.',
        isEmergencyAlert: false,
        suggestions: [
          'Como funciona o atendimento do CVV?',
          'Ver canais na aba Apoio Imediato',
          'Fazer uma pausa de respiração agora',
        ],
      };
    }

    // 7.4 Limites clínicos / Diagnóstico
    if (
      lower.includes('diagnostico') ||
      lower.includes('transtorno') ||
      lower.includes('remedio') ||
      lower.includes('medicamento') ||
      lower.includes('sintomas') ||
      lower.includes('doenca')
    ) {
      return {
        text: 'Como assistente educativo do Respira, forneço orientações de autocuidado e informações sobre o aplicativo, mas não realizo diagnósticos clínicos nem prescrevo medicamentos.\n\nPara uma avaliação individualizada da sua saúde mental, consulte sempre um psicólogo ou médico de sua confiança.',
        isEmergencyAlert: false,
        suggestions: [
          'Entendendo a ansiedade no dia a dia',
          'Como funciona a rede de apoio do CVV?',
          'Fazer uma pausa de respiração guiada',
        ],
        recommendedArticleId: 'art-ansiedade-1',
        recommendedPracticeId: 'practice-breathing-478',
      };
    }

    // 7.5 Sono e Descanso
    if (lower.includes('sono') || lower.includes('dormir') || lower.includes('insonia')) {
      return {
        text: 'A dificuldade para desacelerar à noite costuma acontecer quando o corpo ainda está processando os estímulos e pendências do dia.\n\nPequenas ações como diminuir as luzes da casa 30 minutos antes de deitar, anotar preocupações no papel e praticar uma respiração compassada ajudam a sinalizar ao sistema nervoso que é seguro descansar.',
        isEmergencyAlert: false,
        suggestions: [
          'Praticar respiração 4-7-8 para o sono',
          'Ler artigo sobre higiene do sono',
          'Técnicas de relaxamento muscular',
        ],
        recommendedArticleId: 'article-sleep-and-stress',
        recommendedPracticeId: 'practice-breathing-478',
      };
    }

    // 7.6 Respiração
    if (lower.includes('respiracao') || lower.includes('4-7-8') || lower.includes('ar') || lower.includes('oxigenio')) {
      return {
        text: 'A respiração é uma ferramenta direta para regular o sistema nervoso autônomo. Quando prolongamos a expiração, estimulamos o nervo vago, diminuindo o ritmo cardíaco e a tensão muscular.\n\nNa **Técnica 4-7-8**, inspiramos pelo nariz em 4 tempos, seguramos o ar suavemente por 7 tempos e soltamos pela boca em 8 tempos.',
        isEmergencyAlert: false,
        suggestions: [
          'Iniciar exercício de respiração 4-7-8 agora',
          'O que é respiração diafragmática?',
          'Como funciona a ancoragem 5-4-3-2-1?',
        ],
        recommendedPracticeId: 'practice-breathing-478',
      };
    }

    // 7.7 Ancoragem e Atenção Plena
    if (lower.includes('5-4-3-2-1') || lower.includes('ancoragem') || lower.includes('aterramento') || lower.includes('atencao')) {
      return {
        text: 'A técnica **5-4-3-2-1** é um exercício sensorial de ancoragem (grounding). Ela convida você a perceber: 5 coisas que pode ver, 4 que pode tocar, 3 sons que pode ouvir, 2 aromas presentes e 1 sensação corporal ou respiração consciente.\n\nIsso ajuda a interromper espirais de pensamentos e traz o foco de volta ao momento presente.',
        isEmergencyAlert: false,
        suggestions: [
          'Iniciar prática de ancoragem guiada',
          'Ler artigo sobre pensamentos acelerados',
          'Como acalmar a mente agora?',
        ],
        recommendedPracticeId: 'practice-grounding-54321',
      };
    }

    // Resposta padrão serena e prestativa
    return {
      text: 'Estou aqui para apoiar você com informações sobre ansiedade, técnicas de respiração, hábitos de sono e o funcionamento da plataforma Respira.\n\nVocê pode me perguntar sobre como funciona algum módulo do aplicativo, pedir uma sugestão de prática para agora ou tirar dúvidas sobre regulação emocional.',
      isEmergencyAlert: false,
      suggestions: [
        'Como funciona o aplicativo Respira?',
        'Qual prática de respiração fazer agora?',
        'Como lidar com pensamentos acelerados?',
      ],
      recommendedPracticeId: 'practice-breathing-478',
    };
  }
}

export const aiAssistantService = new AIAssistantService();
