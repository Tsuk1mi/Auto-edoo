import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Определяем путь к .env файлу
const envPath = path.resolve(process.cwd(), '../.env');

// Проверяем наличие файла перед загрузкой
if (fs.existsSync(envPath)) {
  console.log(`Loading .env file from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn(`No .env file found at ${envPath}, using default values`);
  dotenv.config();
}

// Определение окружения
const nodeEnv = process.env.NODE_ENV || 'development';
const isDevelopment = nodeEnv.includes('development');
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';
const isNoDB = nodeEnv === 'development-no-db';

const config = {
  // Основные настройки
  env: nodeEnv,
  isDevelopment,
  isProduction,
  isTest,
  isNoDB,

  // Порт, на котором будет работать API
  port: Number(process.env.PORT || process.env.VITE_SERVER_PORT) || 5000,

  // URI для подключения к MongoDB
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/edodb',

  // Секретный ключ для JWT
  jwtSecret: process.env.JWT_SECRET || 'secure_jwt_secret_key_for_edo_app',

  // Время жизни JWT
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // CORS настройки
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Уровень логирования
  logLevel: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

  // Путь к директории с логами
  logDir: process.env.LOG_DIR || path.resolve(process.cwd(), 'logs'),

  // Максимальный размер загружаемых файлов (10 МБ)
  maxFileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,

  // Настройки безопасности
  security: {
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
    rateLimitRequests: Number(process.env.RATE_LIMIT_REQUESTS) || 100,
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 минут
  },
};

export default config;
