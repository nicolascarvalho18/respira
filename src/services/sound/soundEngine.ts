import { Platform } from 'react-native';

export type SoundEffectType = 'chime' | 'inhale' | 'exhale' | 'bell' | 'complete' | 'click';
export type AmbienceType = 'waves' | 'rain' | 'forest' | 'brown_noise' | 'none';

class SoundEngine {
  private audioContext: any = null;
  private masterGain: any = null;
  private ambienceGain: any = null;
  private ambienceSource: any = null;
  private currentAmbience: AmbienceType = 'none';

  private isMuted: boolean = false;
  private masterVolume: number = 0.8;
  private ambienceVolume: number = 0.4;
  private voiceEnabled: boolean = true;
  private isVoiceMuted: boolean = false;

  constructor() {
    this.initContext();
  }

  private initContext() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioCtx();
      }

      if (!this.masterGain && this.audioContext) {
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.setValueAtTime(
          this.isMuted ? 0 : this.masterVolume,
          this.audioContext.currentTime
        );
        this.masterGain.connect(this.audioContext.destination);
      }
    } catch (e) {
      console.warn('[SoundEngine] Could not initialize Web Audio Context:', e);
    }
  }

  private ensureRunning() {
    this.initContext();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {
        // AudioContext resume handled safely
      });
    }
  }

  // --- CONTROLE MASTER & MUTE ---

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.isVoiceMuted = muted;

    if (muted) {
      this.stopVoice();
    }

    if (this.masterGain && this.audioContext) {
      try {
        const now = this.audioContext.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(muted ? 0 : this.masterVolume, now);
      } catch (_e) {
        // Master gain update handled safely
      }
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (!this.isMuted && this.masterGain && this.audioContext) {
      try {
        const now = this.audioContext.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.linearRampToValueAtTime(this.masterVolume, now + 0.05);
      } catch (_e) {
        // Master volume ramp handled safely
      }
    }
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
    if (!enabled) {
      this.stopVoice();
    }
  }

  public getVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  // --- SÍNTESE DE EFEITOS SONOROS SUAVES (SEM CHIADOS OU ESTALOS) ---

  public playCue(type: SoundEffectType) {
    if (this.isMuted || this.masterVolume === 0) return;
    this.ensureRunning();
    if (!this.audioContext || !this.masterGain) return;

    try {
      const now = this.audioContext.currentTime;

      if (type === 'chime' || type === 'bell' || type === 'complete') {
        // Sino Zen Tibetano em 528Hz / 432Hz com harmônicos puros e decaimento exponencial
        const baseFreq = type === 'complete' ? 587.33 : type === 'bell' ? 432 : 528;
        const duration = type === 'complete' ? 2.5 : 1.8;

        const osc = this.audioContext.createOscillator();
        const oscHarmonic = this.audioContext.createOscillator();
        const cueGain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);

        oscHarmonic.type = 'sine';
        oscHarmonic.frequency.setValueAtTime(baseFreq * 2.02, now); // Harmônico suave

        // Fade in de 20ms e fade out exponencial suave sem estalos
        cueGain.gain.setValueAtTime(0.0001, now);
        cueGain.gain.linearRampToValueAtTime(0.35, now + 0.02);
        cueGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(cueGain);
        oscHarmonic.connect(cueGain);
        cueGain.connect(this.masterGain);

        osc.start(now);
        oscHarmonic.start(now);
        osc.stop(now + duration + 0.1);
        oscHarmonic.stop(now + duration + 0.1);
      } else if (type === 'inhale') {
        // Tom suave ascendente de inspiração (220Hz -> 330Hz)
        const osc = this.audioContext.createOscillator();
        const cueGain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(330, now + 1.2);

        cueGain.gain.setValueAtTime(0.0001, now);
        cueGain.gain.linearRampToValueAtTime(0.18, now + 0.3);
        cueGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(cueGain);
        cueGain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 1.25);
      } else if (type === 'exhale') {
        // Tom suave descendente de expiração (330Hz -> 200Hz)
        const osc = this.audioContext.createOscillator();
        const cueGain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(196, now + 1.4);

        cueGain.gain.setValueAtTime(0.0001, now);
        cueGain.gain.linearRampToValueAtTime(0.18, now + 0.3);
        cueGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

        osc.connect(cueGain);
        cueGain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 1.45);
      } else if (type === 'click') {
        const osc = this.audioContext.createOscillator();
        const cueGain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);

        cueGain.gain.setValueAtTime(0.08, now);
        cueGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

        osc.connect(cueGain);
        cueGain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.06);
      }
    } catch (e) {
      console.warn('[SoundEngine] Play cue warning:', e);
    }
  }

  // --- AMBIÊNCIA SONORA CONTÍNUA SUAVE (WAVES / RAIN / FOREST) ---

  public playAmbience(type: AmbienceType, volume: number = 0.4) {
    if (this.currentAmbience === type && this.ambienceSource) return;
    this.stopAmbience();

    if (type === 'none' || this.isMuted) {
      this.currentAmbience = type;
      return;
    }

    this.ensureRunning();
    if (!this.audioContext || !this.masterGain) return;

    try {
      this.currentAmbience = type;
      this.ambienceVolume = volume;

      const sampleRate = this.audioContext.sampleRate || 44100;
      const bufferSize = sampleRate * 3; // 3 segundos de loop suave
      const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);

      // Gerador calibrado sem DC offset para evitar estalos
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = (Math.random() * 2 - 1) * 0.15;
        // Filtro passa-baixa Brown/Pink suave
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.96 * b1 + white * 0.11;
        b2 = 0.86 * b2 + white * 0.25;
        data[i] = (b0 + b1 + b2) * 0.5;
      }

      const noiseNode = this.audioContext.createBufferSource();
      noiseNode.buffer = buffer;
      noiseNode.loop = true;

      // Filtro ressonante suave
      const filter = this.audioContext.createBiquadFilter();
      filter.type = type === 'rain' ? 'bandpass' : 'lowpass';
      filter.frequency.value = type === 'rain' ? 900 : type === 'waves' ? 380 : 500;
      filter.Q.value = 1.0;

      // Ganho com fade-in suave de 300ms
      const now = this.audioContext.currentTime;
      this.ambienceGain = this.audioContext.createGain();
      this.ambienceGain.gain.setValueAtTime(0.0001, now);
      this.ambienceGain.gain.linearRampToValueAtTime(
        this.isMuted ? 0 : volume * 0.35,
        now + 0.3
      );

      noiseNode.connect(filter);
      filter.connect(this.ambienceGain);
      this.ambienceGain.connect(this.masterGain);

      noiseNode.start(now);
      this.ambienceSource = noiseNode;
    } catch (e) {
      console.warn('[SoundEngine] Play ambience warning:', e);
    }
  }

  public stopAmbience() {
    if (this.ambienceGain && this.audioContext) {
      try {
        const now = this.audioContext.currentTime;
        this.ambienceGain.gain.cancelScheduledValues(now);
        this.ambienceGain.gain.linearRampToValueAtTime(0.0001, now + 0.15);

        const currentSource = this.ambienceSource;
        setTimeout(() => {
          if (currentSource) {
            try {
              currentSource.stop();
              currentSource.disconnect();
            } catch (_e) {
              // Ambience stop handled safely
            }
          }
        }, 180);
      } catch (_e) {
        // Gain ramp handled safely
      }
    } else if (this.ambienceSource) {
      try {
        this.ambienceSource.stop();
        this.ambienceSource.disconnect();
      } catch (_e) {
        // Source stop handled safely
      }
    }

    this.ambienceSource = null;
    this.ambienceGain = null;
    this.currentAmbience = 'none';
  }

  // --- SÍNTESE DE VOZ GUIADA INTEGRADA ---

  public speak(text: string) {
    if (this.isMuted || this.isVoiceMuted || !this.voiceEnabled || this.masterVolume === 0) {
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.88; // Ritmo calmo e acolhedor
        utterance.pitch = 0.95;
        utterance.volume = this.isMuted ? 0 : this.masterVolume;

        const voices = window.speechSynthesis.getVoices();
        const ptVoice =
          voices.find(
            (v) =>
              v.lang.startsWith('pt') &&
              (v.name.includes('Natural') || v.name.includes('Luciana') || v.name.includes('Google'))
          ) || voices.find((v) => v.lang.startsWith('pt'));

        if (ptVoice) {
          utterance.voice = ptVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('[SoundEngine] Speech synthesis warning:', err);
      }
    }
  }

  public stopVoice() {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_err) {
        // Speech cancel handled safely
      }
    }
  }

  // --- LIMPEZA GERAL E PARADA ATÔMICA ---

  public stopAll() {
    this.stopVoice();
    this.stopAmbience();

    if (this.masterGain && this.audioContext) {
      try {
        const now = this.audioContext.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, now);
      } catch (_e) {
        // Stop all master gain reset handled safely
      }
    }
  }
}

export const soundEngine = new SoundEngine();
