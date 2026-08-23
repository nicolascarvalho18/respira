# Respira 🌿 — Plataforma de Apoio ao Gerenciamento da Ansiedade

O **Respira** é um aplicativo mobile completo de apoio ao bem-estar e autocuidado emocional, desenvolvido em React Native, Expo e TypeScript. Ele oferece ferramentas interativas e psicoeducativas para auxiliar no manejo do estresse e da ansiedade cotidiana.

> [!IMPORTANT]
> **Aviso de Saúde e Diretrizes Éticas**
> O **Respira** tem finalidade exclusivamente educativa e de suporte ao autocuidado. O aplicativo **NÃO realiza diagnósticos clínicos**, **NÃO prescreve tratamentos ou medicamentos** e **NÃO substitui consultas ou acompanhamento de psicólogos, psiquiatras, médicos ou serviços de emergência hospitalar**. Em situações de sofrimento agudo ou risco, acione imediatamente o **CVV (188)**, o **SAMU (192)** ou os serviços de emergência da sua região.

---

## 📱 Tecnologias Utilizadas (Stack)

* **Framework Mobile**: [React Native](https://reactnative.dev/) com [Expo SDK 51](https://expo.dev/)
* **Linguagem**: [TypeScript](https://www.typescriptlang.org/) em modo `strict`
* **Roteamento**: [Expo Router v3](https://docs.expo.dev/router/introduction/) (File-system routing)
* **Estilização**: [NativeWind / Tailwind CSS](https://www.nativewind.dev/) com Design System customizado
* **Formulários e Validação**: [React Hook Form](https://react-hook-form.com/) e [Zod](https://zod.dev/)
* **Gerenciamento de Estado**: [Zustand](https://github.com/pmndrs/zustand)
* **Gerenciamento de Requisições e Cache**: [TanStack React Query v5](https://tanstack.com/query)
* **Persistência Local**: [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/)
* **Sessão Segura**: [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) (com fallback para web)
* **Animações Fluidas**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
* **Áudio e Feedback Tátil**: [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/) e [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)
* **Ícones**: [Lucide React Native](https://lucide.dev/)
* **Testes**: [Jest](https://jestjs.io/) e [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
* **Qualidade de Código**: [ESLint](https://eslint.org/) e [Prettier](https://prettier.io/)

---

## 🎨 Identidade Visual e Acessibilidade

* **Cor Primária**: Azul-petróleo (`#2E6F73`)
* **Cor Secundária**: Verde suave (`#79B8A4`)
* **Fundo Principal**: `#F7FAF9` (Claro) / `#12181B` (Escuro)
* **Superfícies**: `#FFFFFF` (Claro) / `#1E262B` (Escuro)
* **Destaque Suave**: `#DDEFE9` (Claro) / `#23383B` (Escuro)
* **Texto Principal**: `#1F2933` / `#F0F4F8`
* **Texto Secundário**: `#66737D` / `#9AA5B1`
* **Atenção / SOS**: `#D97757`
* **Erro**: `#B94A48`
* **Bordas**: `#DCE5E2` / `#2D3740`
* **Acessibilidade**:
  * Contraste de cores em conformidade com WCAG AA+.
  * Rótulos e dicas de acessibilidade em todos os elementos interativos (`accessibilityLabel`, `accessibilityHint`, `accessibilityRole`).
  * Suporte nativo à redução de movimento (`prefers-reduced-motion` e toggle manual).
  * Alternativa textual detalhada e acessível para gráficos e métricas.

---

## 📂 Estrutura de Pastas

```text
respira/
├── app/                        # Roteamento baseado em arquivos (Expo Router)
│   ├── _layout.tsx             # Root layout (Providers globais)
│   ├── index.tsx               # Splash screen com roteamento automático
│   ├── (auth)/                 # Fluxo público (onboarding, login, cadastro, termos, privacidade)
│   ├── (tabs)/                 # Fluxo principal autenticado (5 abas)
│   │   ├── _layout.tsx         # Navegação inferior por abas
│   │   ├── index.tsx           # Início (Check-in rápido, atalhos, recomendação)
│   │   ├── diary.tsx           # Diário de humor, gráfico semanal e histórico
│   │   ├── practices.tsx       # Práticas, respiração, relaxamento e favoritos
│   │   ├── content.tsx         # Artigos educativos e busca psicoeducativa
│   │   └── profile.tsx         # Perfil, tema, notificações, exportação LGPD e conta
│   ├── chat/index.tsx          # Chat Educativo com IA e guardrails de segurança
│   ├── practices/
│   │   ├── breathing.tsx       # Exercício de Respiração Imersivo (4-7-8, Box, Coerência)
│   │   └── player/[id].tsx     # Player de meditação guiada e áudio
│   ├── content/[id].tsx        # Leitura formatada de artigo e práticas relacionadas
│   ├── mood/
│   │   ├── new.tsx             # Novo registro de humor com sugestão acolhedora
│   │   └── edit/[id].tsx       # Edição de registro do diário
│   ├── support/index.tsx       # Apoio Imediato SOS, contatos por país e ancoragem 5-4-3-2-1
│   └── admin/index.tsx         # Painel administrativo demonstrativo protegido
├── src/
│   ├── components/             # Componentes reutilizáveis (UI, Mood, Practices, Chat, Content)
│   ├── constants/              # Cores, rotas, termos legais e telefones de emergência
│   ├── hooks/                  # Custom hooks (useAuth, useTheme, useReducedMotion, useAudio)
│   ├── mocks/                  # Dados simulados realistas (usuários, diário, artigos, práticas)
│   ├── services/               # Serviços desacoplados e cliente REST preparado
│   ├── store/                  # Stores Zustand (Auth, Mood, Practices, Content, Chat, Theme)
│   ├── tests/                  # Suíte de testes automatizados (Jest + RNTL)
│   ├── types/                  # Definições de tipos TypeScript estritos
│   └── utils/                  # Formatadores, datas, logger seguro e estatísticas
├── .env.example                # Exemplo de variáveis de ambiente
├── package.json
└── README.md
```

---

## 🚀 Pré-requisitos

* **Node.js**: Versão 18 ou superior (recomendado Node 20+)
* **npm** ou **yarn**
* *(Opcional para Android)*: **Android Studio** com Android SDK e dispositivo virtual (AVD) configurado.
* *(Opcional para dispositivo físico)*: Aplicativo **Expo Go** instalado via Google Play Store ou Apple App Store.

---

## ⚙️ Instalação

Clone ou navegue até o diretório do projeto e instale as dependências:

```bash
npm install
```

Crie o arquivo de variáveis de ambiente com base no `.env.example`:

```bash
cp .env.example .env
```

---

## 💻 Executando o Projeto

### 1. Executar no Navegador Web (Expo Web)
Excelente para testar todas as telas e interações instantaneamente em qualquer computador:

```bash
npx expo start --web
# ou
npm run web
```
O aplicativo abrirá automaticamente em `http://localhost:8081`.

### 2. Executar no Expo Go (Dispositivo Físico)
1. Instale o aplicativo **Expo Go** no seu smartphone (Android ou iOS).
2. Execute o comando:
   ```bash
   npx expo start
   ```
3. Abra o Expo Go e leia o **QR Code** exibido no terminal.

---

## 🤖 Executando no Emulador Android (Android Studio)

### Passo a passo para configurar o Emulador Android:

1. **Instalar o Android Studio**: Baixe e instale a versão mais recente em [developer.android.com](https://developer.android.com/studio).
2. **Instalar o Android SDK**: No Android Studio, abra `SDK Manager` e certifique-se de que o **Android SDK Platform-Tools** e a versão de Android desejada (ex: Android 13 ou 14) estão instalados.
3. **Criar um Dispositivo Virtual (AVD)**:
   - Abra o `Device Manager` no Android Studio.
   - Clique em **Create Device**.
   - Selecione um modelo com suporte à Play Store (ex: *Pixel 7* ou *Pixel 3a*).
   - Baixe a imagem do sistema (recomendado: *Google Play Intel x86_64 Atom System Image* ou *ARM64*).
   - Conclua a criação do AVD.
4. **Inicializar o Emulador**:
   - Inicie o dispositivo virtual clicando no botão Play no `Device Manager`.
5. **Executar o Respira no Emulador**:
   ```bash
   npx expo start --android
   # ou execute o helper:
   start-android.cmd
   ```
6. **Comunicação com API Backend Local (`10.0.2.2`)**:
   - No emulador Android oficial, o endereço `10.0.2.2` é um alias especial que redireciona diretamente para o `localhost` da máquina host.
   - O arquivo `.env` já vem pré-configurado com:
     ```text
     EXPO_PUBLIC_API_URL=http://10.0.2.2:8080/api/v1
     ```

### 🔧 Resolução de Problemas Comuns do Android (Troubleshooting)

* **Erro: `adb is not recognized`**:
  Adicione o caminho do SDK ao seu `PATH` de usuário no Windows:
  `C:\Users\<SeuUsuario>\AppData\Local\Android\Sdk\platform-tools` e `C:\Users\<SeuUsuario>\AppData\Local\Android\Sdk\emulator`.
* **Erro: `Device offline`**:
  Execute `adb kill-server` seguido de `adb start-server`, feche o emulador e abra novamente no Android Studio.

---

## 🧪 Testes Automatizados e Qualidade

O projeto inclui uma suíte completa de testes unitários e de integração cobrindo autenticação, validação Zod, persistência do diário de humor, guardrails éticos do chat de IA, controle de acesso administrativo e renderização de componentes de acessibilidade.

### Executar a suíte de testes:
```bash
npm test
```

### Executar a verificação estrita de tipos TypeScript:
```bash
npm run typecheck
```

### Executar a análise estática com ESLint:
```bash
npm run lint
```

---

## 🔒 Segurança, Privacidade e LGPD

* **Sessão Segura**: Utilização de `Expo SecureStore` para persistência segura de tokens e credenciais.
* **Anonimização no Painel Admin**: Os administradores têm acesso apenas a métricas consolidadas e e-mails mascarados. Diários pessoais e mensagens de chat são **estritamente inacessíveis**.
* **Zero Segredos no Front-end**: Nenhuma chave privada ou segredo sensível de backend foi inserido no código. Variáveis de ambiente públicas utilizam o prefixo obrigatório `EXPO_PUBLIC_`.
* **Exportação e Exclusão LGPD**: Suporte a exportação completa de dados locais em formato JSON estruturado e exclusão definitiva de conta com confirmação em duas etapas.

---

## 🧭 Próximas Etapas (Evolução Futura)

1. **Back-end Spring Boot**: Substituição transparente dos serviços simulados (`src/services/api/apiClient.ts`) pela API REST oficial em Spring Boot, com autenticação JWT, rate-limiting e criptografia no banco de dados.
2. **Integração Real de IA Generativa**: Conexão com API de IA no backend com moderação de conteúdo em tempo real e guardrails de segurança clínica adicionais.
3. **Notificações Push**: Configuração de serviço de push notifications no backend para envio dos lembretes diários personalizados.

---

*Desenvolvido com carinho e responsabilidade ética para apoiar o seu bem-estar diário.* 🌿
