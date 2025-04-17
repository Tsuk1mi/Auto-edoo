import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.ts';
import User, { type IUserDocument } from '../models/userModel.ts';
import { logger } from '../utils/logger.ts';

// Расширяем интерфейс Request
declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
      userId?: string;
    }
  }
}

interface JwtPayload {
  id: string;
  iat?: number;
  exp?: number;
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  try {
    // Проверяем наличие токена в заголовке
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
      // Поддержка токена через query параметр для совместимости
      token = req.query.token as string;
    }

    if (!token) {
      logger.warn('Authentication failed - no token provided', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        message: 'Требуется авторизация. Токен не предоставлен.'
      });
    }

    try {
      // Верифицируем токен
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

      // Ищем пользователя по ID из токена
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        logger.warn('Authentication failed - user from token not found', {
          userId: decoded.id,
          path: req.path,
          tokenIat: decoded.iat,
          tokenExp: decoded.exp
        });
        return res.status(401).json({
          success: false,
          message: 'Пользователь с таким токеном не найден'
        });
      }

      // Добавляем пользователя в request
      req.user = user;
      req.userId = decoded.id;

      logger.debug('User authenticated successfully', {
        userId: decoded.id,
        path: req.path,
        method: req.method
      });

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Authentication failed - invalid token', {
          error: error.message,
          path: req.path,
          method: req.method,
          ip: req.ip
        });
        return res.status(401).json({
          success: false,
          message: 'Недействительный токен'
        });
      } else if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Authentication failed - token expired', {
          error: error.message,
          path: req.path,
          method: req.method,
          ip: req.ip,
          expiredAt: error.expiredAt
        });
        return res.status(401).json({
          success: false,
          message: 'Срок действия токена истек'
        });
      }

      throw error; // Прокинуть ошибку дальше, чтобы основной обработчик поймал ее
    }
  } catch (error) {
    logger.error('Authentication error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack available',
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера при авторизации'
    });
  }
};

export const generateToken = (userId: string): string => {
  // Используем более короткое время жизни токена
  const token = jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  logger.debug('Generated token for user', { userId });
  return token;
};

// Новый middleware для аутентификации
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logger.warn('Auth middleware - no token provided', {
        path: req.path,
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        message: 'Требуется авторизация'
      });
    }

    // Верифицируем токен
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

      // Получаем пользователя из базы
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        logger.warn('Auth middleware - user not found', {
          userId: decoded.id,
          path: req.path
        });
        return res.status(401).json({
          success: false,
          message: 'Пользователь не найден'
        });
      }

      // Добавляем пользователя и ID в объект запроса
      req.user = user;
      req.userId = decoded.id;

      logger.debug('Auth middleware - authentication successful', {
        userId: decoded.id,
        path: req.path
      });

      next();
    } catch (error) {
      logger.warn('Auth middleware - invalid token', {
        error: error instanceof Error ? error.message : String(error),
        path: req.path
      });
      return res.status(401).json({
        success: false,
        message: 'Недействительный токен'
      });
    }
  } catch (error) {
    logger.error('Auth middleware - unexpected error', {
      error: error instanceof Error ? error.message : String(error),
      path: req.path
    });
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при проверке авторизации'
    });
  }
};

// Middleware для проверки ролей
export const roleMiddleware = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Проверяем, прошел ли пользователь аутентификацию
      if (!req.user) {
        logger.warn('Role middleware - no user in request', {
          path: req.path,
          method: req.method
        });
        return res.status(401).json({
          success: false,
          message: 'Требуется авторизация'
        });
      }

      // Проверка роли пользователя
      const userRoles = req.user.roles || [];
      const hasRole = roles.some(role => userRoles.includes(role));

      if (!hasRole) {
        logger.warn('Role check failed - insufficient permissions', {
          userId: req.userId,
          path: req.path,
          method: req.method,
          userRoles,
          requiredRoles: roles
        });
        return res.status(403).json({
          success: false,
          message: 'У вас нет прав для этого действия'
        });
      }

      next();
    } catch (error) {
      logger.error('Role middleware - unexpected error', {
        error: error instanceof Error ? error.message : String(error),
        path: req.path
      });
      return res.status(500).json({
        success: false,
        message: 'Ошибка сервера при проверке прав доступа'
      });
    }
  };
};
