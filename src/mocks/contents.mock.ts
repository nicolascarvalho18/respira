import { Article } from '../types';

export const MOCK_ARTICLES: Article[] = [
  {
    id: 'article-understanding-anxiety',
    slug: 'entendendo-a-ansiedade',
    title: 'Entendendo a ansiedade no dia a dia',
    summary:
      'A ansiedade é uma reação natural do corpo para nos alertar diante de desafios. Entenda como ela age e como identificar seus sinais.',
    category: 'Entendendo a ansiedade',
    categoryName: 'Entendendo a ansiedade',
    readingTimeMinutes: 4,
    readTimeMinutes: 4,
    updatedAt: '2024-03-15T10:00:00Z',
    publishedAt: '2024-03-15T10:00:00Z',
    reviewedBy: 'Equipe de Saúde Mental',
    author: 'Equipe Respira',
    status: 'published',
    isFavorite: true,
    readProgress: 100,
    tags: ['Ansiedade', 'Autocuidado', 'Rotina'],
    relatedArticleIds: ['article-myths-about-anxiety', 'article-grounding-skills'],
    relatedPracticeId: 'practice-breathing-478',
    relatedPracticeIds: ['practice-breathing-478'],
    sections: [
      {
        title: 'O que é a ansiedade',
        body: 'A ansiedade é uma resposta biológica esperada do organismo quando nos deparamos com situações novas, incertas ou desafiadoras. Ela prepara o corpo para reagir, aumentando temporariamente o estado de alerta e a circulação sanguínea.',
      },
      {
        title: 'Como ela pode se manifestar',
        body: 'Cada pessoa percebe a ansiedade de maneira própria. Entre os sinais mais comuns no cotidiano estão pensamentos acelerados, sensação de aperto no peito, respiração mais curta, inquietação nas mãos ou tensão nos ombros.',
      },
      {
        title: 'Reação passageira versus desconforto frequente',
        body: 'Sentir ansiedade antes de uma apresentação, reunião ou decisão importante é normal e tende a passar logo após o evento. No entanto, quando a preocupação se torna constante, interfere no sono, na alimentação ou nas atividades do dia a dia, é um sinal de que o corpo está sob sobrecarga contínua.',
        callout: 'Reconhecer seus próprios limites não é fraqueza, mas sim o primeiro passo para reorganizar a rotina.',
      },
      {
        title: 'Quando buscar apoio e orientação',
        body: 'Se os momentos de tensão estiverem frequentes ou difíceis de manejar sozinho, conversar com pessoas de confiança e buscar apoio profissional de saúde (como psicólogos ou médicos) é fundamental para encontrar caminhos seguros de cuidado.',
      },
    ],
    content: `## O que é a ansiedade

A ansiedade é uma resposta biológica esperada do organismo quando nos deparamos com situações novas, incertas ou desafiadoras. Ela prepara o corpo para reagir, aumentando temporariamente o estado de alerta e a circulação sanguínea.

## Como ela pode se manifestar

Cada pessoa percebe a ansiedade de maneira própria. Entre os sinais mais comuns no cotidiano estão pensamentos acelerados, sensação de aperto no peito, respiração mais curta, inquietação nas mãos ou tensão nos ombros.

## Reação passageira versus desconforto frequente

Sentir ansiedade antes de uma apresentação, reunião ou decisão importante é normal e tende a passar logo após o evento. No entanto, quando a preocupação se torna constante, interfere no sono, na alimentação ou nas atividades do dia a dia, é um sinal de que o corpo está sob sobrecarga contínua.

> Reconhecer seus próprios limites não é fraqueza, mas sim o primeiro passo para reorganizar a rotina.

## Quando buscar apoio e orientação

Se os momentos de tensão estiverem frequentes ou difíceis de manejar sozinho, conversar com pessoas de confiança e buscar apoio profissional de saúde (como psicólogos ou médicos) é fundamental para encontrar caminhos seguros de cuidado.`,
  },
  {
    id: 'article-sleep-and-stress',
    slug: 'desacelerar-antes-de-dormir',
    title: 'Como desacelerar antes de dormir',
    summary:
      'Pequenos hábitos no fim da tarde e à noite ajudam o corpo a transitar da agitação para o repouso com mais facilidade.',
    category: 'Sono',
    categoryName: 'Sono',
    readingTimeMinutes: 5,
    readTimeMinutes: 5,
    updatedAt: '2024-03-18T14:30:00Z',
    publishedAt: '2024-03-18T14:30:00Z',
    reviewedBy: 'Equipe de Saúde Mental',
    author: 'Equipe Respira',
    status: 'published',
    isFavorite: false,
    readProgress: 40,
    tags: ['Sono', 'Higiene do Sono', 'Descanso'],
    relatedArticleIds: ['article-understanding-anxiety'],
    relatedPracticeId: 'practice-breathing-478',
    relatedPracticeIds: ['practice-breathing-478', 'practice-relaxation-pmr'],
    sections: [
      {
        title: 'Diminuir os estímulos da noite',
        body: 'Ao longo do dia acumulamos informações, luzes artificiais e pendências. Conforme a noite se aproxima, reduzir o brilho das telas de celulares e computadores ajuda o corpo a liberar melatonina de forma natural.',
      },
      {
        title: 'Organizar o ambiente de descanso',
        body: 'Um quarto arejado, silencioso e com luz suave sinaliza ao cérebro que o momento de vigília terminou. Pequenas mudanças, como deixar a cama arrumada e evitar trabalhar onde você dorme, fazem diferença.',
      },
      {
        title: 'Criar uma rotina simples e realista',
        body: 'Não é necessário seguir rituais complexos. Escolha duas ou três ações simples: tomar um banho morno, beber uma água, trocar de roupa e ler algumas páginas de um livro.',
        list: [
          'Evite cafeína e refeições pesadas próximo ao horário de deitar.',
          'Anote pendências em um papel para não ficar repassando a lista mentalmente na cama.',
          'Faça uma respiração lenta e compassada ao se deitar.',
        ],
      },
      {
        title: 'Evitar cobranças por sono imediato',
        body: 'Ficar olhando o relógio ou se cobrar para dormir rápido aumenta a ansiedade. Se o sono demorar mais de 25 minutos, levante-se com calma, faça uma atividade tranquila na penumbra e volte para a cama quando sentir os olhos pesados.',
      },
    ],
    content: `## Diminuir os estímulos da noite

Ao longo do dia acumulamos informações, luzes artificiais e pendências. Conforme a noite se aproxima, reduzir o brilho das telas de celulares e computadores ajuda o corpo a liberar melatonina de forma natural.

## Organizar o ambiente de descanso

Um quarto arejado, silencioso e com luz suave sinaliza ao cérebro que o momento de vigília terminou. Pequenas mudanças, como deixar a cama arrumada e evitar trabalhar onde você dorme, fazem diferença.

## Criar uma rotina simples e realista

Não é necessário seguir rituais complexos. Escolha duas ou três ações simples: tomar um banho morno, beber uma água, trocar de roupa e ler algumas páginas de um livro.

* Evite cafeína e refeições pesadas próximo ao horário de deitar.
* Anote pendências em um papel para não ficar repassando a lista mentalmente na cama.
* Faça uma respiração lenta e compassada ao se deitar.

## Evitar cobranças por sono imediato

Ficar olhando o relógio ou se cobrar para dormir rápido aumenta a ansiedade. Se o sono demorar mais de 25 minutos, levante-se com calma, faça uma atividade tranquila na penumbra e volte para a cama quando sentir os olhos pesados.`,
  },
  {
    id: 'article-grounding-skills',
    slug: 'tecnica-5-4-3-2-1',
    title: 'Técnica 5-4-3-2-1 para voltar ao momento presente',
    summary:
      'Um método simples de ancoragem nos cinco sentidos para desacelerar pensamentos rápidos e recuperar a clareza.',
    category: 'Rotina',
    categoryName: 'Rotina',
    readingTimeMinutes: 3,
    readTimeMinutes: 3,
    updatedAt: '2024-03-20T09:15:00Z',
    publishedAt: '2024-03-20T09:15:00Z',
    reviewedBy: 'Equipe de Saúde Mental',
    author: 'Equipe Respira',
    status: 'published',
    isFavorite: true,
    readProgress: 0,
    tags: ['Atenção Plena', 'Aterramento', 'Foco'],
    relatedArticleIds: ['article-understanding-anxiety'],
    relatedPracticeId: 'practice-grounding-54321',
    relatedPracticeIds: ['practice-grounding-54321'],
    sections: [
      {
        title: 'Para que serve a técnica',
        body: 'Quando estamos ansiosos, nossa mente costuma viajar para o futuro com cenários de preocupação. A ancoragem pelos cinco sentidos redireciona a atenção para o espaço físico onde você realmente está agora.',
      },
      {
        title: 'Como praticar passo a passo',
        body: 'Sente-se em posição confortável, apoie os pés no chão e faça uma respiração calma. Em seguida, observe com atenção:',
        list: [
          '5 coisas que você pode VER ao seu redor (cores, formatos, objetos).',
          '4 coisas que você pode TOCAR (sua roupa, o apoio da cadeira, a textura da mesa).',
          '3 sons que você pode OUVIR no ambiente (vento, tráfego distante, respiração).',
          '2 cheiros que você pode PERCEBER ou lembrar suavemente.',
          '1 frase amigável ou sensação positiva para si mesmo(a).',
        ],
      },
      {
        title: 'Como utilizar no cotidiano',
        body: 'Essa prática pode ser feita discretamente no trabalho, transporte ou antes de um compromisso. Não é preciso falar em voz alta nem fechar os olhos.',
      },
      {
        title: 'Limites da ferramenta',
        body: 'A técnica ajuda a estabilizar o momento presente, mas não resolve problemas práticos nem substitui acompanhamento contínuo quando a ansiedade for frequente.',
      },
    ],
    content: `## Para que serve a técnica

Quando estamos ansiosos, nossa mente costuma viajar para o futuro com cenários de preocupação. A ancoragem pelos cinco sentidos redireciona a atenção para o espaço físico onde você realmente está agora.

## Como praticar passo a passo

Sente-se em posição confortável, apoie os pés no chão e faça uma respiração calma. Em seguida, observe com atenção:

* 5 coisas que você pode VER ao seu redor (cores, formatos, objetos).
* 4 coisas que você pode TOCAR (sua roupa, o apoio da cadeira, a textura da mesa).
* 3 sons que você pode OUVIR no ambiente (vento, tráfego distante, respiração).
* 2 cheiros que você pode PERCEBER ou lembrar suavemente.
* 1 frase amigável ou sensação positiva para si mesmo(a).

## Como utilizar no cotidiano

Essa prática pode ser feita discretamente no trabalho, transporte ou antes de um compromisso. Não é preciso falar em voz alta nem fechar os olhos.

## Limites da ferramenta

A técnica ajuda a estabilizar o momento presente, mas não resolve problemas práticos nem substitui acompanhamento contínuo quando a ansiedade for frequente.`,
  },
  {
    id: 'article-myths-about-anxiety',
    slug: 'mitos-sobre-ansiedade',
    title: 'Cinco ideias equivocadas sobre ansiedade',
    summary:
      'Compreender o que é mito e o que é realidade ajuda a afastar a culpa e a lidar com mais clareza com as próprias emoções.',
    category: 'Mitos e verdades',
    categoryName: 'Mitos e verdades',
    readingTimeMinutes: 4,
    readTimeMinutes: 4,
    updatedAt: '2024-03-22T16:00:00Z',
    publishedAt: '2024-03-22T16:00:00Z',
    reviewedBy: 'Equipe de Saúde Mental',
    author: 'Equipe Respira',
    status: 'published',
    isFavorite: false,
    readProgress: 0,
    tags: ['Psicoeducação', 'Mitos', 'Informação'],
    relatedArticleIds: ['article-understanding-anxiety', 'article-sleep-and-stress'],
    relatedPracticeId: 'practice-pmr-relaxation',
    relatedPracticeIds: ['practice-pmr-relaxation'],
    sections: [
      {
        title: '1. "Sentir ansiedade é sinal de fraqueza"',
        body: 'Mito. A ansiedade é um mecanismo comum a todos os seres humanos. Ela surge como proteção e não tem relação com falta de força de vontade ou fraqueza de caráter.',
      },
      {
        title: '2. "Basta pensar positivo para que ela suma"',
        body: 'Mito. Tentar ignorar ou forçar pensamentos felizes pode aumentar a pressão interna. Acolher o que você sente e regular o corpo com respiração e pausa é muito mais eficaz.',
      },
      {
        title: '3. "A ansiedade causa danos permanentes ao coração"',
        body: 'Mito. As palpitações e o coração acelerado durante um pico de ansiedade são reações temporárias do sistema nervoso. O músculo cardíaco é saudável e preparado para oscilações de ritmo.',
      },
      {
        title: '4. "Evitar tudo o que causa desconforto é a melhor saída"',
        body: 'Mito. Fugir constantemente das situações que causam receio pode fazer com que o medo aumente com o tempo. Enfrentar gradualmente, no seu ritmo e com apoio, constrói segurança.',
      },
      {
        title: '5. "Quem tem ansiedade não consegue ter uma vida plena"',
        body: 'Mito. Com bons hábitos de rotina, autoconhecimento e apoio profissional quando indicado, é totalmente possível trabalhar, estudar, manter relacionamentos saudáveis e viver com tranquilidade.',
      },
    ],
    content: `## 1. "Sentir ansiedade é sinal de fraqueza"

Mito. A ansiedade é um mecanismo comum a todos os seres humanos. Ela surge como proteção e não tem relação com falta de força de vontade ou fraqueza de caráter.

## 2. "Basta pensar positivo para que ela suma"

Mito. Tentar ignorar ou forçar pensamentos felizes pode aumentar a pressão interna. Acolher o que você sente e regular o corpo com respiração e pausa é muito mais eficaz.

## 3. "A ansiedade causa danos permanentes ao coração"

Mito. As palpitações e o coração acelerado durante um pico de ansiedade são reações temporárias do sistema nervoso. O músculo cardíaco é saudável e preparado para oscilações de ritmo.

## 4. "Evitar tudo o que causa desconforto é a melhor saída"

Mito. Fugir constantemente das situações que causam receio pode fazer com que o medo aumente com o tempo. Enfrentar gradualmente, no seu ritmo e com apoio, constrói segurança.

## 5. "Quem tem ansiedade não consegue ter uma vida plena"

Mito. Com bons hábitos de rotina, autoconhecimento e apoio profissional quando indicado, é totalmente possível trabalhar, estudar, manter relacionamentos saudáveis e viver com tranquilidade.`,
  },
];

export const ARTICLE_CATEGORIES = [
  { id: 'all', name: 'Todos' },
  { id: 'Entendendo a ansiedade', name: 'Entendendo a ansiedade' },
  { id: 'Bem-estar emocional', name: 'Bem-estar emocional' },
  { id: 'Sono', name: 'Sono' },
  { id: 'Rotina', name: 'Rotina' },
  { id: 'Mitos e verdades', name: 'Mitos e verdades' },
];
