import path from 'path';
import dotenv from 'dotenv';

// Загружаем .env файл из корня проекта
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const config = {
  // Порт, на котором будет работать API
  port: process.env.PORT || 5000,

  // URI для подключения к MongoDB
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/edodb',

  // Секретный ключ для JWT
  jwtSecret: process.env.JWT_SECRET || 'secure_jwt_secret_key_for_edo_app',

  // Время жизни JWT
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // CORS настройки
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Уровень логирования
  logLevel: process.env.LOG_LEVEL || 'debug',

  // Путь к директории с логами
  logDir: process.env.LOG_DIR || path.resolve(process.cwd(), 'logs'),
};

export default config;
