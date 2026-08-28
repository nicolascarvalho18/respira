import { LEGAL_TEXTS } from '../../constants/legal';
import { userService } from '../user/userService';

class PrivacyService {
  getTermsOfUse(): string {
    return LEGAL_TEXTS.TERMS_OF_USE;
  }

  getPrivacyPolicy(): string {
    return LEGAL_TEXTS.PRIVACY_POLICY;
  }

  getConsentItems() {
    return LEGAL_TEXTS.CONSENT_ITEMS;
  }

  async exportAllData(_userId: string): Promise<string> {
    throw new Error('403: A funcionalidade de exportação de dados foi descontinuada.');
  }

  async purgeAllData(userId: string): Promise<boolean> {
    return userService.deleteAccount(userId);
  }
}

export const privacyService = new PrivacyService();
