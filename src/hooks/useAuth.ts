import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isOnboardingCompleted = useAuthStore((state) => state.isOnboardingCompleted);
  const error = useAuthStore((state) => state.error);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const setOnboardingCompleted = useAuthStore((state) => state.setOnboardingCompleted);
  const updateUser = useAuthStore((state) => state.updateUser);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const resendCode = useAuthStore((state) => state.resendCode);
  const session = useAuthStore((state) => state.session);
  const clearError = useAuthStore((state) => state.clearError);

  const isAdmin = user?.role === 'admin';

  return {
    user,
    session,
    isAuthenticated,
    isAdmin,
    isLoading,
    isOnboardingCompleted,
    error,
    login,
    register,
    verifyOtp,
    resendCode,
    logout,
    setOnboardingCompleted,
    updateUser,
    clearError,
  };
}
