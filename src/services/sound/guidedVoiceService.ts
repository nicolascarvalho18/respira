import { Platform } from 'react-native';
import { logger } from '../../utils/logger';

export interface PracticePhaseScript {
  phase: 'intro' | 'inhale' | 'hold' | 'exhale' | 'hold_after_exhale' | 'step' | 'outro';
  text: string;
  durationSeconds?: number;
}

class GuidedVoiceService {
  private voiceVolume: number = 1.0;
  private isVoiceMuted: boolean = false;
  private ambientVolume: number = 0.35;
  private isAmbientMuted: boolean = false;
  private currentUtterance: any = null;
  private preferredVoice: any = null;
  private initialized: boolean = false;

  constructor() {
    this.initVoices();
  }

  private initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        // Priorizar vozes pt-BR femininas naturais
        const ptVoices = voices.filter((v) => v.lang.startsWith('pt'));
        const preferred =
          ptVoices.find(
            (v) =>
              v.name.toLowerCase().includes('luciana') ||
              v.name.toLowerCase().includes('leticia') ||
              v.name.toLowerCase().includes('maria') ||
              v.name.toLowerCase().includes('female') ||
              v.name.toLowerCase().includes('natural')
          ) ||
          ptVoices[0] ||
          null;

        this.preferredVoice = preferred;
        this.initialized = true;
      };

      loadVoice();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoice;
      }
    }
  }

  /**
   * Fala uma instrução suave de forma sincronizada com o exercício
   */
  speak(text: string, onEnd?: () => void, rate: number = 0.88): void {
    if (this.isVoiceMuted || this.voiceVolume === 0) {
      onEnd?.();
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = rate; // Ritmo calmo e compassado para relaxamento
        utterance.pitch = 0.98; // Tom natural e acolhedor
        utterance.volume = this.voiceVolume;

        if (this.preferredVoice) {
          utterance.voice = this.preferredVoice;
        }

        utterance.onend = () => {
          this.currentUtterance = null;
          onEnd?.();
        };

        utterance.onerror = (err) => {
          logger.warn('Speech synthesis notice:', err);
          this.currentUtterance = null;
          onEnd?.();
        };

        this.currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        logger.warn('Speech error:', err);
        onEnd?.();
      }
    } else {
      onEnd?.();
    }
  }

  cancel(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_e) {
        // Ignorado
      }
    }
    this.currentUtterance = null;
  }

  // Controles de Volume e Mixer
  setVoiceVolume(vol: number): void {
    this.voiceVolume = Math.max(0, Math.min(1, vol));
  }

  getVoiceVolume(): number {
    return this.voiceVolume;
  }

  setVoiceMuted(muted: boolean): void {
    this.isVoiceMuted = muted;
    if (muted) {
      this.cancel();
    }
  }

  getIsVoiceMuted(): boolean {
    return this.isVoiceMuted;
  }

  setAmbientVolume(vol: number): void {
    this.ambientVolume = Math.max(0, Math.min(1, vol));
  }

  getAmbientVolume(): number {
    return this.ambientVolume;
  }

  setAmbientMuted(muted: boolean): void {
    this.isAmbientMuted = muted;
  }

  getIsAmbientMuted(): boolean {
    return this.isAmbientMuted;
  }

  /**
   * Obtém roteiro de narração detalhado por prática
   */
  getNarrationScript(practiceId: string): PracticePhaseScript[] {
    switch (practiceId) {
      // 1. Respiração 4-7-8
      case 'practice-breathing-478':
        return [
          {
            phase: 'intro',
            text: 'Bem-vindo à Respiração 4-7-8. Acomode-se com a coluna ereta e os ombros relaxados. Coloque uma mão sobre o peito e a outra sobre a barriga.',
            durationSeconds: 12,
          },
          {
            phase: 'inhale',
            text: 'Inspire lentamente pelo nariz, sentindo o ar preencher o abdômen.',
            durationSeconds: 4,
          },
          {
            phase: 'hold',
            text: 'Segure o ar com calma, mantendo o corpo perfeitamente relaxado.',
            durationSeconds: 7,
          },
          {
            phase: 'exhale',
            text: 'Solte o ar devagar pela boca, liberando qualquer tensão.',
            durationSeconds: 8,
          },
          {
            phase: 'outro',
            text: 'Muito bem. Retorne suavemente à sua respiração natural e sinta a sensação de paz no seu corpo.',
            durationSeconds: 10,
          },
        ];

      // 2. Respiração Quadrada
      case 'practice-breathing-box':
        return [
          {
            phase: 'intro',
            text: 'Respiração Quadrada. Vamos acompanhar quatro tempos iguais de quatro segundos para recuperar o equilíbrio e a clareza.',
            durationSeconds: 10,
          },
          { phase: 'inhale', text: 'Inspire pelo nariz com suavidade: 1, 2, 3, 4.', durationSeconds: 4 },
          { phase: 'hold', text: 'Mantenha o ar nos pulmões com serenidade: 1, 2, 3, 4.', durationSeconds: 4 },
          { phase: 'exhale', text: 'Expire devagar de forma contínua: 1, 2, 3, 4.', durationSeconds: 4 },
          { phase: 'hold_after_exhale', text: 'Pausa tranquila com os pulmões vazios: 1, 2, 3, 4.', durationSeconds: 4 },
          { phase: 'outro', text: 'Excelente. Sinta o centramento e a estabilidade mental.', durationSeconds: 8 },
        ];

      // 3. Respiração Diafragmática
      case 'practice-breathing-diaphragmatic':
        return [
          {
            phase: 'intro',
            text: 'Respiração Diafragmática. Repouse uma mão no peito e a outra sobre a barriga.',
            durationSeconds: 10,
          },
          {
            phase: 'inhale',
            text: 'Inspire profundamente pelo nariz, fazendo apenas a mão da barriga subir suavemente.',
            durationSeconds: 4,
          },
          {
            phase: 'exhale',
            text: 'Expire devagar pela boca, sentindo o abdômen recolher sem mover o peito.',
            durationSeconds: 5,
          },
          {
            phase: 'outro',
            text: 'Muito bem. Esta respiração acalma o sistema nervoso de forma profunda.',
            durationSeconds: 8,
          },
        ];

      // 4. Coerência Cardíaca
      case 'practice-heart-coherence':
        return [
          {
            phase: 'intro',
            text: 'Coerência Cardíaca. Coloque a mão sobre o centro do peito e sinta o contato acolhedor.',
            durationSeconds: 10,
          },
          { phase: 'inhale', text: 'Inspire suavemente pelo nariz durante 5 segundos.', durationSeconds: 5 },
          { phase: 'exhale', text: 'Expire calmamente pela boca durante 5 segundos.', durationSeconds: 5 },
          { phase: 'outro', text: 'Sinta seus batimentos cardíacos entrarem em harmonia e serenidade.', durationSeconds: 8 },
        ];

      // 5. Expiração Prolongada
      case 'practice-breathing-extended-exhale':
        return [
          {
            phase: 'intro',
            text: 'Respiração com Expiração Prolongada. Vamos inspirar em 3 segundos e soltar o ar no dobro do tempo.',
            durationSeconds: 10,
          },
          { phase: 'inhale', text: 'Inspire pelo nariz: 1, 2, 3.', durationSeconds: 3 },
          { phase: 'exhale', text: 'Solte suavemente pela boca como se soprasse uma vela: 1, 2, 3, 4, 5, 6.', durationSeconds: 6 },
          { phase: 'outro', text: 'Perceba como seu corpo desacelera a cada ciclo.', durationSeconds: 8 },
        ];

      // 6. Ancoragem 5-4-3-2-1
      case 'practice-grounding-54321':
        return [
          {
            phase: 'intro',
            text: 'Técnica de Aterramento 5-4-3-2-1. Vamos usar os cinco sentidos para ancorar no presente.',
            durationSeconds: 10,
          },
          { phase: 'step', text: 'Observe 5 coisas que você pode ver ao seu redor com atenção aos detalhes.', durationSeconds: 15 },
          { phase: 'step', text: 'Sinta 4 texturas reais: a roupa, a cadeira, suas mãos ou a mesa.', durationSeconds: 15 },
          { phase: 'step', text: 'Identifique 3 sons presentes no ambiente, perto ou longe.', durationSeconds: 15 },
          { phase: 'step', text: 'Perceba 2 aromas sutis no ar.', durationSeconds: 12 },
          { phase: 'step', text: 'Diga internamente uma frase de gentileza: "Estou seguro, presente e em paz aqui agora."', durationSeconds: 12 },
          { phase: 'outro', text: 'Você está ancorado no presente. Respire com tranquilidade.', durationSeconds: 8 },
        ];

      // 7. Relaxamento Muscular Progressivo
      case 'practice-pmr-relaxation':
        return [
          {
            phase: 'intro',
            text: 'Relaxamento Muscular Progressivo. Vamos soltar as tensões acumuladas em cada região do corpo.',
            durationSeconds: 10,
          },
          { phase: 'step', text: 'Feche as mãos em punhos firmes por 5 segundos... e solte de uma vez, sentindo o alívio.', durationSeconds: 15 },
          { phase: 'step', text: 'Eleve os ombros suavemente em direção às orelhas... e solte todo o peso.', durationSeconds: 15 },
          { phase: 'step', text: 'Franza a testa e aperte os olhos com gentileza... e relaxe todos os músculos faciais.', durationSeconds: 15 },
          { phase: 'step', text: 'Contraia o abdômen suavemente... e solte deixando a respiração fluir.', durationSeconds: 15 },
          { phase: 'step', text: 'Tensione as pernas e aponte os pés... e relaxe completamente.', durationSeconds: 15 },
          { phase: 'outro', text: 'Sinta todo o seu corpo leve e descontraído.', durationSeconds: 8 },
        ];

      // Padrão Geral
      default:
        return [
          {
            phase: 'intro',
            text: 'Bem-vindo a esta prática guiada. Reserve este momento para cuidar de você com gentileza.',
            durationSeconds: 10,
          },
          {
            phase: 'inhale',
            text: 'Inspire profundamente, enchendo os pulmões de ar fresco.',
            durationSeconds: 4,
          },
          {
            phase: 'exhale',
            text: 'Expire devagar, liberando todo o cansaço.',
            durationSeconds: 5,
          },
          {
            phase: 'outro',
            text: 'Prática concluída com sucesso. Leve esta sensação de leveza para o seu dia.',
            durationSeconds: 8,
          },
        ];
    }
  }
}

export const guidedVoiceService = new GuidedVoiceService();
