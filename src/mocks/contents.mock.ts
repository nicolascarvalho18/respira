import { Article } from '../types';

export const MOCK_ARTICLES: Article[] = [
  {
    id: 'article-understanding-anxiety',
    title: 'O que a ciência nos ensina sobre a ansiedade',
    summary:
      'A ansiedade é uma resposta natural de proteção do nosso organismo. Entenda como ela funciona no cérebro e no corpo.',
    category: 'basics',
    categoryName: 'Fundamentos',
    readTimeMinutes: 4,
    publishedAt: '2024-02-10T14:00:00Z',
    author: 'Equipe Editorial Respira',
    isFavorite: true,
    readProgress: 100,
    tags: ['Biologia', 'Fisiologia', 'Autoconhecimento'],
    relatedPracticeIds: ['practice-breathing-478', 'practice-breathing-cardiac'],
    content: `## A resposta de proteção do corpo

A ansiedade é um mecanismo adaptativo fundamental para a sobrevivência humana. Quando nosso cérebro percebe um possível desafio ou perigo, o sistema nervoso simpático é ativado, liberando neurotransmissores como a adrenalina e o cortisol.

Essa reação prepara o corpo para agir: o coração bate mais rápido para enviar oxigênio aos músculos, a respiração fica mais curta e nossos sentidos se aguçam.

### Quando o alarme dispara fora de hora

Em nosso mundo moderno, as ameaças raramente são predadores físicos; na maioria das vezes, são prazos, cobranças, incertezas ou conflitos. 

No entanto, o cérebro humano nem sempre distingue entre um perigo imediato e uma preocupação futura. Por isso, o "alarme" do corpo pode soar mesmo quando estamos sentados em uma cadeira com total segurança física.

### O papel da respiração consciente

A boa notícia é que o sistema respiratório é uma das poucas funções autônomas do corpo que podemos controlar conscientemente. Ao prolongar a expiração e respirar de forma suave e diafragmática, enviamos um sinal direto pelo nervo vago ao cérebro: *"O ambiente está seguro agora"*.

Compreender que as sensações físicas da ansiedade não são perigosas em si, mas apenas um alarme sensível do corpo, é o primeiro passo para cultivar uma relação mais gentil consigo mesmo.`,
  },
  {
    id: 'article-sleep-and-stress',
    title: 'Como desacelerar a mente antes de dormir',
    summary:
      'Pequenos ajustes na rotina noturna ajudam o sistema nervoso a transitar da agitação do dia para o repouso reparador.',
    category: 'sleep',
    categoryName: 'Sono e Descanso',
    readTimeMinutes: 5,
    publishedAt: '2024-02-15T09:30:00Z',
    author: 'Equipe Editorial Respira',
    isFavorite: false,
    readProgress: 40,
    tags: ['Sono', 'Higiene do Sono', 'Relaxamento'],
    relatedPracticeIds: ['practice-breathing-478', 'practice-relaxation-pmr'],
    content: `## A transição suave para o descanso

Muitas pessoas relatam que o momento de deitar na cama é quando os pensamentos mais se intensificam. Isso ocorre porque o silêncio da noite elimina as distrações cotidianas, deixando espaço para preocupações acumuladas virem à tona.

### 1. Descarregue as preocupações no papel

Manter um caderno ao lado da cama para anotar pendências ou ideias do dia seguinte ajuda a "desocupar" a memória de trabalho do cérebro. Uma vez escritas, o cérebro compreende que a informação está segura.

### 2. Crie uma zona livre de telas

A luz azul emitida por smartphones e computadores inibe a produção natural de melatonina, o hormônio do sono. Tente desconectar-se de dispositivos cerca de 30 a 45 minutos antes de dormir.

### 3. Técnicas de respiração para o sono

Praticar a respiração 4-7-8 deitado(a) ou uma breve varredura corporal auxilia a relaxar a musculatura do pescoço, maxilar e ombros, facilitando a indução natural do sono.`,
  },
  {
    id: 'article-grounding-skills',
    title: 'Técnica 5-4-3-2-1: Retomando o controle em momentos intensos',
    summary:
      'Aprenda o passo a passo da técnica de aterramento sensorial para ancorar sua atenção no presente durante picos de inquietação.',
    category: 'regulation',
    categoryName: 'Regulação Emocional',
    readTimeMinutes: 3,
    publishedAt: '2024-03-01T11:00:00Z',
    author: 'Equipe Editorial Respira',
    isFavorite: true,
    readProgress: 0,
    tags: ['Aterramento', 'Crise', 'Mindfulness'],
    relatedPracticeIds: ['practice-meditation-grounding'],
    content: `## O que é a técnica de ancoragem?

O aterramento sensorial (ou *grounding*) é uma ferramenta de autorregulação que direciona os recursos cognitivos para o ambiente físico imediato, interrompendo a espiral de pensamentos catastróficos.

### Como praticar passo a passo:

1. **5 coisas que você pode VER**: Olhe ao redor e note detalhes que normalmente passariam despercebidos (o reflexo na janela, a textura de uma parede, a cor de um objeto).
2. **4 coisas que você pode TOCAR**: Sinta a textura da sua roupa, a sola dos seus sapatos no chão ou o apoio das costas na cadeira.
3. **3 coisas que você pode OUVIR**: Preste atenção aos sons ao longe — o vento, um relógio, o tráfego distante.
4. **2 coisas que você pode CHEIRAR**: Note aromas sutis no ar, como café fresco, sabonete ou ar fresco.
5. **1 coisa que você pode PROVAR ou AGRADECER**: Reconheça um gosto na boca ou diga mentalmente uma palavra de acolhimento para si mesmo(a).

Essa sequência simples reativa o córtex pré-frontal e diminui a hiperatividade da amígdala cerebral.`,
  },
  {
    id: 'article-myths-about-anxiety',
    title: '5 Mitos comuns sobre a ansiedade desmistificados',
    summary:
      'Separar mitos populares de fatos científicos ajuda a diminuir a autocobrança e a culpa em momentos desafiadores.',
    category: 'myths',
    categoryName: 'Mitos e Fatos',
    readTimeMinutes: 4,
    publishedAt: '2024-03-12T16:20:00Z',
    author: 'Equipe Editorial Respira',
    isFavorite: false,
    readProgress: 0,
    tags: ['Mitos', 'Ciência', 'Psicoeducação'],
    relatedPracticeIds: ['practice-quick-pause'],
    content: `## Quebrando estigmas com conhecimento

Muitos tabus cercam a experiência da ansiedade. Vamos analisar 5 afirmações frequentes à luz do conhecimento científico:

### Mito 1: "Sentir ansiedade é sinal de fraqueza"
**Fato**: A ansiedade é uma função biológica universal presente em todos os seres humanos saudáveis. Ter momentos de maior sensibilidade é parte da condição humana.

### Mito 2: "Basta pensar positivo que a ansiedade desaparece"
**Fato**: Tentar suprimir pensamentos à força pode aumentar a tensão. O caminho mais eficaz envolve aceitação compassiva e técnicas de regulação do corpo.

### Mito 3: "A ansiedade causa danos físicos irreversíveis no coração"
**Fato**: Taquicardia em momentos de ansiedade é uma resposta temporária e inofensiva do sistema nervoso autônomo. O coração é um músculo forte preparado para oscilações de ritmo.

### Mito 4: "Evitar o que causa ansiedade é sempre a melhor solução"
**Fato**: A esquiva contínua tende a reforçar o medo a longo prazo. Pequenas aproximações graduais e no próprio ritmo geram maior confiança e resiliência.

### Mito 5: "Quem tem ansiedade não pode levar uma vida produtiva e feliz"
**Fato**: Com autoconhecimento, hábitos saudáveis e, quando indicado, suporte profissional adequado, é perfeitamente possível viver com leveza e plenitude.`,
  },
];

export const ARTICLE_CATEGORIES = [
  { id: 'all', name: 'Todos' },
  { id: 'basics', name: 'Fundamentos' },
  { id: 'regulation', name: 'Regulação' },
  { id: 'sleep', name: 'Sono e Descanso' },
  { id: 'myths', name: 'Mitos e Fatos' },
  { id: 'lifestyle', name: 'Estilo de Vida' },
];
