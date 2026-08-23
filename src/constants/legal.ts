export const LEGAL_TEXTS = {
  APP_NAME: 'Respira',
  MEDICAL_DISCLAIMER:
    'O Respira é uma ferramenta de apoio ao bem-estar e autoconhecimento. O aplicativo NÃO realiza diagnósticos clínicos, NÃO prescreve tratamentos ou medicamentos e NÃO substitui o acompanhamento de médicos, psicólogos ou psiquiatras. Em caso de sofrimento intenso ou emergência, procure um serviço de saúde ou ligue 188 (CVV).',

  TERMS_OF_USE: `Termos de Uso do Aplicativo Respira

1. Finalidade do Serviço
O Respira tem finalidade exclusivamente educativa e de suporte ao autocuidado e manejo do estresse e da ansiedade cotidiana. Não constituímos serviço médico ou de psicologia clínica.

2. Responsabilidades do Usuário
Você é responsável por manter a confidencialidade de seus dados de acesso e por utilizar o aplicativo como um recurso complementar, buscando profissionais de saúde qualificados sempre que necessário.

3. Restrições e Limitações
O aplicativo não deve ser utilizado em situações de emergência de saúde ou crises psiquiátricas agudas. Para tais casos, contate imediatamente o SAMU (192), CVV (188) ou o serviço de emergência de sua região.

4. Atualizações dos Termos
Estes termos podem ser atualizados para refletir melhorias no serviço ou exigências legais. Você será notificado sobre mudanças substanciais.`,

  PRIVACY_POLICY: `Política de Privacidade e Proteção de Dados

1. Dados Coletados
- Dados de Conta: Nome e e-mail para autenticação.
- Registros de Bem-estar: Registros de humor, nível de ansiedade selecionado, emoções e anotações pessoais.
- Preferências: Configurações de tema, notificações e acessibilidade.

2. Armazenamento e Segurança
Seus registros de diário e conversas são protegidos com sigilo. No protótipo atual, os dados ficam armazenados localmente no seu dispositivo. Credenciais sensíveis utilizam armazenamento seguro criptografado (SecureStore).

3. Não Compartilhamento
Nenhum registro confidencial do seu diário pessoal ou diálogo educativo é vendido ou compartilhado com terceiros para fins publicitários.

4. Seus Direitos
Você possui total controle sobre suas informações, podendo exportar todos os seus dados a qualquer momento ou solicitar a exclusão definitiva da sua conta e de todos os registros armazenados.`,

  CONSENT_ITEMS: [
    {
      id: 'terms',
      title: 'Termos de Uso e Condições Gerais',
      description: 'Concordo com os Termos de Uso e reconheço que o aplicativo não substitui atendimento profissional.',
      required: true,
    },
    {
      id: 'privacy',
      title: 'Política de Privacidade',
      description: 'Autorizo o processamento dos meus registros de bem-estar para funcionamento do diário e evolução.',
      required: true,
    },
    {
      id: 'personalization',
      title: 'Recomendações Personalizadas',
      description: 'Permitir que o aplicativo sugira práticas e artigos com base nos meus registros de humor recentes.',
      required: false,
    },
    {
      id: 'analytics',
      title: 'Melhoria Contínua Anônima',
      description: 'Compartilhar dados anônimos de uso para aprimoramento da estabilidade e recursos do aplicativo.',
      required: false,
    },
  ],
};
