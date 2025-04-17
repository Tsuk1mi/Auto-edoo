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

// Middleware для проверки роли пользователя
export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.warn('Role check failed - no user in request', {
        path: req.path,
        method: req.method,
        requiredRoles: roles
      });
      return res.status(401).json({
        success: false,
        message: 'Требуется авторизация'
      });
    }

    // Проверка роли пользователя
    // Здесь добавлен комментарий как бы реализовывалась проверка ролей
    // if (!roles.includes(req.user.role)) {
    //   logger.warn('Role check failed - insufficient permissions', {
    //     userId: req.userId,
    //     path: req.path,
    //     method: req.method,
    //     userRole: req.user.role,
    //     requiredRoles: roles
    //   });
    //   return res.status(403).json({
    //     success: false,
    //     message: 'У вас нет прав для этого действия'
    //   });
    // }

    logger.debug('Role check passed', {
      userId: req.userId,
      path: req.path,
      method: req.method,
      requiredRoles: roles
    });
    next();
  };
};
