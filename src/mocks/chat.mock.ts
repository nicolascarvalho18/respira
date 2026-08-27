import { ChatMessage } from '../types';

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome-1',
    sender: 'assistant',
    text: 'Olá! Eu sou o assistente do Respira. Estou aqui para compartilhar informações de bem-estar, indicar práticas do aplicativo e apoiar seus momentos de reflexão.\n\nLembre-se: este é um recurso com finalidade puramente educativa e preventiva. Não realizo diagnósticos clínicos e não substituo o acompanhamento de profissionais de saúde mental.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    suggestions: [
      'Como acalmar o coração acelerado?',
      'O que fazer se não conseguir dormir?',
      'Me sugira um exercício de respiração rápido',
      'Como funciona a técnica 5-4-3-2-1?',
    ],
  },
];

export const QUICK_SUGGESTIONS = [
  'Como acalmar o coração acelerado?',
  'O que fazer se não conseguir dormir?',
  'Me sugira um exercício de respiração rápido',
  'Como funciona a técnica 5-4-3-2-1?',
  'O que é ansiedade no corpo?',
  'Preciso de ajuda urgente',
];

interface SimulatedResponseRule {
  keywords: string[];
  response: string;
  isEmergencyAlert?: boolean;
  recommendedPracticeId?: string;
  recommendedArticleId?: string;
  suggestions: string[];
}

export const CHAT_RESPONSE_RULES: SimulatedResponseRule[] = [
  {
    keywords: ['suicid', 'morrer', 'acabar com tudo', 'nao aguento mais', 'desesperad', 'me machucar', 'morte', 'urgente', 'socorro'],
    response:
      'Percebo que você está passando por um momento de sofrimento intenso. Por favor, lembre-se de que você não precisa passar por isso sozinho(a).\n\nComo sou apenas um assistente educativo, não consigo oferecer o suporte humano e imediato que você merece agora.\n\nRecomendo fortemente buscar acolhimento imediato:\n• Ligue gratuitamente para o **CVV no 188** (disponível 24h em todo o Brasil).\n• Converse com uma pessoa adulta ou familiar de sua confiança.\n• Se estiver em situação de risco, ligue para o **SAMU no 192** ou dirija-se a uma unidade de pronto atendimento.',
    isEmergencyAlert: true,
    suggestions: ['Abrir Apoio Imediato', 'Ver números de emergência', 'Fazer respiração 4-7-8'],
  },
  {
    keywords: ['coracao', 'acelerad', 'palpitacao', 'peito', 'falta de ar', 'taquicardia'],
    response:
      'Sensações físicas como batimentos cardíacos mais rápidos ou respiração curta são reações comuns quando o corpo entra em estado de alerta e libera adrenalina.\n\nEmbora causem desconforto, na ausência de condições médicas prévias, essas respostas são passageiras.\n\nUma forma eficaz de sinalizar ao corpo que você está em segurança é prolongar a expiração. Que tal experimentarmos a **Respiração 4-7-8** agora?',
    recommendedPracticeId: 'practice-breathing-478',
    recommendedArticleId: 'article-understanding-anxiety',
    suggestions: ['Iniciar Respiração 4-7-8', 'Ler sobre a biologia da ansiedade', 'Fazer outra pergunta'],
  },
  {
    keywords: ['dormir', 'sono', 'insonia', 'cama', 'noite', 'madrugada', 'acordad'],
    response:
      'A dificuldade para dormir com a mente agitada é muito frequente. Quando o ambiente fica silencioso, os pensamentos do dia costumam ganhar volume.\n\nDuas práticas muito recomendadas pela ciência do sono:\n1. Anotar as preocupações em um papel fora da cama;\n2. Praticar o **Relaxamento Muscular Progressivo** ou uma respiração lenta para liberar a musculatura dos ombros e maxilar.',
    recommendedPracticeId: 'practice-relaxation-pmr',
    recommendedArticleId: 'article-sleep-and-stress',
    suggestions: ['Ver artigo sobre sono', 'Iniciar Relaxamento Muscular', 'Dicas de rotina noturna'],
  },
  {
    keywords: ['5-4-3-2-1', 'ancoragem', 'aterramento', 'sentidos', 'chao', 'presente'],
    response:
      'A **Técnica 5-4-3-2-1** é um exercício sensorial excelente para ancorar a mente no presente:\n\n• **5 coisas que você pode ver** ao redor;\n• **4 coisas que você pode tocar** (sua roupa, a cadeira, a mesa);\n• **3 sons** sutis no ambiente;\n• **2 aromas** ou cheiros que você percebe;\n• **1 sabor** ou uma palavra de acolhimento para si mesmo(a).\n\nEssa prática ajuda o cérebro a sair do modo de ruminação futura e focar no que é concreto agora.',
    recommendedPracticeId: 'practice-meditation-grounding',
    recommendedArticleId: 'article-grounding-skills',
    suggestions: ['Praticar ancoragem guiada', 'Ler artigo detalhado', 'Outro exercício'],
  },
  {
    keywords: ['respiracao', 'respirar', 'rapido', 'exercicio', 'pratica', 'tecnica'],
    response:
      'Temos práticas guiadas no aplicativo prontas para você utilizar:\n\n• **Respiração 4-7-8**: ideal para relaxar e diminuir a tensão muscular.\n• **Respiração Quadrada (4-4-4-4)**: ótima para recuperar o foco e a clareza.\n• **Coerência Cardíaca (5-5)**: excelente para harmonizar o ritmo cardíaco.\n\nQual delas você prefere experimentar agora?',
    recommendedPracticeId: 'practice-breathing-box',
    suggestions: ['Respiração 4-7-8', 'Respiração Quadrada', 'Coerência Cardíaca'],
  },
  {
    keywords: ['o que e', 'ansiedade', 'normal', 'doenca', 'transtorno', 'sintoma'],
    response:
      'A ansiedade é uma emoção humana básica e natural, projetada para nos proteger e nos preparar para desafios.\n\nEla se torna desgastante quando o nível de alarme do corpo fica desproporcional ou frequente. Aprender a reconhecer os sinais precoces e praticar pausas conscientes são formas poderosas de autocuidado.\n\nSe a ansiedade estiver interferindo de forma contínua na sua qualidade de vida, conversar com um psicólogo ou médico é sempre a conduta mais recomendada.',
    recommendedArticleId: 'article-understanding-anxiety',
    suggestions: ['Ler sobre fundamentos', 'Ver mitos e fatos', 'Registrar como estou'],
  },
];

export const DEFAULT_CHAT_RESPONSE: SimulatedResponseRule = {
  keywords: [],
  response:
    'Obrigado por compartilhar isso. É muito válido reconhecer o que estamos sentindo e reservar um tempo para o autocuidado.\n\nVocê gostaria de fazer uma pausa rápida de respiração de 3 minutos, ler um artigo informativo sobre esse tema ou registrar esse momento no seu Diário?',
  recommendedPracticeId: 'practice-quick-pause',
  suggestions: ['Pausa de 2 minutos', 'Registrar no diário', 'Explorar conteúdos'],
};
