import axios, { type AxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';
import { logger } from '../utils/logger';

// Базовый URL API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

logger.info('API client initialized', { baseUrl: API_URL });

interface RequestConfig extends AxiosRequestConfig {
  url: string;
}

// Стандартизированный ответ API
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
  };
}

// Класс для событий авторизации
class AuthEventManager {
  private unauthorizedEvent: EventTarget;
  private authChangeEvent: EventTarget;

  constructor() {
    this.unauthorizedEvent = new EventTarget();
    this.authChangeEvent = new EventTarget();
    logger.debug('AuthEventManager initialized');
  }

  get unauthorized() {
    return this.unauthorizedEvent;
  }

  get authChange() {
    return this.authChangeEvent;
  }

  dispatchUnauthorized() {
    logger.warn('Dispatching unauthorized event');
    const event = new CustomEvent('auth:unauthorized');
    this.unauthorizedEvent.dispatchEvent(event);
  }

  dispatchAuthChange(isAuthenticated: boolean) {
    logger.debug('Dispatching auth change event', { isAuthenticated });
    const event = new CustomEvent('auth:change', {
      detail: { isAuthenticated }
    });
    this.authChangeEvent.dispatchEvent(event);
  }
}

// Экспортируем инстанс для использования во всем приложении
export const authEvents = new AuthEventManager();

class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем интерцептор для добавления токена к запросам
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      logger.debug(`Добавление токена к запросу: ${config.url}`);
    }

    // Логируем детали запроса
    logger.debug(`API запрос: ${config.method?.toUpperCase()} ${config.url}`, {
      url: config.url,
      method: config.method,
      params: config.params,
      // Не логируем тело запроса, так как оно может содержать конфиденциальную информацию
      hasBody: !!config.data
    });

    return config;
  },
  (error) => {
    logger.error('Ошибка в интерцепторе запроса API', {
      error: error.message,
      stack: error.stack
    });
    return Promise.reject(error);
  }
);

// Интерцептор ответа
api.interceptors.response.use(
  (response) => {
    const responseTime = response.headers['x-response-time']
      ? Number(response.headers['x-response-time'])
      : 'unknown';

    logger.debug(`API ответ: ${response.status} для ${response.config.url}`, {
      url: response.config.url,
      status: response.status,
      responseTime,
      dataSize: JSON.stringify(response.data).length,
      hasData: !!response.data
    });

    return response;
  },
  (error: AxiosError<ApiResponse<any>>) => {
    // Расширенное логирование ошибок
    logger.error('Ошибка API', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      code: error.code
    });

    // Обработка ошибок авторизации (401)
    if (error.response?.status === 401) {
      // Очищаем токен и отправляем событие
      const hadToken = !!localStorage.getItem('token');
      localStorage.removeItem('token');

      logger.warn('Ошибка авторизации - очистка токена и отправка события', {
        hadToken,
        url: error.config?.url,
      });

      // Только если был токен, отправляем событие
      if (hadToken) {
        authEvents.dispatchUnauthorized();
      }

      return Promise.reject(new UnauthorizedError(error.response?.data?.message || 'Требуется авторизация'));
    }

    // Показываем уведомления для ошибок сервера
    if (error.response?.status && error.response.status >= 500) {
      logger.error('Ошибка сервера', {
        status: error.response.status,
        message: error.response?.data?.message || 'Неизвестная ошибка'
      });
      // TODO: Добавить код для уведомлений
    }

    return Promise.reject(error);
  }
);

// Универсальная функция для выполнения запросов к API
export const apiRequest = async <T = any>(config: RequestConfig): Promise<T> => {
  try {
    // Для тестирования и разработки, симулируем задержку
    const SIMULATE_DELAY = 300;

    // Добавляем задержку для симуляции работы с API
    if (SIMULATE_DELAY > 0) {
      await new Promise(resolve => setTimeout(resolve, SIMULATE_DELAY));
    }

    logger.debug(`API запрос: ${config.method} ${config.url}`, {
      config: {
        url: config.url,
        method: config.method,
        params: config.params,
        hasData: !!config.data
      }
    });

    // Если URL не начинается с "/", добавляем его
    if (!config.url.startsWith('/')) {
      config.url = '/' + config.url;
    }

    const response: AxiosResponse<ApiResponse<T>> = await api(config);

    // Проверяем успешность ответа
    if (response.data && response.data.success === false) {
      logger.warn(`API запрос вернул успех: false`, {
        url: config.url,
        message: response.data.message
      });
      throw new Error(response.data.message || 'Ошибка при выполнении запроса');
    }

    // Если API возвращает обертку с data, возвращаем только data
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }

    // В противном случае возвращаем весь ответ
    return response.data as unknown as T;
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      logger.warn('Перехвачена ошибка авторизации в apiRequest', {
        url: config.url,
        message: error.message
      });
      throw error;
    }

    if (error.response) {
      // Ошибка с сервера с кодом статуса
      const errorMessage = error.response.data?.message || 'Ошибка сервера';
      logger.error(`Ошибка API (${error.response.status})`, {
        url: config.url,
        status: error.response.status,
        message: errorMessage
      });
      throw new Error(errorMessage);
    } else if (error.request) {
      // Запрос был сделан, но ответа не получено
      logger.error('Ошибка сети: Ответ не получен', {
        url: config.url,
        request: error.request
      });
      throw new Error('Нет ответа от сервера. Проверьте интернет-соединение.');
    } else {
      // Что-то произошло при настройке запроса
      logger.error('Ошибка запроса', {
        url: config.url,
        message: error.message,
        stack: error.stack
      });
      throw new Error(error.message || 'Ошибка при формировании запроса');
    }
  }
};

// Получаем заголовки пагинации и метаданные
export const getMetaFromResponse = <T>(response: AxiosResponse<ApiResponse<T>>): ApiResponse<T>['meta'] => {
  return response.data.meta;
};

export default api;
