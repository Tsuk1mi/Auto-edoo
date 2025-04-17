import { create } from 'zustand';
import { authService } from '@/features/auth/services/authService';
import type { AuthData, LoginCredentials, RegisterData } from '@/types/User';
import { logger } from '@/utils/logger';

interface AuthState extends AuthData {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // При инициализации хранилища проверяем токен
  const token = localStorage.getItem('token');

  if (token) {
    logger.debug('Auth store initialized with token', { tokenLength: token.length });
  } else {
    logger.debug('Auth store initialized without token');
  }

  return {
    user: null,
    token,
    isLoading: false,
    error: null,

    setToken: (token: string | null) => {
      logger.debug('Setting token', { hasToken: !!token });

      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
      set({ token });
      logger.debug('Token set completed', { hasToken: !!token, storeToken: !!get().token });
    },

    login: async (credentials) => {
      logger.debug('Login attempt', { email: credentials.email });
      set({ isLoading: true, error: null });

      try {
        // Используем реальную авторизацию
        const response = await authService.login(credentials);
        // Для разработки или тестирования можно использовать мок
        // const response = await authService.mockLogin(credentials);
        logger.info('Login successful', { email: credentials.email, userId: response.user.id });

        const { user, token } = response;
        get().setToken(token);
        logger.debug('Setting user after login', { userId: user.id });
        set({ user, isLoading: false });
        logger.debug('User set completed', { userId: get().user?.id, hasToken: !!get().token });

        return user; // Возвращаем пользователя для удобства работы с промисами
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ошибка авторизации';
        logger.error('Login failed', {
          error: errorMessage,
          email: credentials.email
        });

        set({ isLoading: false, error: errorMessage });
        throw error;
      }
    },

    register: async (userData) => {
      logger.debug('Registration attempt', {
        email: userData.email,
        username: userData.username
      });
      set({ isLoading: true, error: null });

      try {
        const response = await authService.register(userData);
        logger.info('Registration successful', { email: userData.email });

        const { user, token } = response;
        get().setToken(token);
        set({ user, isLoading: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ошибка при регистрации';
        logger.error('Registration failed', {
          error: errorMessage,
          email: userData.email
        });

        set({ isLoading: false, error: errorMessage });
        throw error;
      }
    },

    logout: async () => {
      logger.debug('Logout attempt');
      set({ isLoading: true });

      try {
        await authService.logout();
        logger.info('Logout successful');
      } catch (error) {
        logger.error('Logout error', {
          error: error instanceof Error ? error.message : String(error)
        });
      } finally {
        get().setToken(null);
        set({ user: null, isLoading: false });
      }
    },

    checkAuth: async () => {
      const token = localStorage.getItem('token');
      logger.debug('Checking authentication', { hasToken: !!token });

      if (!token) {
        logger.warn('Auth check failed - no token found');
        set({ user: null, token: null });
        return false;
      }

      set({ isLoading: true, token });
      try {
        const user = await authService.getCurrentUser();
        logger.info('Auth check successful', { userId: user.id });
        set({ user, isLoading: false });
        logger.debug('Auth check completed, user set', { userId: get().user?.id });
        return true;
      } catch (error) {
        logger.warn('Auth check failed - invalid token', {
          error: error instanceof Error ? error.message : String(error)
        });
        get().setToken(null);
        set({ user: null, isLoading: false });
        logger.debug('Auth check failed, token and user cleared');
        return false;
      }
    },
  };
});
