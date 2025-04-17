import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import config from './config/index.ts';
import authRoutes from './routes/authRoutes.ts';
import documentRoutes from './routes/documentRoutes.ts';
import integrationRoutes from './routes/integrationRoutes.ts';
import apiLogsRoutes from './routes/apiLogsRoutes.ts';
import { logger, requestLogger, errorLogger } from './utils/logger.ts';

// Инициализация Express
const app = express();

// Создадим директорию для логов, если её ещё нет
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CORS_ORIGIN || 'https://edo-app.domain.com'
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  maxAge: 86400 // 24 часа
}));

// Более детальное логирование запросов
app.use((req, res, next) => {
  res.locals.startTime = Date.now();
  logger.debug(`Incoming request: ${req.method} ${req.url}`, {
    headers: req.headers,
    query: req.query,
    params: req.params,
    ip: req.ip,
    path: req.path
  });

  // Добавляем заголовки для отслеживания
  res.on('finish', () => {
    const responseTime = Date.now() - res.locals.startTime;
    res.setHeader('X-Response-Time', responseTime);
    logger.debug(`Response sent: ${res.statusCode} (${responseTime}ms)`, {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime
    });
  });

  next();
});

// Подключаем middleware для логирования запросов с помощью нашей системы логирования
app.use(requestLogger);

// Проверка работоспособности
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime())
  });
});

// Эндпоинт для просмотра логов в режиме разработки
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'development-no-db') {
  app.get('/api/logs', (req, res) => {
    try {
      const date = req.query.date ? String(req.query.date) : new Date().toISOString().split('T')[0];
      const type = req.query.type === 'error' ? 'error' : 'app';
      const logFilePath = path.join(logsDir, `${type}-${date}.log`);

      if (fs.existsSync(logFilePath)) {
        const logs = fs.readFileSync(logFilePath, 'utf8');
        res.setHeader('Content-Type', 'text/plain');
        res.send(logs);
      } else {
        res.status(404).send('Log file not found');
      }
    } catch (error) {
      logger.error('Error reading log file', { error: String(error) });
      res.status(500).send('Error reading log file');
    }
  });
}

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/integration', integrationRoutes);
app.use('/api/logs', apiLogsRoutes);

// Обработка 404
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Маршрут не найден'
  });
});

// Подключаем middleware для логирования ошибок
app.use(errorLogger);

// Обработка ошибок
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Обработка ошибок валидации Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e: any) => e.message);
    logger.warn('Validation error', {
      path: req.path,
      errors,
      body: req.body
    });

    return res.status(400).json({
      success: false,
      message: 'Ошибка валидации данных',
      errors
    });
  }

  // Обработка ошибок дубликатов (уникальных полей) Mongoose
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    logger.warn(`Duplicate key error for field: ${field}`, {
      path: req.path,
      field,
      value: err.keyValue[field]
    });

    return res.status(400).json({
      success: false,
      message: 'Запись с такими данными уже существует',
      field
    });
  }

  // Общая обработка ошибок
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  logger.error(`Server error [${errorId}]`, {
    error: err.message,
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    message: 'Внутренняя ошибка сервера',
    error: process.env.NODE_ENV === 'production' ? null : err.message,
    errorId
  });
});

// Обработка непойманных исключений
process.on('uncaughtException', (error) => {
  logger.critical('Uncaught exception', {
    error: error.message,
    stack: error.stack,
    name: error.name
  });

  // В продакшене здесь можно отправить уведомление об ошибке
  if (process.env.NODE_ENV === 'production') {
    // TODO: Отправить уведомление об ошибке (например, по email)

    // В продакшене после непойманного исключения стоит перезапустить процесс
    // Даем время на отправку логов и завершаем процесс
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
});

// Обработка непойманных отклонений промисов
process.on('unhandledRejection', (reason, promise) => {
  logger.critical('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.stack : String(reason),
    promise: String(promise)
  });

  // В продакшене здесь можно отправить уведомление об ошибке
});

// Подключение к MongoDB и запуск сервера
const startServer = async () => {
  try {
    // В режиме разработки можно работать без MongoDB
    if (process.env.NODE_ENV !== 'development-no-db') {
      // Настройка опций подключения
      const mongooseOptions = {
        serverSelectionTimeoutMS: 5000, // Таймаут выбора сервера в миллисекундах
        socketTimeoutMS: 45000, // Время ожидания сокета в миллисекундах
      };

      await mongoose.connect(config.mongoUri, mongooseOptions);

      logger.info('Connected to MongoDB', { uri: config.mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') });
    } else {
      logger.warn('Running without database connection');
    }

    app.listen(config.port, () => {
      logger.info(`Server started on port ${config.port}`, {
        env: process.env.NODE_ENV || 'development',
        port: config.port,
        pid: process.pid,
        memory: process.memoryUsage()
      });
    });
  } catch (error: any) {
    logger.error('Failed to connect to database', {
      error: error.message,
      stack: error.stack,
      uri: config.mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')
    });

    logger.warn('Starting server without database connection...');

    app.listen(config.port, () => {
      logger.info(`Server started on port ${config.port} (without DB)`, {
        env: process.env.NODE_ENV || 'development',
        port: config.port,
        pid: process.pid
      });
    });
  }
};

// Логирование информации о системе при запуске
logger.info('Server initializing', {
  node_version: process.version,
  platform: process.platform,
  arch: process.arch,
  pid: process.pid,
  env: process.env.NODE_ENV || 'development'
});

// Запускаем сервер
startServer();
