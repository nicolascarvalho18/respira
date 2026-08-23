import { userAccountService } from '../server/services/userAccountService';

describe('User Account, Security and LGPD Service Tests', () => {
  const testUserId = 'user-demo-1';

  it('updates profile name with validation', async () => {
    const updated = await userAccountService.updateProfileName(testUserId, 'Ana Paula');
    expect(updated.name).toBe('Ana Paula');

    // Rejeita nome muito curto
    await expect(userAccountService.updateProfileName(testUserId, 'A')).rejects.toThrow();
  });

  it('validates and changes user password, revoking other sessions', async () => {
    const res = await userAccountService.changePassword(
      testUserId,
      'MinhaSenhaAtual@123',
      'NovaSenhaForte@2024'
    );
    expect(res.message).toContain('sucesso');

    // Rejeita senha fraca
    await expect(
      userAccountService.changePassword(testUserId, 'NovaSenhaForte@2024', '123456')
    ).rejects.toThrow();
  });

  it('requests email change and records security event', async () => {
    const res = await userAccountService.requestEmailChange(
      testUserId,
      'novo.email@exemplo.com',
      'NovaSenhaForte@2024'
    );
    expect(res.message).toContain('link de confirmação');

    const events = await userAccountService.getSecurityEvents(testUserId);
    expect(events.some((e) => e.eventType === 'email_change_request')).toBe(true);
  });

  it('retrieves active sessions and revokes session', async () => {
    const initialSessions = await userAccountService.getActiveSessions(testUserId);
    expect(initialSessions.length).toBeGreaterThan(0);

    const updatedSessions = await userAccountService.revokeSession(
      testUserId,
      'session-desktop-1'
    );
    expect(updatedSessions.some((s) => s.id === 'session-desktop-1')).toBe(false);
  });

  it('exports complete user data package in structured JSON', async () => {
    const jsonStr = await userAccountService.exportUserDataPackage(testUserId);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.exportMetadata.purpose).toContain('LGPD');
    expect(parsed.userProfile).toBeDefined();
    expect(parsed.moodEntries).toBeDefined();
    expect(parsed.favoriteArticles).toBeDefined();
  });

  it('requires exact confirmation phrase to delete account', async () => {
    // Frase errada
    await expect(
      userAccountService.requestAccountDeletion(testUserId, 'excluir')
    ).rejects.toThrow();

    // Frase correta
    const res = await userAccountService.requestAccountDeletion(
      testUserId,
      'EXCLUIR MINHA CONTA'
    );
    expect(res.success).toBe(true);
  });
});
