import { apiRequest } from '@/api/api';

export interface ExternalServiceToken {
  token: string;
  url: string;
  expiry?: number;
}

export const integrationService = {
  /**
   * Получить токен для Grafana
   */
  async getGrafanaToken(): Promise<ExternalServiceToken> {
    return apiRequest<ExternalServiceToken>({
      method: 'GET',
      url: '/api/integration/grafana-token',
    });
  },

  /**
   * Получить токен для Ansible
   */
  async getAnsibleToken(): Promise<ExternalServiceToken> {
    return apiRequest<ExternalServiceToken>({
      method: 'GET',
      url: '/api/integration/ansible-token',
    });
  },

  /**
   * Общий метод для открытия внешней системы в новом окне с SSO
   */
  openExternalSystem: async (
    tokenGetter: () => Promise<ExternalServiceToken>,
    defaultUrl: string,
    serviceName: string
  ) => {
    try {
      // Получаем токен и URL для системы
      const { token, url } = await tokenGetter();
      const targetUrl = url || defaultUrl;

      // Добавляем токен в URL как параметр или в хеш
      const separator = targetUrl.includes('?') ? '&' : '?';
      const urlWithToken = `${targetUrl}${separator}token=${token}`;

      // Открываем новое окно
      window.open(urlWithToken, `_${serviceName.toLowerCase()}`, 'noopener,noreferrer');

      return true;
    } catch (error) {
      console.error(`Ошибка при получении доступа к ${serviceName}:`, error);
      throw new Error(`Не удалось открыть ${serviceName}. Пожалуйста, попробуйте позже.`);
    }
  },
};
