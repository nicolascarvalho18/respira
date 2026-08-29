import { supabaseAuthService } from '../services/auth/supabaseAuthService';
import { authService } from '../services/auth/authService';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase/client';

describe('Real Supabase Auth & Session Security Tests', () => {
  beforeEach(async () => {
    useAuthStore.setState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('rejects passwords shorter than 10 characters during registration', async () => {
    const res = await supabaseAuthService.signUp('test@exemplo.com', 'short123');
    expect(res.error).toContain('10 caracteres');
    expect(res.user).toBeNull();
  });

  it('normalizes email and requires email confirmation on sign up', async () => {
    jest.spyOn(supabase.auth, 'signUp').mockResolvedValueOnce({
      data: { user: { id: 'test-user-id', email: 'user.teste@exemplo.com' } as any, session: null },
      error: null,
    });

    const res = await supabaseAuthService.signUp('  USER.TESTE@EXEMPLO.COM  ', 'StrongPassword123!', 'Usuário Teste');
    expect(res.user).toBeNull();
    expect(res.requiresVerification).toBe(true);
    expect(res.email).toBe('user.teste@exemplo.com');
  });

  it('rejects invalid or incomplete OTP codes', async () => {
    const res = await supabaseAuthService.verifyOtp('user@exemplo.com', '123');
    expect(res.error).toContain('6 dígitos');
    expect(res.user).toBeNull();
  });

  it('provides neutral security message on password reset', async () => {
    const res = await supabaseAuthService.resetPassword('qualquer@exemplo.com');
    expect(res.success).toBe(true);
    expect(res.message).toContain('Se houver uma conta associada');
  });

  it('handles sign in rejection with neutral message when credentials fail', async () => {
    const res = await supabaseAuthService.signIn('inexistente@exemplo.com', 'wrongpass123');
    expect(res.user).toBeNull();
    expect(res.error).toBe('E-mail ou senha inválidos.');
  });

  it('clears state completely on logout', async () => {
    useAuthStore.setState({
      user: {
        id: 'user-test-1',
        name: 'Usuário Teste',
        email: 'user@exemplo.com',
        role: 'user',
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isAuthenticated: true,
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    await useAuthStore.getState().logout('local');

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('persists and retrieves onboarding completion status', async () => {
    await authService.setOnboardingCompleted(true);
    const completed = await authService.isOnboardingCompleted();
    expect(completed).toBe(true);
  });
});
