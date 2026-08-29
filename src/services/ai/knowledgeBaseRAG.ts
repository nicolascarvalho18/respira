/**
 * Respira Structured Knowledge Base & RAG Catalog
 * Dados oficiais de funcionalidades, práticas, artigos, sons, telas e canais de apoio.
 */

export interface KnowledgeItem {
  id: string;
  category: 'practice' | 'article' | 'soundscape' | 'feature' | 'helpline';
  title: string;
  keywords: string[];
  description: string;
  actionText: string;
  actionType: 'open_practice' | 'open_article' | 'open_soundscape' | 'open_mood' | 'open_support' | 'open_profile' | 'call_helpline';
  actionPayload: string;
}

export const RESPIRA_KNOWLEDGE_BASE: KnowledgeItem[] = [
  // --- PRÁTICAS DE RESPIRAÇÃO ---
  {
    id: 'practice-breathing-478',
    category: 'practice',
    title: 'Respiração 4–7–8',
    keywords: ['4-7-8', '478', 'respiracao 478', 'desacelerar', 'ansiedade', 'sono', 'dormir', 'calma', 'coracao acelerado', 'taquicardia'],
    description: 'Técnica clássica com inspiração em 4s, retenção em 7s e expiração suave em 8s para desacelerar o ritmo cardíaco e acalmar o corpo.',
    actionText: 'Iniciar Respiração 4-7-8',
    actionType: 'open_practice',
    actionPayload: 'practice-breathing-478',
  },
  {
    id: 'practice-breathing-box',
    category: 'practice',
    title: 'Respiração quadrada',
    keywords: ['quadrada', 'box breathing', '4 tempos', 'foco', 'estabilidade', 'centramento', 'trabalho', 'reuniao', 'ansiedade'],
    description: 'Ciclos de 4 tempos iguais (4s inspirar, 4s segurar, 4s expirar, 4s pausar) para reequilibrar o sistema nervoso e retomar o foco.',
    actionText: 'Iniciar Respiração Quadrada',
    actionType: 'open_practice',
    actionPayload: 'practice-breathing-box',
  },
  {
    id: 'practice-breathing-diaphragmatic',
    category: 'practice',
    title: 'Respiração diafragmática',
    keywords: ['diafragmatica', 'barriga', 'abdomen', 'respiracao profunda', 'ar', 'pulmao', 'tensao'],
    description: 'Respiração profunda expandindo o abdômen para oxigenação completa e alívio de tensão acumulada no tórax.',
    actionText: 'Iniciar Respiração Diafragmática',
    actionType: 'open_practice',
    actionPayload: 'practice-breathing-diaphragmatic',
  },
  {
    id: 'practice-breathing-prolonged-exhale',
    category: 'practice',
    title: 'Expiração prolongada',
    keywords: ['expiracao prolongada', 'soltar o ar', 'desacelerar', 'relaxar', 'acalmar'],
    description: 'Inspiração em 4 segundos e expiração lenta em 6 segundos, ativando o sistema nervoso parassimpático para relaxamento.',
    actionText: 'Iniciar Expiração Prolongada',
    actionType: 'open_practice',
    actionPayload: 'practice-breathing-prolonged-exhale',
  },
  {
    id: 'practice-breathing-cardiac-coherence',
    category: 'practice',
    title: 'Coerência cardíaca',
    keywords: ['coerencia cardiaca', 'ritmo 5-5', '5 segundos', 'equilibrio', 'emocional', 'estresse'],
    description: 'Ritmo suave e equilibrado de 5 segundos inspirando e 5 segundos expirando para harmonizar a frequência cardíaca.',
    actionText: 'Iniciar Coerência Cardíaca',
    actionType: 'open_practice',
    actionPayload: 'practice-breathing-cardiac-coherence',
  },

  // --- RELAXAMENTO E MEDITAÇÃO ---
  {
    id: 'practice-progressive-muscle',
    category: 'practice',
    title: 'Relaxamento muscular progressivo',
    keywords: ['muscular', 'tensao', 'ombros', 'pescoco', 'dor', 'corpo tenso', 'rigidez', 'contratura'],
    description: 'Sequência de contração e liberação de grupos musculares para soltar tensões físicas acumuladas ao longo do dia.',
    actionText: 'Iniciar Relaxamento Muscular',
    actionType: 'open_practice',
    actionPayload: 'practice-progressive-muscle',
  },
  {
    id: 'practice-body-scan',
    category: 'practice',
    title: 'Escaneamento corporal',
    keywords: ['escaneamento', 'body scan', 'corpo', 'sensacoes', 'perceber o corpo', 'presenca'],
    description: 'Atenção gentil voltada para cada parte do corpo, dos pés à cabeça, percebendo e acolhendo as sensações sem julgamento.',
    actionText: 'Iniciar Escaneamento Corporal',
    actionType: 'open_practice',
    actionPayload: 'practice-body-scan',
  },
  {
    id: 'practice-grounding-54321',
    category: 'practice',
    title: 'Ancoragem 5-4-3-2-1 pelos sentidos',
    keywords: ['54321', '5 4 3 2 1', 'ancoragem', 'crise', 'panico', 'desespero', 'voltar ao presente', 'sentidos'],
    description: 'Técnica de ancoragem usando visão, tato, audição, olfato e paladar para interromper espirais de ansiedade e voltar ao presente.',
    actionText: 'Iniciar Ancoragem 5-4-3-2-1',
    actionType: 'open_practice',
    actionPayload: 'practice-grounding-54321',
  },
  {
    id: 'practice-conscious-pause',
    category: 'practice',
    title: 'Pausa consciente',
    keywords: ['pausa', 'pausa consciente', '1 minuto', 'rapida', 'parar', 'respiro', 'trabalho', 'estudo'],
    description: 'Micro-pausa de 1 a 3 minutos para desconectar do piloto automático e reconectar com o momento atual.',
    actionText: 'Iniciar Pausa Consciente',
    actionType: 'open_practice',
    actionPayload: 'practice-conscious-pause',
  },
  {
    id: 'practice-bedtime-prep',
    category: 'practice',
    title: 'Preparação para dormir',
    keywords: ['dormir', 'sono', 'insonia', 'noite', 'deitar', 'desacelerar a mente', 'cama'],
    description: 'Prática noturna guiada para diminuir a atividade mental, relaxar a respiração e facilitar o adormecer.',
    actionText: 'Iniciar Preparação para Dormir',
    actionType: 'open_practice',
    actionPayload: 'practice-bedtime-prep',
  },

  // --- SONS CALMANTES ---
  {
    id: 'soundscape-rain',
    category: 'soundscape',
    title: 'Chuva leve',
    keywords: ['som de chuva', 'chuva', 'gotas', 'dormir', 'relaxar com som', 'barulho de chuva'],
    description: 'Som contínuo e acolhedor de chuva mansa para relaxar o corpo e induzir o sono.',
    actionText: 'Ouvir Chuva Leve',
    actionType: 'open_soundscape',
    actionPayload: 'soundscape-rain',
  },
  {
    id: 'soundscape-waves',
    category: 'soundscape',
    title: 'Ondas do mar',
    keywords: ['som do mar', 'ondas', 'praia', 'oceano', 'agua'],
    description: 'Ondas serenas quebrando suavemente na areia para acalmar pensamentos acelerados.',
    actionText: 'Ouvir Ondas do Mar',
    actionType: 'open_soundscape',
    actionPayload: 'soundscape-waves',
  },
  {
    id: 'soundscape-forest',
    category: 'soundscape',
    title: 'Floresta',
    keywords: ['floresta', 'natureza', 'arvores', 'vento', 'passaros'],
    description: 'Vento soprando entre as copas das árvores com sensação de frescor e tranquilidade.',
    actionText: 'Ouvir Floresta',
    actionType: 'open_soundscape',
    actionPayload: 'soundscape-forest',
  },
  {
    id: 'soundscape-brown-noise',
    category: 'soundscape',
    title: 'Ruído marrom',
    keywords: ['ruido marrom', 'brown noise', 'som grave', 'foco', 'insonia profunda'],
    description: 'Frequências baixas e densas semelhantes a uma cachoeira distante, ideal para desacelerar.',
    actionText: 'Ouvir Ruído Marrom',
    actionType: 'open_soundscape',
    actionPayload: 'soundscape-brown-noise',
  },

  // --- RECURSOS E FUNCIONALIDADES ---
  {
    id: 'feature-mood-diary',
    category: 'feature',
    title: 'Registrar momento (Diário de Humor)',
    keywords: ['registrar momento', 'como estou', 'diario', 'humor', 'ansiedade', 'anotar meu dia', 'como me sinto'],
    description: 'Check-in rápido para registrar nível de humor (1 a 5), ansiedade (0 a 10), emoções sentidas e notas pessoais.',
    actionText: 'Registrar Como Estou',
    actionType: 'open_mood',
    actionPayload: '/momentos',
  },
  {
    id: 'feature-security-profile',
    category: 'feature',
    title: 'Perfil e Configurações de Segurança',
    keywords: ['alterar senha', 'mudar senha', 'trocar senha', 'minha conta', 'foto', 'tema escuro', 'excluir conta'],
    description: 'Gerenciamento de perfil, foto, troca segura de senha, preferência de tema claro/escuro e exclusão de conta.',
    actionText: 'Abrir Meu Perfil',
    actionType: 'open_profile',
    actionPayload: '/(tabs)/profile',
  },

  // --- APOIO EMOCIONAL E EMERGÊNCIA ---
  {
    id: 'helpline-cvv',
    category: 'helpline',
    title: 'CVV — Centro de Valorização da Vida',
    keywords: ['cvv', '188', 'ligar', 'socorro', 'ajuda', 'desespero', 'morrer', 'suicidio', 'nao aguento mais', 'apoio emocional'],
    description: 'Atendimento gratuito, voluntário e confidencial 24 horas por dia por telefone (188) ou chat no cvv.org.br.',
    actionText: 'Ligar para CVV (188)',
    actionType: 'call_helpline',
    actionPayload: '188',
  },
];

export class KnowledgeBaseRAG {
  /**
   * Busca os itens mais relevantes da base de conhecimento a partir do texto do usuário.
   */
  search(query: string, maxResults = 2): KnowledgeItem[] {
    const normalized = query
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const scored: { item: KnowledgeItem; score: number }[] = [];

    for (const item of RESPIRA_KNOWLEDGE_BASE) {
      let score = 0;
      const titleNorm = item.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      if (normalized.includes(titleNorm)) {
        score += 10;
      }

      for (const kw of item.keywords) {
        const kwNorm = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalized.includes(kwNorm)) {
          score += 5;
        } else {
          // Busca por palavras individuais
          const words = kwNorm.split(' ');
          const matchingWords = words.filter((w) => w.length > 2 && normalized.includes(w));
          if (matchingWords.length > 0) {
            score += matchingWords.length * 2;
          }
        }
      }

      if (score > 0) {
        scored.push({ item, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, maxResults).map((s) => s.item);
  }
}

export const knowledgeBaseRAG = new KnowledgeBaseRAG();
