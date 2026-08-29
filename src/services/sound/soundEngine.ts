import { Platform } from 'react-native';

export type SoundEffectType = 'chime' | 'inhale' | 'exhale' | 'bell' | 'complete' | 'click';
export type AmbienceType =
  | 'rain'
  | 'rain_window'
  | 'rain_roof'
  | 'waves'
  | 'stream'
  | 'waterfall'
  | 'forest_dawn'
  | 'forest_night'
  | 'birds'
  | 'fire'
  | 'wind_trees'
  | 'white_noise'
  | 'brown_noise'
  | 'pink_noise'
  | 'fan'
  | 'library'
  | 'none';

class SoundEngine {
  private audioContext: any = null;
  private masterGain: any = null;
  private ambienceGain: any = null;
  private ambienceSource: any = null;
  private currentAmbience: AmbienceType = 'none';

  private musicGain: any = null;
  private musicInterval: any = null;
  private isMusicPlaying: boolean = false;

  private isMuted: boolean = false;
  private masterVolume: number = 0.8;
  private ambienceVolume: number = 0.8;
  private musicVolume: number = 0.8;
  private voiceEnabled: boolean = true;

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

  public ensureRunning() {
    this.initContext();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
  }

  // --- CONTROLE DE MUTE & MESTRE ---

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopVoice();
    }

    if (this.masterGain && this.audioContext) {
      try {
        const now = this.audioContext.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(muted ? 0 : this.masterVolume, now);
      } catch (_e) {}
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
      } catch (_e) {}
    }
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setAmbienceVolume(vol: number) {
    this.ambienceVolume = Math.max(0, Math.min(1, vol));
    if (this.ambienceGain && this.audioContext) {
      try {
        const now = this.audioContext.currentTime;
        this.ambienceGain.gain.cancelScheduledValues(now);
        this.ambienceGain.gain.linearRampToValueAtTime(this.ambienceVolume, now + 0.05);
      } catch (_e) {}
    }
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.audioContext) {
      try {
        const now = this.audioContext.currentTime;
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.linearRampToValueAtTime(this.musicVolume, now + 0.05);
      } catch (_e) {}
    }
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

  public stopVoice() {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_e) {}
    }
  }

  public stopAll() {
    this.stopAmbience();
    this.stopCalmMusic();
    this.stopVoice();
  }

  // --- SÍNTESE DE EFEITOS SONOROS (CUES) ---

  public playCue(type: SoundEffectType) {
    if (this.isMuted || this.masterVolume === 0) return;
    this.ensureRunning();
    if (!this.audioContext || !this.masterGain) return;

    try {
      const now = this.audioContext.currentTime;

      if (type === 'chime' || type === 'bell' || type === 'complete') {
        const baseFreq = type === 'complete' ? 587.33 : type === 'bell' ? 432 : 528;
        const duration = type === 'complete' ? 2.5 : 1.8;

        const osc = this.audioContext.createOscillator();
        const oscHarmonic = this.audioContext.createOscillator();
        const cueGain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);

        oscHarmonic.type = 'sine';
        oscHarmonic.frequency.setValueAtTime(baseFreq * 2.02, now);

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

  // --- SÍNTESE DE PAISAGENS SONORAS AMBIENTES (16 TIPOS REAIS) ---

  public playAmbience(type: AmbienceType | string, volume: number = 0.8) {
    this.stopAmbience();

    if (type === 'none' || this.isMuted) {
      this.currentAmbience = 'none';
      return;
    }

    this.ensureRunning();
    if (!this.audioContext || !this.masterGain) return;

    try {
      this.currentAmbience = type as AmbienceType;
      this.ambienceVolume = volume;

      const sampleRate = this.audioContext.sampleRate || 44100;
      const bufferSize = sampleRate * 4; // 4 segundos de loop
      const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;

        if (type.includes('brown')) {
          b0 = (b0 + 0.02 * white) / 1.02;
          data[i] = b0 * 3.5;
        } else if (type.includes('pink')) {
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11;
        } else if (type.includes('white')) {
          data[i] = white * 0.15;
        } else if (type.includes('rain') || type.includes('water') || type.includes('stream')) {
          b0 = 0.96 * b0 + white * 0.08;
          b1 = 0.90 * b1 + white * 0.14;
          data[i] = (b0 + b1) * 0.4;
        } else if (type.includes('waves')) {
          b0 = 0.98 * b0 + white * 0.05;
          data[i] = b0 * 1.5;
        } else if (type.includes('fire')) {
          const crackle = Math.random() < 0.002 ? (Math.random() - 0.5) * 2.5 : 0;
          b0 = 0.97 * b0 + white * 0.06;
          data[i] = b0 * 0.8 + crackle;
        } else {
          b0 = 0.95 * b0 + white * 0.08;
          data[i] = b0 * 0.5;
        }
      }

      const noiseNode = this.audioContext.createBufferSource();
      noiseNode.buffer = buffer;
      noiseNode.loop = true;

      const filter = this.audioContext.createBiquadFilter();
      if (type.includes('rain')) {
        filter.type = 'bandpass';
        filter.frequency.value = 850;
        filter.Q.value = 1.2;
      } else if (type.includes('waves')) {
        filter.type = 'lowpass';
        filter.frequency.value = 420;
      } else if (type.includes('stream')) {
        filter.type = 'bandpass';
        filter.frequency.value = 1100;
      } else if (type.includes('fire')) {
        filter.type = 'lowpass';
        filter.frequency.value = 550;
      } else if (type.includes('fan')) {
        filter.type = 'lowpass';
        filter.frequency.value = 350;
      } else {
        filter.type = 'lowpass';
        filter.frequency.value = 800;
      }

      this.ambienceGain = this.audioContext.createGain();
      const now = this.audioContext.currentTime;
      this.ambienceGain.gain.setValueAtTime(0.001, now);
      this.ambienceGain.gain.linearRampToValueAtTime(this.ambienceVolume, now + 0.5);

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
        this.ambienceGain.gain.linearRampToValueAtTime(0.0001, now + 0.3);
      } catch (_e) {}
    }

    if (this.ambienceSource) {
      try {
        setTimeout(() => {
          if (this.ambienceSource) {
            this.ambienceSource.stop();
            this.ambienceSource.disconnect();
            this.ambienceSource = null;
          }
        }, 350);
      } catch (_e) {}
    }
    this.currentAmbience = 'none';
  }

  // --- SÍNTESE DE MÚSICA TRANQUILA AMBIENTE (PIANO / ACÚSTICO RELAXANTE) ---

  public playCalmMusic(volume: number = 0.8) {
    this.stopCalmMusic();
    this.ensureRunning();
    if (!this.audioContext || !this.masterGain) return;

    try {
      this.isMusicPlaying = true;
      this.musicVolume = volume;

      this.musicGain = this.audioContext.createGain();
      const now = this.audioContext.currentTime;
      this.musicGain.gain.setValueAtTime(0.001, now);
      this.musicGain.gain.linearRampToValueAtTime(this.musicVolume, now + 0.5);
      this.musicGain.connect(this.masterGain);

      const notes = [174.61, 196.00, 220.00, 261.63, 293.66, 349.23, 392.00, 440.00, 523.25];
      let noteIndex = 0;

      const playPianoTone = (freq: number) => {
        if (!this.isMusicPlaying || !this.audioContext || !this.musicGain) return;
        try {
          const t = this.audioContext.currentTime;
          const osc = this.audioContext.createOscillator();
          const oscHarm = this.audioContext.createOscillator();
          const noteGain = this.audioContext.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);

          oscHarm.type = 'triangle';
          oscHarm.frequency.setValueAtTime(freq * 2, t);

          noteGain.gain.setValueAtTime(0.001, t);
          noteGain.gain.linearRampToValueAtTime(0.22, t + 0.05);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);

          osc.connect(noteGain);
          oscHarm.connect(noteGain);
          noteGain.connect(this.musicGain);

          osc.start(t);
          oscHarm.start(t);
          osc.stop(t + 3.0);
          oscHarm.stop(t + 3.0);
        } catch (_e) {}
      };

      playPianoTone(notes[0]);
      playPianoTone(notes[3]);

      this.musicInterval = setInterval(() => {
        if (!this.isMusicPlaying) return;
        const n1 = notes[noteIndex % notes.length];
        const n2 = notes[(noteIndex + 3) % notes.length];
        playPianoTone(n1);
        playPianoTone(n2);
        noteIndex = (noteIndex + 1) % notes.length;
      }, 2000);
    } catch (e) {
      console.warn('[SoundEngine] Play calm music warning:', e);
    }
  }

  public stopCalmMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.musicGain && this.audioContext) {
      try {
        const now = this.audioContext.currentTime;
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.linearRampToValueAtTime(0.0001, now + 0.3);
      } catch (_e) {}
    }
  }
}

export const soundEngine = new SoundEngine();
