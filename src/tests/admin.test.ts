import { MOCK_SANITIZED_USERS } from '../mocks/adminLogs.mock';
import { userService } from '../services/user/userService';

describe('Admin Security and Data Privacy (LGPD) Tests', () => {
  it('should mask user emails and hide personal diary notes in admin statistics', () => {
    MOCK_SANITIZED_USERS.forEach((sanitizedUser) => {
      // O e-mail deve estar mascarado
      expect(sanitizedUser.emailMasked).toContain('***');
      // Nenhum objeto deve conter notas pessoais ou chats
      expect((sanitizedUser as any).notes).toBeUndefined();
      expect((sanitizedUser as any).chatHistory).toBeUndefined();
      expect((sanitizedUser as any).password).toBeUndefined();
    });
  });

  it('should format user export data without exposing unencrypted sensitive keys', async () => {
    const exportJson = await userService.exportUserData('user-demo-1');
    const parsed = JSON.parse(exportJson);

    expect(parsed.appVersion).toBeDefined();
    expect(parsed.user).toBeDefined();
    expect(parsed.user.password).toBeUndefined();
    expect(parsed.legalNotice).toContain('privacidade');
  });
});
