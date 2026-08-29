import { Platform } from 'react-native';

export type SoundEffectType = 'chime' | 'inhale' | 'exhale' | 'bell' | 'complete' | 'click';

class SoundEngine {
  private audioContext: any = null;
  private masterGain: any = null;

  // Soundscape (Ambience) state
  private ambienceGain: any = null;
  private ambienceSource: any = null;
  private ambienceLFO: any = null;
  private ambienceInterval: any = null;
  private currentAmbience: string = 'none';

  // Music state
  private musicGain: any = null;
  private musicInterval: any = null;
  private isMusicPlaying: boolean = false;
  private currentMusicId: string = 'none';

  private isMuted: boolean = false;
  private masterVolume: number = 0.8;
  private ambienceVolume: number = 0.8;
  private musicVolume: number = 0.8;
  private voiceEnabled: boolean = true;

  constructor() {
    // Lazily initialized on first user interaction to satisfy browser autoplay policies
  }

  public initContext(): any {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;

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

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      return this.audioContext;
    } catch (e) {
      console.warn('[SoundEngine] Init warning:', e);
      return null;
    }
  }

  public ensureRunning() {
    this.initContext();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        this.audioContext.resume().catch(() => {});
      } catch (_e) {}
    }
  }

  // --- CONTROLE DE MUTE & VOLUME ---

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
        this.masterGain.gain.setValueAtTime(this.masterVolume, now);
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
        this.ambienceGain.gain.setValueAtTime(this.ambienceVolume, now);
      } catch (_e) {}
    }
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.audioContext) {
      try {
        const now = this.audioContext.currentTime;
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.setValueAtTime(this.musicVolume, now);
      } catch (_e) {}
    }
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
    if (!enabled) this.stopVoice();
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
    this.stopMusic();
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
      console.warn('[SoundEngine] Play cue error:', e);
    }
  }

  // --- SÍNTESE DE 16 PAISAGENS SONORAS PROCEDURAIS EXCLUSIVAS ---

  public playAmbience(soundId: string, volume: number = 0.8) {
    this.stopAmbience();

    if (soundId === 'none' || this.isMuted) {
      this.currentAmbience = 'none';
      return;
    }

    this.ensureRunning();
    if (!this.audioContext || !this.masterGain) return;

    try {
      this.currentAmbience = soundId;
      this.ambienceVolume = volume;

      const sampleRate = this.audioContext.sampleRate || 44100;
      const bufferSize = sampleRate * 3; // 3 segundos de loop suave
      const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);

      const type = soundId.toLowerCase();

      // Gerador de ruído acústico calibrado por tipo de ambiente
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;

        if (type.includes('brown')) {
          // Ruído Marrom puro (1/f^2)
          b0 = (b0 + 0.02 * white) / 1.02;
          data[i] = b0 * 3.5;
        } else if (type.includes('pink')) {
          // Ruído Rosa balanceado (1/f)
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.15;
        } else if (type.includes('white')) {
          // Ruído Branco
          data[i] = white * 0.18;
        } else if (type.includes('rain') || type.includes('waterfall') || type.includes('stream')) {
          // Chuva e Água
          b0 = 0.95 * b0 + white * 0.09;
          b1 = 0.88 * b1 + white * 0.15;
          data[i] = (b0 + b1) * 0.45;
        } else if (type.includes('waves')) {
          // Ondas
          b0 = 0.985 * b0 + white * 0.05;
          data[i] = b0 * 1.8;
        } else if (type.includes('fire')) {
          // Fogueira com estalos
          const crackle = Math.random() < 0.003 ? (Math.random() - 0.5) * 2.8 : 0;
          b0 = 0.97 * b0 + white * 0.06;
          data[i] = b0 * 0.75 + crackle;
        } else {
          // Vento, Floresta, Ventilador, Biblioteca
          b0 = 0.95 * b0 + white * 0.08;
          data[i] = b0 * 0.55;
        }
      }

      const noiseNode = this.audioContext.createBufferSource();
      noiseNode.buffer = buffer;
      noiseNode.loop = true;

      // Filtro de frequência dedicado
      const filter = this.audioContext.createBiquadFilter();
      if (type.includes('rain-window') || type.includes('window')) {
        filter.type = 'bandpass';
        filter.frequency.value = 1400;
        filter.Q.value = 1.5;
      } else if (type.includes('rain-roof') || type.includes('roof')) {
        filter.type = 'lowpass';
        filter.frequency.value = 500;
      } else if (type.includes('rain')) {
        filter.type = 'bandpass';
        filter.frequency.value = 950;
        filter.Q.value = 1.0;
      } else if (type.includes('waves')) {
        filter.type = 'lowpass';
        filter.frequency.value = 450;
      } else if (type.includes('stream')) {
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 0.8;
      } else if (type.includes('waterfall')) {
        filter.type = 'lowpass';
        filter.frequency.value = 650;
      } else if (type.includes('fire')) {
        filter.type = 'lowpass';
        filter.frequency.value = 550;
      } else if (type.includes('fan')) {
        filter.type = 'lowpass';
        filter.frequency.value = 350;
      } else if (type.includes('library')) {
        filter.type = 'lowpass';
        filter.frequency.value = 400;
      } else {
        filter.type = 'lowpass';
        filter.frequency.value = 750;
      }

      this.ambienceGain = this.audioContext.createGain();
      const now = this.audioContext.currentTime;
      this.ambienceGain.gain.setValueAtTime(this.ambienceVolume, now);

      noiseNode.connect(filter);
      filter.connect(this.ambienceGain);
      this.ambienceGain.connect(this.masterGain);

      noiseNode.start(now);
      this.ambienceSource = noiseNode;

      // Se for Ondas do Mar: modular maré com LFO
      if (type.includes('waves')) {
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 0.22; // 1 onda a cada ~4.5s
        lfoGain.gain.value = this.ambienceVolume * 0.45;

        lfo.connect(lfoGain);
        lfoGain.connect(this.ambienceGain.gain);
        lfo.start(now);
        this.ambienceLFO = lfo;
      }

      // Se for Floresta ou Pássaros: adicionar cantos de pássaros sutis periódicos
      if (type.includes('forest') || type.includes('bird')) {
        this.ambienceInterval = setInterval(() => {
          if (!this.ambienceGain || !this.audioContext) return;
          try {
            const t = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            const g = this.audioContext.createGain();
            osc.type = 'sine';
            const f1 = 2600 + Math.random() * 800;
            const f2 = 3400 + Math.random() * 600;
            osc.frequency.setValueAtTime(f1, t);
            osc.frequency.exponentialRampToValueAtTime(f2, t + 0.12);
            osc.frequency.exponentialRampToValueAtTime(f1, t + 0.25);

            g.gain.setValueAtTime(0.001, t);
            g.gain.linearRampToValueAtTime(0.08, t + 0.05);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

            osc.connect(g);
            g.connect(this.ambienceGain);
            osc.start(t);
            osc.stop(t + 0.3);
          } catch (_e) {}
        }, 3200);
      }
    } catch (e) {
      console.warn('[SoundEngine] Play ambience warning:', e);
    }
  }

  public stopAmbience() {
    if (this.ambienceInterval) {
      clearInterval(this.ambienceInterval);
      this.ambienceInterval = null;
    }
    if (this.ambienceLFO) {
      try {
        this.ambienceLFO.stop();
        this.ambienceLFO.disconnect();
        this.ambienceLFO = null;
      } catch (_e) {}
    }
    if (this.ambienceSource) {
      try {
        this.ambienceSource.stop();
        this.ambienceSource.disconnect();
        this.ambienceSource = null;
      } catch (_e) {}
    }
    this.currentAmbience = 'none';
  }

  // --- SÍNTESE DE 12 COMPOSIÇÕES MUSICAIS INSTRUMENTAIS TRANQUILAS ---

  public playMusic(trackId: string, volume: number = 0.8) {
    this.stopMusic();
    this.ensureRunning();
    if (!this.audioContext || !this.masterGain) return;

    try {
      this.isMusicPlaying = true;
      this.currentMusicId = trackId;
      this.musicVolume = volume;

      this.musicGain = this.audioContext.createGain();
      const now = this.audioContext.currentTime;
      this.musicGain.gain.setValueAtTime(this.musicVolume, now);
      this.musicGain.connect(this.masterGain);

      // Escalas harmônicas e notas exclusivas por faixa
      const scales: Record<string, number[]> = {
        'music-piano-dawn': [174.61, 220.0, 261.63, 329.63, 392.0, 523.25], // F Major Lyrical
        'music-quiet-night': [146.83, 174.61, 220.0, 261.63, 293.66, 349.23], // D Minor Ambient
        'music-serene-path': [130.81, 164.81, 196.0, 246.94, 261.63, 329.63], // C Major Serene
        'music-breath-pause': [196.0, 246.94, 293.66, 369.99, 392.0, 493.88], // G Major Breathe
        'music-morning-light': [220.0, 277.18, 329.63, 415.3, 440.0, 554.37], // A Major Morning
        'music-deep-reflection': [138.59, 164.81, 207.65, 246.94, 277.18, 329.63], // C# Minor Reflect
        'music-mental-silence': [116.54, 146.83, 174.61, 220.0, 233.08, 293.66], // Bb Major Silence
        'music-crystal-clarity': [164.81, 207.65, 246.94, 311.13, 329.63, 415.3], // E Major Crystal
        'music-night-rest': [103.83, 130.81, 155.56, 196.0, 207.65, 261.63], // Ab Major Lullaby
        'music-deep-peace': [132.0, 264.0, 396.0, 528.0, 660.0], // 528Hz Solfeggio Peace
        'music-gentle-breeze': [108.0, 216.0, 324.0, 432.0, 540.0], // 432Hz Healing Breeze
        'music-star-lullaby': [155.56, 196.0, 233.08, 293.66, 311.13, 392.0], // Eb Major Stars
      };

      const notes = scales[trackId] || scales['music-piano-dawn'];
      let noteStep = 0;

      const playPianoChord = (freq1: number, freq2: number) => {
        if (!this.isMusicPlaying || !this.audioContext || !this.musicGain) return;
        try {
          const t = this.audioContext.currentTime;

          // Nota 1
          const osc1 = this.audioContext.createOscillator();
          const osc1H = this.audioContext.createOscillator();
          const g1 = this.audioContext.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(freq1, t);

          osc1H.type = 'triangle';
          osc1H.frequency.setValueAtTime(freq1 * 2, t);

          g1.gain.setValueAtTime(0.001, t);
          g1.gain.linearRampToValueAtTime(0.25, t + 0.04);
          g1.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);

          osc1.connect(g1);
          osc1H.connect(g1);
          g1.connect(this.musicGain);

          osc1.start(t);
          osc1H.start(t);
          osc1.stop(t + 3.3);
          osc1H.stop(t + 3.3);

          // Nota 2 (harmonia suave)
          const osc2 = this.audioContext.createOscillator();
          const g2 = this.audioContext.createGain();

          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(freq2, t);

          g2.gain.setValueAtTime(0.001, t);
          g2.gain.linearRampToValueAtTime(0.18, t + 0.06);
          g2.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);

          osc2.connect(g2);
          g2.connect(this.musicGain);

          osc2.start(t);
          osc2.stop(t + 3.3);
        } catch (_e) {}
      };

      // Tocar primeiro acorde imediatamente
      playPianoChord(notes[0], notes[2]);

      // Tocar progressão melódica suave a cada 2.2 segundos
      this.musicInterval = setInterval(() => {
        if (!this.isMusicPlaying) return;
        const n1 = notes[noteStep % notes.length];
        const n2 = notes[(noteStep + 2) % notes.length];
        playPianoChord(n1, n2);
        noteStep = (noteStep + 1) % notes.length;
      }, 2200);
    } catch (e) {
      console.warn('[SoundEngine] Play music warning:', e);
    }
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    this.currentMusicId = 'none';
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.musicGain && this.audioContext) {
      try {
        const now = this.audioContext.currentTime;
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.setValueAtTime(0.0001, now);
        setTimeout(() => {
          if (this.musicGain) {
            this.musicGain.disconnect();
            this.musicGain = null;
          }
        }, 100);
      } catch (_e) {}
    }
  }

  public playCalmMusic(volume: number = 0.8) {
    this.playMusic('music-piano-dawn', volume);
  }

  public stopCalmMusic() {
    this.stopMusic();
  }
}

export const soundEngine = new SoundEngine();
