import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.ts';

/**
 * Генерирует токен для внешних систем
 */
const generateExternalSystemToken = (
  userId: string,
  system: string,
  expiresIn = '1h'
): string => {
  return jwt.sign(
    {
      id: userId,
      system,
      iat: Math.floor(Date.now() / 1000),
    },
    config.jwtSecret,
    { expiresIn }
  );
};

/**
 * Получение токена для Grafana
 */
export const getGrafanaToken = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Требуется авторизация'
      });
    }

    // Генерируем токен для Grafana
    const token = generateExternalSystemToken(req.userId, 'grafana', '4h');

    // URL Grafana (должен быть настроен в конфигурации)
    const grafanaUrl = process.env.GRAFANA_URL || 'https://grafana.example.com';

    res.json({
      success: true,
      data: {
        token,
        url: grafanaUrl,
        expiry: 14400, // 4 часа в секундах
      }
    });
  } catch (error) {
    console.error('Ошибка при получении токена для Grafana:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении токена',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};

/**
 * Получение токена для Ansible
 */
export const getAnsibleToken = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Требуется авторизация'
      });
    }

    // Генерируем токен для Ansible
    const token = generateExternalSystemToken(req.userId, 'ansible', '4h');

    // URL Ansible (должен быть настроен в конфигурации)
    const ansibleUrl = process.env.ANSIBLE_URL || 'https://ansible.example.com';

    res.json({
      success: true,
      data: {
        token,
        url: ansibleUrl,
        expiry: 14400, // 4 часа в секундах
      }
    });
  } catch (error) {
    console.error('Ошибка при получении токена для Ansible:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении токена',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};
