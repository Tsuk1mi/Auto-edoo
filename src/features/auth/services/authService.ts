import { apiRequest } from '@/api/api';
import type { LoginCredentials, RegisterData, User } from '@/types/User';
import { UserRole } from '@/types/User';
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
          roles: [UserRole.USER],
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
        // Проверяем учетные данные и возвращаем соответствующие мок-данные
        if (credentials.email === 'admin@example.com' && credentials.password === 'password123') {
          resolve({
            user: {
              id: '1',
              username: 'admin',
              email: 'admin@example.com',
              fullName: 'Администратор Системы',
              avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
              roles: [UserRole.ADMIN],
            },
            token: 'mock-jwt-token',
          });
        } else if (credentials.email === 'manager@example.com' && credentials.password === 'password123') {
          resolve({
            user: {
              id: '3',
              username: 'manager',
              email: 'manager@example.com',
              fullName: 'Менеджер Проекта',
              avatar: 'https://avatars.githubusercontent.com/u/3?v=4',
              roles: [UserRole.MANAGER],
            },
            token: 'mock-jwt-token',
          });
        } else if (credentials.email === 'inventory@example.com' && credentials.password === 'password123') {
          resolve({
            user: {
              id: '4',
              username: 'inventory',
              email: 'inventory@example.com',
              fullName: 'Кладовщик',
              avatar: 'https://avatars.githubusercontent.com/u/4?v=4',
              roles: [UserRole.INVENTORY],
            },
            token: 'mock-jwt-token',
          });
        } else if (credentials.email === 'user@example.com' && credentials.password === 'password123') {
          resolve({
            user: {
              id: '2',
              username: 'user',
              email: 'user@example.com',
              fullName: 'Тестовый Пользователь',
              avatar: 'https://avatars.githubusercontent.com/u/2?v=4',
              roles: [UserRole.USER],
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
            roles: [UserRole.USER], // По умолчанию регистрируемся как обычный пользователь
          },
          token: 'mock-jwt-token',
        });
      }, 500);
    });
  },
};
