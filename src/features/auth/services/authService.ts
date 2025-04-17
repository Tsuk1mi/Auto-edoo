import { apiRequest } from '@/api/api';
import type { LoginCredentials, RegisterData, User } from '@/types/User';
import { logger } from '@/utils/logger';

interface AuthResponse {
  user: User;
  token: string;
}

// Установите в true, чтобы использовать моковые данные вместо реального API
const USE_MOCK = true;

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    logger.debug('Login service called', { email: credentials.email, useMock: USE_MOCK });

    if (USE_MOCK) {
      return this.mockLogin(credentials);
    }

    return apiRequest<AuthResponse>({
      method: 'POST',
      url: '/auth/login', // Corrected API endpoint
      data: credentials,
    });
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    logger.debug('Register service called', { email: userData.email, useMock: USE_MOCK });

    if (USE_MOCK) {
      return this.mockRegister(userData);
    }

    return apiRequest<AuthResponse>({
      method: 'POST',
      url: '/auth/register', // Corrected API endpoint
      data: userData,
    });
  },

  async logout(): Promise<void> {
    logger.debug('Logout service called', { useMock: USE_MOCK });

    if (USE_MOCK) {
      return Promise.resolve();
    }

    return apiRequest<void>({
      method: 'POST',
      url: '/auth/logout', // Corrected API endpoint
    });
  },

  async getCurrentUser(): Promise<User> {
    logger.debug('GetCurrentUser service called', { useMock: USE_MOCK });

    if (USE_MOCK) {
      const token = localStorage.getItem('token');
      if (token === 'mock-jwt-token') {
        return Promise.resolve({
          id: '1',
          username: 'user',
          email: 'user@example.com',
          fullName: 'Тестовый Пользователь',
          avatar: 'https://avatars.githubusercontent.com/u/2?v=4',
        });
      }
      throw new Error('Не авторизован');
    }

    return apiRequest<User>({
      method: 'GET',
      url: '/auth/me', // Corrected API endpoint
    });
  },

  // Mock для разработки, если API недоступен
  mockLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    logger.debug('Using mock login', { email: credentials.email });
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (credentials.email === 'user@example.com' && credentials.password === 'password123') {
          resolve({
            user: {
              id: '1',
              username: 'user',
              email: 'user@example.com',
              fullName: 'Тестовый Пользователь',
              avatar: 'https://avatars.githubusercontent.com/u/2?v=4',
            },
            token: 'mock-jwt-token',
          });
        } else {
          reject(new Error('Неверный email или пароль'));
        }
      }, 500);
    });
  },

  // Mock для регистрации
  mockRegister(userData: RegisterData): Promise<AuthResponse> {
    logger.debug('Using mock register', { email: userData.email });
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          user: {
            id: '2',
            username: userData.username,
            email: userData.email,
            fullName: userData.fullName || 'Новый пользователь',
            avatar: 'https://avatars.githubusercontent.com/u/3?v=4',
          },
          token: 'mock-jwt-token',
        });
      }, 500);
    });
  },
};
