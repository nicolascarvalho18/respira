/**
 * Respira AI Assistant Service (Backend Architecture)
 * - Rate Limiting (Sliding window)
 * - Input Validation & Sanitization
 * - LGPD PII Scrubbing (CPF, Phone, Email)
 * - Clinical Safety Guardrails (Crisis / CVV 188 / SAMU 192)
 * - Semantic NLU & Dynamic Knowledge Base RAG Catalog
 * - Multi-provider LLM API Integration (OpenAI / Groq / Gemini / OpenRouter)
 */

import { nluSemanticEngine } from '../../services/ai/nluSemanticEngine';
import { knowledgeBaseRAG } from '../../services/ai/knowledgeBaseRAG';

export interface AIResponsePayload {
  text: string;
  isEmergencyAlert: boolean;
  suggestions: string[];
  recommendedPracticeId?: string;
  recommendedArticleId?: string;
  actionText?: string;
  actionType?: 'open_practice' | 'open_article' | 'open_soundscape' | 'open_mood' | 'open_support' | 'open_profile' | 'call_helpline';
  actionPayload?: string;
}

// In-memory sliding window rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30; // 30 requests
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
    return nluSemanticEngine.detectCrisis(input);
  }

  /**
   * 4. Generate AI Response
   */
  async generateResponse(
    userMessage: string,
    userId: string = 'user-current',
    history: { sender: 'user' | 'assistant'; text: string }[] = [],
    abortSignal?: AbortSignal
  ): Promise<AIResponsePayload> {
    // 1. Rate Limit
    const rate = this.checkRateLimit(userId);
    if (!rate.allowed) {
      return {
        text: 'Você enviou muitas mensagens em pouco tempo. Por favor, aguarde um minuto para continuar nossa conversa com calma.',
        isEmergencyAlert: false,
        suggestions: ['Fazer uma respiração curta', 'Como funciona o Respira?'],
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
        text: 'Percebo que você está passando por um momento de sofrimento intenso. Sua vida e seu bem-estar são muito importantes.\n\nPor favor, converse agora com o **CVV (Centro de Valorização da Vida)** pelo telefone gratuito **188** (atendimento 24 horas em todo o Brasil) ou procure o serviço de emergência mais próximo (**SAMU 192**).\n\nVocê não precisa passar por isso sozinho(a).',
        isEmergencyAlert: true,
        suggestions: ['Ligar para o CVV (188)', 'Como funciona o apoio do CVV?', 'Fazer uma respiração calma'],
        recommendedPracticeId: 'practice-breathing-478',
        actionText: 'Ligar para CVV (188)',
        actionType: 'call_helpline',
        actionPayload: '188',
      };
    }

    // 4. Scrub PII
    const safePrompt = this.scrubPII(userMessage);

    // 5. NLU Semantic Analysis & RAG Context
    const semanticResult = nluSemanticEngine.analyze(safePrompt, history);

    // 6. External LLM Provider Call (if configured via ENV)
    const apiKey =
      process.env.LLM_API_KEY ||
      process.env.AI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.GROQ_API_KEY;

    const baseUrl =
      process.env.LLM_BASE_URL ||
      process.env.AI_API_BASE_URL ||
      (process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1');

    const model =
      process.env.LLM_MODEL ||
      process.env.AI_MODEL ||
      (process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini');

    if (apiKey && apiKey.trim() !== '') {
      try {
        const ragContext = semanticResult.matchedKnowledge
          .map((k) => `- ${k.title}: ${k.description}`)
          .join('\n');

        const systemPrompt = `Você é o Assistente Oficial da plataforma Respira, especialista em bem-estar emocional, acolhimento e práticas de respiração.
Sua missão é acolher com carinho, empatia e brevidade, usando português do Brasil natural, sereno e profissional.

Base de conhecimento do Respira disponível:
${ragContext}

Diretrizes obrigatórias:
1. Responda de forma direta, acolhedora e breve (1 a 3 parágrafos curtos).
2. Se o usuário estiver ansioso ou sem ar, indique exercícios de expiração longa ou respiração 4-7-8.
3. Se o usuário estiver com insônia, indique práticas noturnas ou sons de chuva.
4. Nunca diagnostique, nunca prescreva medicamentos e nunca finja ser médico ou psicólogo.
5. Seja natural: entenda gírias, abreviações ("to ansioso", "n consigo dormir") e responda com simpatia.`;

        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          signal: abortSignal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...history.slice(-8).map((h) => ({
                role: h.sender === 'user' ? 'user' : 'assistant',
                content: this.scrubPII(h.text),
              })),
              { role: 'user', content: safePrompt },
            ],
            max_tokens: Number(process.env.AI_MAX_TOKENS) || 450,
            temperature: Number(process.env.AI_TEMPERATURE) || 0.65,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const generatedText = data.choices?.[0]?.message?.content?.trim();
          if (generatedText) {
            return {
              text: generatedText,
              isEmergencyAlert: false,
              suggestions: semanticResult.suggestions,
              recommendedPracticeId: semanticResult.actionPayload?.includes('practice')
                ? semanticResult.actionPayload
                : undefined,
              actionText: semanticResult.actionText,
              actionType: semanticResult.actionType,
              actionPayload: semanticResult.actionPayload,
            };
          }
        }
      } catch (e: any) {
        if (e.name === 'AbortError') {
          throw e;
        }
        // Fallback para o motor semântico local resiliente
      }
    }

    // 7. Retorno do Motor Semântico NLU Local com RAG
    return {
      text: semanticResult.generatedResponse,
      isEmergencyAlert: semanticResult.isCrisis,
      suggestions: semanticResult.suggestions,
      recommendedPracticeId: semanticResult.actionPayload?.includes('practice')
        ? semanticResult.actionPayload
        : undefined,
      actionText: semanticResult.actionText,
      actionType: semanticResult.actionType,
      actionPayload: semanticResult.actionPayload,
    };
  }
}

export const aiAssistantService = new AIAssistantService();
