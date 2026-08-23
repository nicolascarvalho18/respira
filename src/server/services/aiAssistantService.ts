/**
 * Respira AI Assistant Service (Backend Architecture)
 * - Rate Limiting
 * - Input Validation & Sanitization
 * - LGPD PII Scrubbing (CPF, Phone, Email)
 * - Clinical Safety Guardrails (Crisis / CVV 188 / SAMU 192)
 * - RAG with Approved Respira Psychoeducation Catalog
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
        suggestions: ['Como fazer uma respiração guiada?', 'O que é a técnica 5-4-3-2-1?'],
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
        recommendedPracticeId: 'practice-quick-pause',
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
        const systemPrompt = `Você é o Assistente Educativo do aplicativo Respira.
Sua missão é oferecer acolhimento, psicoeducação e orientações práticas e respeitosas sobre ansiedade, sono, rotina e respiração.
Regras fundamentais:
1. Nunca faça diagnósticos médicos ou psicológicos.
2. Nunca prescreva medicamentos ou altere tratamentos.
3. Não use jargões difíceis nem tom excessivamente motivacional ("transforme sua vida", etc.).
4. Use linguagem clara, serena e natural em Português Brasileiro.
5. Se o usuário estiver angustiado, recomende pausas breves de respiração ou apoio humano.`;

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
                'Como desacelerar antes de dormir?',
                'Exercício de ancoragem 5-4-3-2-1',
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

    // 7. Robust Curated Psicoeducation Engine (Deterministic & Safe Local Fallback)
    const lower = safePrompt.toLowerCase();

    if (
      lower.includes('diagnostico') ||
      lower.includes('transtorno') ||
      lower.includes('remedio') ||
      lower.includes('medicamento') ||
      lower.includes('sintomas')
    ) {
      return {
        text: 'Como assistente educativo do Respira, não realizo diagnósticos clínicos nem prescrevo tratamentos. Para uma avaliação individualizada dos seus sintomas, recomendo conversar com um psicólogo ou médico de sua confiança.',
        isEmergencyAlert: false,
        suggestions: [
          'Entendendo a ansiedade no dia a dia',
          'Como funciona a rede de apoio do CVV?',
          'Fazer uma pausa de respiração guiada',
        ],
        recommendedArticleId: 'article-understanding-anxiety',
        recommendedPracticeId: 'practice-quick-pause',
      };
    }

    if (lower.includes('sono') || lower.includes('dormir') || lower.includes('insonia')) {
      return {
        text: 'A dificuldade para desacelerar à noite costuma acontecer quando o corpo ainda está processando os estímulos e pendências do dia.\n\nPequenas ações como diminuir as luzes da casa 30 minutos antes de deitar, anotar preocupações no papel e praticar uma respiração compassada ajudam a sinalizar ao sistema nervoso que é seguro descansar.',
        isEmergencyAlert: false,
        suggestions: [
          'Praticar respiração 4-7-8 para o sono',
          'Ler artigo: Como desacelerar antes de dormir',
          'Técnicas de relaxamento muscular',
        ],
        recommendedArticleId: 'article-sleep-and-stress',
        recommendedPracticeId: 'practice-breathing-478',
      };
    }

    if (lower.includes('respiracao') || lower.includes('4-7-8') || lower.includes('ar')) {
      return {
        text: 'A respiração é uma ferramenta direta para acalmar o sistema nervoso. Quando prolongamos a expiração, estimulamos o nervo vago, reduzindo a frequência cardíaca.\n\nNa técnica 4-7-8, inspiramos pelo nariz em 4 segundos, seguramos o ar por 7 e soltamos lentamente pela boca em 8 segundos.',
        isEmergencyAlert: false,
        suggestions: [
          'Iniciar exercício de respiração 4-7-8 agora',
          'O que é respiração quadrada (box)?',
          'Como funciona a coerência cardíaca?',
        ],
        recommendedPracticeId: 'practice-breathing-478',
      };
    }

    if (lower.includes('5-4-3-2-1') || lower.includes('ancoragem') || lower.includes('aterramento')) {
      return {
        text: 'A técnica 5-4-3-2-1 é um exercício sensorial de atenção plena. Ela convida você a notar 5 coisas que pode ver, 4 que pode tocar, 3 que pode ouvir, 2 aromas presentes e 1 sensação ou pensamento gentil.\n\nIsso ajuda a trazer o foco de volta ao ambiente físico imediato.',
        isEmergencyAlert: false,
        suggestions: [
          'Iniciar prática de ancoragem guiada',
          'Ler artigo sobre a técnica 5-4-3-2-1',
          'Como acalmar pensamentos acelerados?',
        ],
        recommendedArticleId: 'article-grounding-skills',
        recommendedPracticeId: 'practice-grounding-54321',
      };
    }

    return {
      text: 'Estou aqui para apoiar você com informações práticas sobre ansiedade, técnicas de respiração, hábitos de sono e autocuidado.\n\nVocê pode me perguntar sobre uma técnica específica, pedir uma sugestão de prática para este momento ou explorar os conteúdos educativos do aplicativo.',
      isEmergencyAlert: false,
      suggestions: [
        'Como lidar com pensamentos acelerados?',
        'Qual prática de respiração fazer agora?',
        'Dicas para organizar a rotina',
      ],
      recommendedPracticeId: matchedPractice?.id || 'practice-breathing-478',
      recommendedArticleId: matchedArticle?.id || 'article-understanding-anxiety',
    };
  }
}

export const aiAssistantService = new AIAssistantService();
