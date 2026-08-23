import { authService } from '../services/auth/authService';
import { useAuthStore } from '../store/authStore';

describe('Auth Service and Store Unit Tests', () => {
  beforeEach(async () => {
    await authService.logout();
  });

  it('should successfully log in with valid mock credentials and return a token', async () => {
    const result = await authService.login({
      email: 'ana@exemplo.com',
      password: 'validpassword123',
    });

    expect(result).toBeDefined();
    expect(result.user.email).toBe('ana@exemplo.com');
    expect(result.token).toContain('mock-jwt-token');
  });

  it('should initialize auth store and update authentication state', async () => {
    const store = useAuthStore.getState();
    await store.login({
      email: 'ana@exemplo.com',
      password: 'validpassword123',
    });

    const updatedState = useAuthStore.getState();
    expect(updatedState.isAuthenticated).toBe(true);
    expect(updatedState.user?.name).toBe('Ana');
  });

  it('should clear stored session when logging out', async () => {
    const store = useAuthStore.getState();
    await store.login({
      email: 'ana@exemplo.com',
      password: 'validpassword123',
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    await store.logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('should persist and retrieve onboarding completion status', async () => {
    await authService.setOnboardingCompleted(true);
    const completed = await authService.isOnboardingCompleted();
    expect(completed).toBe(true);
  });
});
