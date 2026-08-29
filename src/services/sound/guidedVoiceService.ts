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
  private voiceSpeedMultiplier: number = 1.0; // 0.75x, 1x, 1.25x
  private baseRate: number = 0.80; // Velocidade padrão suave e relaxante
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
        const ptVoices = voices.filter(
          (v) => v.lang.startsWith('pt') || v.lang.includes('PT') || v.lang.includes('BR')
        );

        const preferred =
          ptVoices.find(
            (v) =>
              v.name.toLowerCase().includes('luciana') ||
              v.name.toLowerCase().includes('leticia') ||
              v.name.toLowerCase().includes('francisca') ||
              v.name.toLowerCase().includes('vitoria') ||
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
   * Fala uma instrução suave de forma sincronizada com o exercício.
   * Não acelera palavras e fala apenas a instrução inicial, deixando silêncio.
   */
  speak(text: string, onEnd?: () => void, customRateMultiplier?: number): void {
    if (this.isVoiceMuted || this.voiceVolume === 0 || !text || text.trim().length === 0) {
      onEnd?.();
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        // Interromper qualquer fala anterior para não sobrepor
        window.speechSynthesis.cancel();

        const rateMultiplier = customRateMultiplier ?? this.voiceSpeedMultiplier;
        const finalRate = Math.max(0.65, Math.min(1.2, this.baseRate * rateMultiplier));

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = finalRate; // Ritmo compassado e acolhedor (0.75x a 0.85x)
        utterance.pitch = 0.96;     // Tom suave, calmo e ligeiramente mais baixo
        utterance.volume = this.voiceVolume;

        if (this.preferredVoice) {
          utterance.voice = this.preferredVoice;
        }

        utterance.onend = () => {
          this.currentUtterance = null;
          onEnd?.();
        };

        utterance.onerror = (err) => {
          logger.warn('Speech synthesis notification:', err);
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

  // Controles de Velocidade de Voz (0.75x, 1x, 1.25x)
  setVoiceSpeedMultiplier(multiplier: number): void {
    this.voiceSpeedMultiplier = Math.max(0.75, Math.min(1.5, multiplier));
  }

  getVoiceSpeedMultiplier(): number {
    return this.voiceSpeedMultiplier;
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
   * Obtém o roteiro de narração calibrado para cada prática
   */
  getNarrationScript(practiceId: string): PracticePhaseScript[] {
    switch (practiceId) {
      // 1. Prática Geral / Respiração Guiada Padrão (4s Inhale, 2s Hold, 6s Exhale, 2s Pause)
      default:
      case 'practice-breathing-guided':
      case 'practice-breathing-extended-exhale':
      case 'practice-breathing-diaphragmatic':
        return [
          {
            phase: 'intro',
            text: 'Encontre uma posição confortável e relaxe os ombros.',
            durationSeconds: 3,
          },
          {
            phase: 'inhale',
            text: 'Inspire lentamente pelo nariz.',
            durationSeconds: 4,
          },
          {
            phase: 'hold',
            text: 'Segure suavemente.',
            durationSeconds: 2,
          },
          {
            phase: 'exhale',
            text: 'Agora, solte o ar devagar pela boca.',
            durationSeconds: 6,
          },
          {
            phase: 'hold_after_exhale',
            text: '', // 2 segundos de silêncio
            durationSeconds: 2,
          },
          {
            phase: 'outro',
            text: 'Muito bem. Sinta a sensação de tranquilidade em seu corpo.',
            durationSeconds: 6,
          },
        ];

      // 2. Respiração 4-7-8
      case 'practice-breathing-478':
        return [
          {
            phase: 'intro',
            text: 'Encontre uma postura confortável e relaxe os ombros.',
            durationSeconds: 4,
          },
          {
            phase: 'inhale',
            text: 'Inspire lentamente pelo nariz.',
            durationSeconds: 4,
          },
          {
            phase: 'hold',
            text: 'Segure o ar com calma.',
            durationSeconds: 7,
          },
          {
            phase: 'exhale',
            text: 'Solte o ar devagar pela boca.',
            durationSeconds: 8,
          },
          {
            phase: 'outro',
            text: 'Muito bem. Retorne ao seu ritmo natural.',
            durationSeconds: 6,
          },
        ];

      // 3. Respiração Quadrada
      case 'practice-breathing-box':
        return [
          {
            phase: 'intro',
            text: 'Acompanhe os quatro tempos iguais com serenidade.',
            durationSeconds: 4,
          },
          { phase: 'inhale', text: 'Inspire suavemente pelo nariz.', durationSeconds: 4 },
          { phase: 'hold', text: 'Segure o ar.', durationSeconds: 4 },
          { phase: 'exhale', text: 'Solte o ar devagar.', durationSeconds: 4 },
          { phase: 'hold_after_exhale', text: 'Pausa suave.', durationSeconds: 4 },
          { phase: 'outro', text: 'Excelente. Sinta a estabilidade mental.', durationSeconds: 6 },
        ];

      // 4. Aterramento 5-4-3-2-1
      case 'practice-grounding-54321':
        return [
          { phase: 'intro', text: 'Vamos voltar a atenção para o momento presente.', durationSeconds: 8 },
          { phase: 'step', text: 'Observe 5 coisas que você pode ver ao seu redor.', durationSeconds: 30 },
          { phase: 'step', text: 'Perceba 4 coisas que você pode tocar agora.', durationSeconds: 30 },
          { phase: 'step', text: 'Note 3 sons que você consegue escutar.', durationSeconds: 30 },
          { phase: 'step', text: 'Identifique 2 aromas ou sensações de tato no ar.', durationSeconds: 30 },
          { phase: 'step', text: 'Reconheça 1 emoção ou sentimento que você acolhe em si.', durationSeconds: 30 },
          { phase: 'outro', text: 'Você está no presente, em segurança.', durationSeconds: 10 },
        ];

      // 5. Relaxamento Muscular Progressivo
      case 'practice-pmr-relaxation':
        return [
          { phase: 'intro', text: 'Vamos relaxar as principais tensões musculares do corpo.', durationSeconds: 10 },
          { phase: 'step', text: 'Feche suavemente os punhos por alguns segundos... e agora solte completamente.', durationSeconds: 30 },
          { phase: 'step', text: 'Eleve os ombros em direção às orelhas... e solte, sentindo o peso aliviar.', durationSeconds: 30 },
          { phase: 'step', text: 'Solte os músculos da face e da mandíbula, deixando a boca entreaberta.', durationSeconds: 30 },
          { phase: 'outro', text: 'Sinta o alívio e a leveza espalhados por todo o seu corpo.', durationSeconds: 10 },
        ];
    }
  }
}

export const guidedVoiceService = new GuidedVoiceService();
