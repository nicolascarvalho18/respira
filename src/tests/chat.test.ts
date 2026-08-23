import { chatService } from '../services/chat/chatService';

describe('Chat Service and Safety Guardrails Tests', () => {
  beforeEach(async () => {
    await chatService.clearHistory();
  });

  it('should trigger emergency protocol and alert when high distress keywords are detected', async () => {
    const { assistantMessage } = await chatService.sendMessage(
      'Estou desesperado e pensando em suicidio socorro'
    );

    expect(assistantMessage.isEmergencyAlert).toBe(true);
    expect(assistantMessage.text).toContain('188'); // CVV
    expect(assistantMessage.text).toContain('CVV');
  });

  it('should recommend breathing practice when cardiac/rapid heart rate keywords are sent', async () => {
    const { assistantMessage } = await chatService.sendMessage(
      'Meu coracao esta muito acelerado e sinto palpitacao no peito'
    );

    expect(assistantMessage.recommendedPracticeId).toBe('practice-breathing-478');
    expect(assistantMessage.text.toLowerCase()).toContain('respiração');
  });

  it('should provide sleep psychoeducation when insomnia questions are asked', async () => {
    const { assistantMessage } = await chatService.sendMessage(
      'Nao consigo dormir na cama, tenho muita insonia'
    );

    expect(assistantMessage.recommendedArticleId).toBe('article-sleep-and-stress');
  });

  it('should maintain educational boundaries without claiming clinical medical diagnosis', async () => {
    const { assistantMessage } = await chatService.sendMessage(
      'Qual e o diagnostico para meus sintomas?'
    );

    // Deve sugerir profissionais e não diagnosticar
    expect(assistantMessage.text).not.toContain('Você tem o transtorno');
    expect(assistantMessage.text).toContain('psicólogo');
  });
});
