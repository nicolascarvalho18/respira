import { Platform } from 'react-native';

export class AudioGuideService {
  private voiceVolume = 0.8;
  private ambienceVolume = 0.5;
  private isVoiceEnabled = true;

  setVoiceVolume(vol: number) {
    this.voiceVolume = Math.max(0, Math.min(1, vol));
  }

  getVoiceVolume(): number {
    return this.voiceVolume;
  }

  setAmbienceVolume(vol: number) {
    this.ambienceVolume = Math.max(0, Math.min(1, vol));
  }

  getAmbienceVolume(): number {
    return this.ambienceVolume;
  }

  setVoiceEnabled(enabled: boolean) {
    this.isVoiceEnabled = enabled;
    if (!enabled) {
      this.stopVoice();
    }
  }

  getVoiceEnabled(): boolean {
    return this.isVoiceEnabled;
  }

  speakGuidance(text: string) {
    if (!this.isVoiceEnabled || this.voiceVolume === 0) return;

    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.88; // Gentle calm pace
        utterance.pitch = 0.95; // Warm soothing pitch
        utterance.volume = this.voiceVolume;

        // Pick high quality Portuguese voice if available
        const voices = window.speechSynthesis.getVoices();
        const ptVoice = voices.find(
          (v) => v.lang.startsWith('pt') && (v.name.includes('Natural') || v.name.includes('Luciana') || v.name.includes('Google'))
        ) || voices.find((v) => v.lang.startsWith('pt'));

        if (ptVoice) {
          utterance.voice = ptVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('[AudioGuide] Web speech warning:', err);
      }
    }
  }

  stopVoice() {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_err) {
        // Speech cancellation handled safely
      }
    }
  }
}

export const audioGuideService = new AudioGuideService();
