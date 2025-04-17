import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import config from './config/index.ts';
import authRoutes from './routes/authRoutes.ts';
import documentRoutes from './routes/documentRoutes.ts';
import integrationRoutes from './routes/integrationRoutes.ts';
import apiLogsRoutes from './routes/apiLogsRoutes.ts';
import roleRoutes from './routes/roleRoutes.ts'; // Импортируем маршруты ролей
import { logger } from './utils/logger.ts';

// Создание директории для логов, если ее нет
const logDir = path.join(process.cwd(), 'logs');
const apiLogDir = path.join(logDir, 'api');
try {
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  if (!fs.existsSync(apiLogDir)) fs.mkdirSync(apiLogDir, { recursive: true });
  logger.info('Log directories created or verified', {
    logDir,
    apiLogDir
  });
} catch (error) {
  logger.error('Failed to create log directories', {
    error: error instanceof Error ? error.message : String(error),
    logDir,
    apiLogDir
  });
}

// Инициализация приложения Express
const app = express();
const PORT = config.port;

logger.info('Server starting with config', {
  port: PORT,
  environment: process.env.NODE_ENV || 'development',
  isNoDB: process.env.NODE_ENV === 'development-no-db',
});

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Устанавливаем лимит размера запроса
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Добавляем заголовки безопасности
app.use((req, res, next) => {
  // Устанавливаем заголовки безопасности
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Запрещаем кэширование для API запросов
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
});

// Middleware для логирования запросов
app.use((req, res, next) => {
  const start = Date.now();

  // Продолжаем обработку запроса
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logInfo = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).userId
    };

    if (res.statusCode >= 400) {
      logger.warn(`Request: ${req.method} ${req.path} [${res.statusCode}] - ${duration}ms`, logInfo);
    } else {
      logger.debug(`Request: ${req.method} ${req.path} [${res.statusCode}] - ${duration}ms`, logInfo);
    }

    // Сохраняем логи API
    if (req.path.startsWith('/api/')) {
      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(apiLogDir, `api-${today}.json`);

      // Дополнительная информация для логов API
      const apiLog = {
        timestamp: new Date().toISOString(),
        ...logInfo,
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined,
      };

      // Добавляем запись в файл логов
      fs.appendFile(
        logFile,
        JSON.stringify(apiLog) + '\n',
        { encoding: 'utf8' },
        (err) => {
          if (err) {
            logger.error('Failed to write API log', { error: err.message });
          }
        }
      );
    }
  });

  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/integration', integrationRoutes);
app.use('/api/logs', apiLogsRoutes);
app.use('/api/roles', roleRoutes); // Новый маршрут для управления ролями

// Здоровье API
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1
    || process.env.NODE_ENV === 'development-no-db';

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: dbStatus ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// Обработка ошибок
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Обработка ошибок валидации Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e: any) => e.message);
    logger.warn('Validation error', {
      path: req.path,
      errors
    });
    return res.status(400).json({
      success: false,
      message: 'Ошибка валидации',
      errors
    });
  }

  // Обработка ошибок дубликатов Mongoose
  if (err.code === 11000) {
    const duplicatedField = Object.keys(err.keyPattern)[0];
    logger.warn('Duplicate error', {
      path: req.path,
      field: duplicatedField,
      value: err.keyValue[duplicatedField]
    });
    return res.status(400).json({
      success: false,
      message: `Поле ${duplicatedField} должно быть уникальным.`,
      field: duplicatedField,
      value: err.keyValue[duplicatedField]
    });
  }

  // Общая обработка ошибок
  logger.error('Server error', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });
  res.status(500).json({
    success: false,
    message: 'Ошибка сервера',
    error: process.env.NODE_ENV === 'production' ? 'Внутренняя ошибка сервера' : err.message
  });
});

// Запуск сервера
const startServer = async () => {
  try {
    // Подключаемся к MongoDB, если мы не в режиме без базы данных
    if (process.env.NODE_ENV !== 'development-no-db') {
      await mongoose.connect(config.mongoUri);
      logger.info('Connected to MongoDB', {
        uri: config.mongoUri.replace(/\/\/([^:]+):[^@]+@/, '//USER:PASSWORD@')
      });
    } else {
      logger.warn('Running in development-no-db mode. Using mock data.');
    }

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server is running on port ${PORT}`, {
        url: `http://localhost:${PORT}`
      });
    });
  } catch (error: any) {
    logger.error('Failed to connect to database', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

startServer();
