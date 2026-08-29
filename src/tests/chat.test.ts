import { chatService } from '../services/chat/chatService';
import { nluSemanticEngine } from '../services/ai/nluSemanticEngine';
import { aiAssistantService } from '../server/services/aiAssistantService';

describe('Chat Service & NLU Semantic Assistant Tests', () => {
  beforeEach(async () => {
    await chatService.clearHistory();
  });

  it('deve entender saudações e responder com acolhimento', async () => {
    const res = nluSemanticEngine.analyze('oi tudo bem');
    expect(res.intent).toBe('GREETING');
    expect(res.generatedResponse.length).toBeGreaterThan(10);
    expect(res.suggestions.length).toBeGreaterThanOrEqual(2);
  });

  it('deve normalizar gírias, abreviações e erros de português comuns', () => {
    const normalized = nluSemanticEngine.normalizeText('to ansioso e n consigo dormi oq eu faco');
    expect(normalized).toContain('estou ansioso');
    expect(normalized).toContain('não consigo dormir');
    expect(normalized).toContain('o que eu faco');
  });

  it('deve acionar protocolo de emergência (CVV 188) diante de risco explícito', async () => {
    const res = await aiAssistantService.generateResponse('estou pensando em suicidio socorro');
    expect(res.isEmergencyAlert).toBe(true);
    expect(res.text).toContain('188');
    expect(res.text).toContain('CVV');
    expect(res.actionText).toContain('188');
    expect(res.actionType).toBe('call_helpline');
  });

  it('deve entender quando o usuário diz que o dia foi difícil', async () => {
    const res = nluSemanticEngine.analyze('meu dia foi muito ruim e cansativo');
    expect(res.intent).toBe('DAY_WAS_HARD');
    expect(res.generatedResponse).toContain('pesado');
    expect(res.actionText).toBeDefined();
  });

  it('deve respeitar quando o usuário diz que não quer falar', async () => {
    const res = nluSemanticEngine.analyze('nao quero falar sobre isso');
    expect(res.intent).toBe('DONT_WANT_TO_TALK');
    expect(res.generatedResponse).toContain('Você não precisa explicar nada');
    expect(res.actionType).toBe('open_soundscape');
  });

  it('deve sugerir prática mais curta quando o usuário pede', async () => {
    const res = nluSemanticEngine.analyze('quero uma mais curta');
    expect(res.intent).toBe('REQUEST_SHORTER');
    expect(res.generatedResponse).toContain('Pausa Consciente');
    expect(res.actionType).toBe('open_practice');
  });

  it('deve recomendar respiração 4-7-8 para ansiedade ou taquicardia', async () => {
    const { assistantMessage } = await chatService.sendMessage(
      'meu coração tá rápido oq faço'
    );
    expect(assistantMessage.actionType).toBe('open_practice');
    expect(assistantMessage.text).toContain('Respiração 4–7–8');
  });

  it('deve recomendar práticas noturnas e sons para insônia', async () => {
    const { assistantMessage } = await chatService.sendMessage(
      'n consigo dormir de jeito nenhum'
    );
    expect(assistantMessage.text).toContain('Dormir');
    expect(assistantMessage.actionType).toBe('open_practice');
  });

  it('deve limpar dados pessoais (PII) antes de enviar para processamento', () => {
    const scrubbed = aiAssistantService.scrubPII(
      'Meu cpf é 123.456.789-00, telefone (11) 98765-4321 e email teste@exemplo.com'
    );
    expect(scrubbed).not.toContain('123.456.789-00');
    expect(scrubbed).not.toContain('98765-4321');
    expect(scrubbed).not.toContain('teste@exemplo.com');
    expect(scrubbed).toContain('[CPF REMOVIDO]');
    expect(scrubbed).toContain('[TELEFONE REMOVIDO]');
    expect(scrubbed).toContain('[E-MAIL REMOVIDO]');
  });
});
