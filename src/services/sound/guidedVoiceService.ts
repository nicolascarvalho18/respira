import { logger } from '../../utils/logger';

export interface PracticePhaseScript {
  phase: 'intro_1' | 'intro_2' | 'intro' | 'inhale' | 'hold' | 'exhale' | 'hold_after_exhale' | 'step' | 'outro';
  text: string;
  durationSeconds?: number;
}

class GuidedVoiceService {
  private voiceVolume: number = 1.0;
  private isVoiceMuted: boolean = false;
  private ambientVolume: number = 0.35;
  private isAmbientMuted: boolean = false;
  private voiceSpeedMultiplier: number = 1.0; // 0.75x, 1x, 1.25x
  private baseRate: number = 0.75; // Velocidade padrão calma, serena e pausada (0.75x)
  private basePitch: number = 0.92; // Tom sereno, suave e acolhedor (ligeiramente mais baixo)
  private currentUtterance: any = null;
  private preferredVoice: any = null;
  private isSpeaking: boolean = false;

  constructor() {
    this.initVoices();
  }

  private initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoice = () => {
        try {
          const voices = window.speechSynthesis.getVoices();
          if (!voices || voices.length === 0) return;

          // Filtrar vozes em português
          const ptVoices = voices.filter((v) => {
            const lang = (v.lang || '').replace('_', '-').toLowerCase();
            return lang.startsWith('pt');
          });

          if (ptVoices.length === 0) {
            this.preferredVoice = null;
            return;
          }

          // Sistema de pontuação para escolher a voz mais natural, serena e feminina
          const scoreVoice = (v: any): number => {
            const name = (v.name || '').toLowerCase();
            const lang = (v.lang || '').replace('_', '-').toLowerCase();
            let score = 0;

            // Priorizar pt-BR sobre pt-PT
            if (lang === 'pt-br') score += 50;

            // Vozes neurais / naturais de alta qualidade
            if (name.includes('natural') || name.includes('online') || name.includes('neural')) score += 100;
            if (name.includes('francisca')) score += 90;
            if (name.includes('google')) score += 70;
            if (name.includes('luciana') || name.includes('joana') || name.includes('leticia') || name.includes('heloisa')) score += 60;
            if (name.includes('maria') || name.includes('vitoria') || name.includes('fernanda')) score += 50;
            if (name.includes('female') || name.includes('feminina')) score += 30;

            // Penalizar vozes reconhecidamente robóticas ou masculinas para a narração feminina
            if (name.includes('ricardo') || name.includes('daniel') || name.includes('male') || name.includes('masculino')) {
              score -= 100;
            }

            return score;
          };

          const sorted = [...ptVoices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
          this.preferredVoice = sorted[0] || null;
        } catch (_err) {
          // Ignorado
        }
      };

      loadVoice();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoice;
      }
    }
  }

  /**
   * Fala uma orientação com voz serena, ritmo lento e dicção natural.
   * Não acelera palavras, fala no início e deixa silêncio para a respiração.
   */
  speak(text: string, onEnd?: () => void, customRateMultiplier?: number): void {
    if (this.isVoiceMuted || this.voiceVolume === 0 || !text || text.trim().length === 0) {
      onEnd?.();
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        // Interrompe fala anterior imediatamente para evitar qualquer sobreposição
        window.speechSynthesis.cancel();
        this.isSpeaking = false;

        const rateMultiplier = customRateMultiplier ?? this.voiceSpeedMultiplier;
        // Velocidade estritamente calibrada entre 0.70x e 0.85x para máximo relaxamento
        const finalRate = Math.max(0.68, Math.min(1.0, this.baseRate * rateMultiplier));

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = finalRate;   // 0.75x: ritmo lento e constante
        utterance.pitch = this.basePitch; // 0.92: tom sereno e acolhedor
        utterance.volume = this.voiceVolume;

        if (this.preferredVoice) {
          utterance.voice = this.preferredVoice;
        }

        utterance.onstart = () => {
          this.isSpeaking = true;
        };

        utterance.onend = () => {
          this.isSpeaking = false;
          this.currentUtterance = null;
          onEnd?.();
        };

        utterance.onerror = (err) => {
          logger.warn('Speech notification:', err);
          this.isSpeaking = false;
          this.currentUtterance = null;
          onEnd?.();
        };

        this.currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        logger.warn('Speech error:', err);
        this.isSpeaking = false;
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
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  // Controles de Velocidade (0.75x, 1x, 1.25x)
  setVoiceSpeedMultiplier(multiplier: number): void {
    this.voiceSpeedMultiplier = Math.max(0.75, Math.min(1.25, multiplier));
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
   * Roteiro calibrado com ritmo sereno e pausas para todas as práticas
   */
  getNarrationScript(practiceId: string): PracticePhaseScript[] {
    switch (practiceId) {
      // 1. Respiração Guiada Padrão (4s Inhale, 2s Hold, 6s Exhale, 2s Pause)
      default:
      case 'practice-breathing-guided':
      case 'practice-breathing-extended-exhale':
      case 'practice-breathing-diaphragmatic':
        return [
          {
            phase: 'intro_1',
            text: 'Encontre uma posição confortável.',
            durationSeconds: 4,
          },
          {
            phase: 'intro_2',
            text: 'Quando estiver pronto... acompanhe no seu próprio ritmo.',
            durationSeconds: 4,
          },
          {
            phase: 'inhale',
            text: 'Inspire suavemente pelo nariz.',
            durationSeconds: 4,
          },
          {
            phase: 'hold',
            text: 'Segure com calma.',
            durationSeconds: 2,
          },
          {
            phase: 'exhale',
            text: 'Agora... solte o ar devagar, sem forçar.',
            durationSeconds: 6,
          },
          {
            phase: 'hold_after_exhale',
            text: '', // 2 segundos de pausa silenciosa
            durationSeconds: 2,
          },
          {
            phase: 'outro',
            text: 'Muito bem... Sinta o seu corpo calmo e relaxado.',
            durationSeconds: 6,
          },
        ];

      // 2. Respiração 4-7-8
      case 'practice-breathing-478':
        return [
          {
            phase: 'intro_1',
            text: 'Encontre uma posição confortável.',
            durationSeconds: 4,
          },
          {
            phase: 'intro_2',
            text: 'Quando estiver pronto... acompanhe com calma.',
            durationSeconds: 4,
          },
          {
            phase: 'inhale',
            text: 'Inspire suavemente pelo nariz.',
            durationSeconds: 4,
          },
          {
            phase: 'hold',
            text: 'Segure o ar com calma.',
            durationSeconds: 7,
          },
          {
            phase: 'exhale',
            text: 'Agora... solte o ar devagar, sem forçar.',
            durationSeconds: 8,
          },
          {
            phase: 'outro',
            text: 'Muito bem... Sinta a sensação de paz em seu corpo.',
            durationSeconds: 6,
          },
        ];

      // 3. Respiração Quadrada
      case 'practice-breathing-box':
        return [
          {
            phase: 'intro_1',
            text: 'Encontre uma posição confortável.',
            durationSeconds: 4,
          },
          {
            phase: 'intro_2',
            text: 'Acompanhe os quatro tempos com serenidade.',
            durationSeconds: 4,
          },
          { phase: 'inhale', text: 'Inspire suavemente pelo nariz.', durationSeconds: 4 },
          { phase: 'hold', text: 'Segure com calma.', durationSeconds: 4 },
          { phase: 'exhale', text: 'Agora... solte o ar devagar.', durationSeconds: 4 },
          { phase: 'hold_after_exhale', text: '', durationSeconds: 4 },
          { phase: 'outro', text: 'Excelente... Sinta a estabilidade e a calma.', durationSeconds: 6 },
        ];

      // 4. Aterramento 5-4-3-2-1
      case 'practice-grounding-54321':
        return [
          { phase: 'intro', text: 'Encontre uma posição confortável... Vamos voltar a atenção para o momento presente.', durationSeconds: 8 },
          { phase: 'step', text: 'Observe com calma 5 coisas que você pode ver ao seu redor.', durationSeconds: 30 },
          { phase: 'step', text: 'Perceba 4 coisas que você pode tocar agora.', durationSeconds: 30 },
          { phase: 'step', text: 'Note 3 sons suaves que você consegue escutar.', durationSeconds: 30 },
          { phase: 'step', text: 'Identifique 2 aromas ou sensações no ar.', durationSeconds: 30 },
          { phase: 'step', text: 'Reconheça 1 sentimento que você acolhe com carinho.', durationSeconds: 30 },
          { phase: 'outro', text: 'Muito bem... Você está no momento presente, em tranquilidade e segurança.', durationSeconds: 8 },
        ];

      // 5. Relaxamento Muscular Progressivo
      case 'practice-pmr-relaxation':
        return [
          { phase: 'intro', text: 'Encontre uma posição confortável e feche suavemente os olhos.', durationSeconds: 8 },
          { phase: 'step', text: 'Feche suavemente os punhos por alguns segundos... e agora, solte completamente.', durationSeconds: 30 },
          { phase: 'step', text: 'Eleve os ombros suavemente... e solte, sentindo todo o peso se dissolver.', durationSeconds: 30 },
          { phase: 'step', text: 'Relaxe todos os músculos da face e da mandíbula.', durationSeconds: 30 },
          { phase: 'outro', text: 'Muito bem... Sinta o alívio e a leveza espalhados por todo o seu corpo.', durationSeconds: 8 },
        ];
    }
  }
}

export const guidedVoiceService = new GuidedVoiceService();
