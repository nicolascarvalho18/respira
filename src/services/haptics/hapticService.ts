import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

class HapticService {
  private isEnabled = true;

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  getEnabled(): boolean {
    return this.isEnabled;
  }

  async triggerInhale() {
    if (!this.isEnabled || Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_err) {
      // Ignored for environments without haptic support
    }
  }

  async triggerHold() {
    if (!this.isEnabled || Platform.OS === 'web') return;
    try {
      await Haptics.selectionAsync();
    } catch (_err) {
      // Ignored
    }
  }

  async triggerExhale() {
    if (!this.isEnabled || Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_err) {
      // Ignored
    }
  }

  async triggerCycleComplete() {
    if (!this.isEnabled || Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_err) {
      // Ignored
    }
  }
}

export const hapticService = new HapticService();
