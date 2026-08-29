/**
 * Respira NLU Semantic Engine
 * Compreensão de Linguagem Natural, Gírias, Abreviações, Intenções, Contexto e Geração Conversacional.
 */

import { knowledgeBaseRAG, KnowledgeItem } from './knowledgeBaseRAG';

export interface SemanticAnalysisResult {
  cleanedText: string;
  intent:
    | 'GREETING'
    | 'HOW_ARE_YOU'
    | 'DAY_WAS_HARD'
    | 'DONT_WANT_TO_TALK'
    | 'ANXIETY_PANIC'
    | 'INSOMNIA_SLEEP'
    | 'PRACTICE_REQUEST'
    | 'REQUEST_SHORTER'
    | 'MOOD_LOGGING'
    | 'CRISIS_EMERGENCY'
    | 'GRATITUDE'
    | 'GENERAL_CHAT';
  matchedKnowledge: KnowledgeItem[];
  isCrisis: boolean;
  generatedResponse: string;
  actionText?: string;
  actionType?: 'open_practice' | 'open_article' | 'open_soundscape' | 'open_mood' | 'open_support' | 'open_profile' | 'call_helpline';
  actionPayload?: string;
  suggestions: string[];
}

export class NLUSemanticEngine {
  /**
   * Normaliza texto, corrigindo gírias e abreviações comuns em português brasileiro.
   */
  normalizeText(input: string): string {
    let text = input.trim().toLowerCase();

    // Dicionário de abreviações e gírias do dia a dia
    const slangMap: [RegExp, string][] = [
      [/\bvc\b/g, 'você'],
      [/\bvcs\b/g, 'vocês'],
      [/\btb\b|\btbm\b/g, 'também'],
      [/\bpq\b|\bpra que\b/g, 'por que'],
      [/\b(oq|o q)\b/g, 'o que'],
      [/\b(to|tô)\b/g, 'estou'],
      [/\b(ta|tá)\b/g, 'está'],
      [/\b(pra|prá)\b/g, 'para'],
      [/\b(pro|pró)\b/g, 'para o'],
      [/\bn\b|\bñ\b/g, 'não'],
      [/\bq\b|\bqnd\b/g, 'quando'],
      [/\bblz\b/g, 'beleza'],
      [/\bvlw\b/g, 'valeu'],
      [/\bobg\b|\bobgd\b/g, 'obrigado'],
      [/\btd\b|\btdo\b/g, 'tudo'],
      [/\bcmg\b/g, 'comigo'],
      [/\bctg\b/g, 'contigo'],
      [/\bdmais\b|\bdm\b/g, 'demais'],
      [/\bngm\b/g, 'ninguém'],
      [/\bmto\b|\bmt\b/g, 'muito'],
      [/\bmsm\b/g, 'mesmo'],
      [/\bcoracao\b|\bcoraçao\b|\bcoraçao\b/g, 'coração'],
      [/\brapido\b|\brápido\b/g, 'rápido'],
      [/\bansioso\b|\bansiosa\b|\bansiedade\b/g, 'ansioso'],
      [/\bpanico\b|\bpânico\b/g, 'pânico'],
      [/\binsonia\b|\binsônia\b|\bdormi\b|\bdormir\b/g, 'dormir'],
      [/\brespiracao\b|\brespiraçao\b/g, 'respiração'],
      [/\bpratica\b|\bprática\b/g, 'prática'],
    ];

    for (const [regex, replacement] of slangMap) {
      text = text.replace(regex, replacement);
    }

    return text;
  }

  /**
   * Identifica crises que exigem protocolo de segurança imediato.
   */
  detectCrisis(normalizedText: string): boolean {
    const unaccented = normalizedText
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const crisisPatterns = [
      'suicidio',
      'me matar',
      'tirar minha vida',
      'acabar com tudo',
      'nao aguento mais viver',
      'quero morrer',
      'cortar meus pulsos',
      'automutilacao',
      'overdose',
      'nao vejo saida',
    ];

    return crisisPatterns.some((pattern) => unaccented.includes(pattern));
  }

  /**
   * Processa a mensagem e gera uma resposta contextual rica e natural.
   */
  analyze(
    userInput: string,
    history: { sender: 'user' | 'assistant'; text: string }[] = []
  ): SemanticAnalysisResult {
    const cleaned = this.normalizeText(userInput);
    const matchedKnowledge = knowledgeBaseRAG.search(cleaned, 2);

    // 1. Verificação de Segurança e Crise Imediata
    if (this.detectCrisis(cleaned)) {
      return {
        cleanedText: cleaned,
        intent: 'CRISIS_EMERGENCY',
        matchedKnowledge,
        isCrisis: true,
        generatedResponse:
          'Percebo que você está passando por um momento de sofrimento intenso. Sua vida e seu bem-estar são muito importantes.\n\nPor favor, converse agora com o **CVV (Centro de Valorização da Vida)** pelo telefone gratuito **188** (disponível 24h em todo o Brasil) ou procure atendimento no serviço de emergência mais próximo (**SAMU 192**).\n\nVocê não precisa passar por isso sozinho(a).',
        actionText: 'Ligar para CVV (188)',
        actionType: 'call_helpline',
        actionPayload: '188',
        suggestions: ['Ligar para o CVV (188)', 'Como funciona o apoio do CVV?', 'Fazer uma respiração calma'],
      };
    }

    // 2. Análise do Contexto Imediato (última mensagem do assistente)
    const lastAssistantMsg = [...history].reverse().find((h) => h.sender === 'assistant')?.text.toLowerCase() || '';

    // Intenção: Pedido de prática mais curta / outra opção
    if (
      cleaned.includes('mais curta') ||
      cleaned.includes('mais rapida') ||
      cleaned.includes('menos tempo') ||
      cleaned.includes('outra opcao') ||
      cleaned.includes('nao gostei dessa') ||
      cleaned.includes('outra pratica')
    ) {
      return {
        cleanedText: cleaned,
        intent: 'REQUEST_SHORTER',
        matchedKnowledge,
        isCrisis: false,
        generatedResponse:
          'Com certeza! Para quando você tem pouco tempo ou quer algo bem rápido, recomendo a **Pausa Consciente** de apenas 1 a 2 minutos ou a **Respiração Quadrada**.',
        actionText: 'Iniciar Pausa Consciente',
        actionType: 'open_practice',
        actionPayload: 'practice-conscious-pause',
        suggestions: ['Iniciar Pausa Consciente', 'Fazer Respiração Quadrada (3 min)', 'Ouvir um som tranquilo'],
      };
    }

    // Intenção: Saudações ("oi", "ola", "bom dia", "boa noite", etc.)
    if (/^(oi|ola|olá|bom dia|boa tarde|boa noite|e ai|e aí|hey|hello|oie)\b/i.test(cleaned)) {
      const hour = new Date().getHours();
      const periodGreeting = hour < 12 ? 'Bom dia!' : hour < 18 ? 'Boa tarde!' : 'Boa noite!';

      return {
        cleanedText: cleaned,
        intent: 'GREETING',
        matchedKnowledge,
        isCrisis: false,
        generatedResponse: `${periodGreeting} Como você está se sentindo hoje? Se quiser, pode me contar como foi seu dia ou escolher uma prática para relaxar.`,
        suggestions: [
          'Quero contar como foi meu dia',
          'Estou me sentindo ansioso(a)',
          'Quero uma prática para desacelerar',
          'Como funciona o Respira?',
        ],
      };
    }

    // Intenção: "Como você está?"
    if (cleaned.includes('como você esta') || cleaned.includes('como voce esta') || cleaned.includes('tudo bem com voce') || cleaned.includes('como vai')) {
      return {
        cleanedText: cleaned,
        intent: 'HOW_ARE_YOU',
        matchedKnowledge,
        isCrisis: false,
        generatedResponse: 'Estou funcionando perfeitamente e pronto para ajudar você a cuidar do seu bem-estar. Como está sendo o seu dia até aqui?',
        suggestions: ['Meu dia foi tranquilo', 'Meu dia foi cansativo', 'Preciso relaxar um pouco'],
      };
    }

    // Intenção: "Meu dia foi difícil / ruim / cansativo"
    if (
      cleaned.includes('dia foi') ||
      cleaned.includes('dia muito') ||
      cleaned.includes('dia cansativo') ||
      cleaned.includes('dia puxado') ||
      cleaned.includes('dia estressante') ||
      cleaned.includes('dia pesado') ||
      cleaned.includes('dia ruim') ||
      cleaned.includes('dia dificil') ||
      cleaned.includes('muito cansativo')
    ) {
      return {
        cleanedText: cleaned,
        intent: 'DAY_WAS_HARD',
        matchedKnowledge,
        isCrisis: false,
        generatedResponse:
          'Sinto que seu dia tenha sido pesado. Dias assim exigem muito da gente. Quer me contar o que mais pesou hoje ou prefere fazer uma pausa rápida para soltar o corpo e desacelerar?',
        actionText: 'Iniciar Respiração 4-7-8',
        actionType: 'open_practice',
        actionPayload: 'practice-breathing-478',
        suggestions: ['Fazer uma respiração para acalmar', 'Registrar como estou no diário', 'Apenas conversar um pouco'],
      };
    }

    // Intenção: "Não quero falar / prefiro não falar"
    if (
      cleaned.includes('nao quero falar') ||
      cleaned.includes('prefiro nao falar') ||
      cleaned.includes('deixa quieto') ||
      cleaned.includes('nao quero explicar') ||
      cleaned.includes('sem vontade de falar')
    ) {
      return {
        cleanedText: cleaned,
        intent: 'DONT_WANT_TO_TALK',
        matchedKnowledge,
        isCrisis: false,
        generatedResponse:
          'Tudo bem. Você não precisa explicar nada. Podemos ficar em silêncio ou, se você quiser, posso colocar um som suave de chuva ou guiar uma respiração sem você precisar falar.',
        actionText: 'Ouvir Chuva Leve',
        actionType: 'open_soundscape',
        actionPayload: 'soundscape-rain',
        suggestions: ['Ouvir som de chuva suave', 'Fazer uma respiração curta', 'Voltar mais tarde'],
      };
    }

    // Intenção: Ansiedade, coração acelerado, taquicardia, agitação
    if (
      cleaned.includes('ansios') ||
      cleaned.includes('coracao acelerado') ||
      cleaned.includes('coracao disparado') ||
      cleaned.includes('coracao esta rapido') ||
      cleaned.includes('nervos') ||
      cleaned.includes('agitad') ||
      cleaned.includes('angustia') ||
      cleaned.includes('falta de ar')
    ) {
      const firstItem = matchedKnowledge[0] || {
        actionText: 'Iniciar Respiração 4-7-8',
        actionType: 'open_practice' as const,
        actionPayload: 'practice-breathing-478',
      };

      return {
        cleanedText: cleaned,
        intent: 'ANXIETY_PANIC',
        matchedKnowledge,
        isCrisis: false,
        generatedResponse:
          'A sensação de agitação e o coração acelerado são respostas comuns quando o corpo entra em alerta. O caminho mais direto para avisar seu sistema nervoso de que você está seguro(a) é alongar a expiração.\n\nRecomendo a **Respiração 4–7–8**: soltar o ar bem devagar ajuda a desacelerar a frequência cardíaca.',
        actionText: firstItem.actionText,
        actionType: firstItem.actionType,
        actionPayload: firstItem.actionPayload,
        suggestions: ['Iniciar Respiração 4-7-8', 'Técnica de ancoragem 5-4-3-2-1', 'Registrar como me sinto'],
      };
    }

    // Intenção: Dificuldade para dormir, sono, insônia
    if (
      cleaned.includes('dormir') ||
      cleaned.includes('sono') ||
      cleaned.includes('insonia') ||
      cleaned.includes('nao consigo dormir') ||
      cleaned.includes('mente acelerada na cama') ||
      cleaned.includes('desacelerar para dormir')
    ) {
      return {
        cleanedText: cleaned,
        intent: 'INSOMNIA_SLEEP',
        matchedKnowledge,
        isCrisis: false,
        generatedResponse:
          'Quando a mente não desliga à noite, insistir em forçar o sono costuma aumentar a frustração. Duas opções que ajudam muito são a prática **Preparação para Dormir** e os **Sons Calmantes de Chuva** para embalar o descanso.',
        actionText: 'Iniciar Preparação para Dormir',
        actionType: 'open_practice',
        actionPayload: 'practice-bedtime-prep',
        suggestions: ['Preparação para Dormir', 'Ouvir Chuva Leve', 'Respiração 4-7-8'],
      };
    }

    // Intenção: Registrar humor / diário
    if (
      cleaned.includes('registrar') ||
      cleaned.includes('diario') ||
      cleaned.includes('como estou') ||
      cleaned.includes('anotar') ||
      cleaned.includes('meu humor')
    ) {
      return {
        cleanedText: cleaned,
        intent: 'MOOD_LOGGING',
        matchedKnowledge,
        isCrisis: false,
        generatedResponse:
          'Você pode registrar como está se sentindo no módulo **Registrar momento**. Lá você seleciona seu nível de humor, ansiedade de 0 a 10 e emoções sentidas.',
        actionText: 'Registrar Como Estou',
        actionType: 'open_mood',
        actionPayload: '/momentos',
        suggestions: ['Registrar momento agora', 'Ver histórico e gráficos', 'Fazer uma prática antes'],
      };
    }

    // Intenção: Agradecimento
    if (cleaned.includes('obrigado') || cleaned.includes('obrigada') || cleaned.includes('valeu') || cleaned.includes('ajudou muito')) {
      return {
        cleanedText: cleaned,
        intent: 'GRATITUDE',
        matchedKnowledge,
        isCrisis: false,
        generatedResponse: 'Fico muito feliz em saber que ajudou! Lembre-se de respeitar o seu próprio ritmo. Estou sempre por aqui quando precisar de um respiro.',
        suggestions: ['Fazer outra prática', 'Ver meus conteúdos favoritos', 'Encerrar por agora'],
      };
    }

    // Intenção: Recomendação genérica / Busca na Base de Conhecimento (RAG)
    if (matchedKnowledge.length > 0) {
      const item = matchedKnowledge[0];
      return {
        cleanedText: cleaned,
        intent: 'PRACTICE_REQUEST',
        matchedKnowledge,
        isCrisis: false,
        generatedResponse: `Encontrei uma opção excelente para você no Respira: **${item.title}**.\n\n${item.description}`,
        actionText: item.actionText,
        actionType: item.actionType,
        actionPayload: item.actionPayload,
        suggestions: [item.actionText, 'Como funciona essa técnica?', 'Me recomende outra opção'],
      };
    }

    // Resposta conversacional acolhedora padrão
    return {
      cleanedText: cleaned,
      intent: 'GENERAL_CHAT',
      matchedKnowledge,
      isCrisis: false,
      generatedResponse:
        'Entendi o que você me disse. Posso te ajudar indicando exercícios de respiração para acalmar, sons relaxantes, artigos educativos ou apenas conversando para aliviar a mente. Como prefere seguir?',
      suggestions: [
        'Me indique uma respiração curta',
        'Estou com a mente acelerada',
        'Quero ouvir um som relaxante',
        'Como funciona o app?',
      ],
    };
  }
}

export const nluSemanticEngine = new NLUSemanticEngine();
