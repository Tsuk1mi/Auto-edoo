import fs from 'fs';
import path from 'path';
import os from 'os';
import type { Request, Response, NextFunction } from 'express';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  ip?: string;
  statusCode?: number;
  responseTime?: number;
}

export interface ApiLogEntry {
  requestId: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  responseTime: number;
  userId?: string;
  ip?: string;
  userAgent?: string;
  requestBody?: any;
  responseBody?: any;
  error?: string;
}

class Logger {
  private static instance: Logger;
  private logDir: string;
  private apiLogDir: string;
  private logLevel: LogLevel;
  private consoleEnabled: boolean;
  private fileEnabled: boolean;
  private maxLogFileSize: number; // в байтах
  private maxLogFiles: number;
  private hostname: string;
  private appName: string;
  private apiLogs: ApiLogEntry[] = [];
  private maxApiLogsInMemory = 1000;

  private constructor() {
    // Инициализация параметров логирования
    const env = process.env.NODE_ENV || 'development';
    this.hostname = os.hostname();
    this.appName = 'edo-app-server';

    // Настройка уровня логирования в зависимости от окружения
    if (env === 'development' || env === 'development-no-db') {
      this.logLevel = LogLevel.DEBUG;
      this.consoleEnabled = true;
      this.fileEnabled = true;
    } else if (env === 'test') {
      this.logLevel = LogLevel.INFO;
      this.consoleEnabled = false;
      this.fileEnabled = true;
    } else { // production
      this.logLevel = LogLevel.INFO;
      this.consoleEnabled = false;
      this.fileEnabled = true;
    }

    // Настройка файлового логгера
    this.logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
    this.apiLogDir = path.join(this.logDir, 'api');
    this.maxLogFileSize = 10 * 1024 * 1024; // 10 МБ по умолчанию
    this.maxLogFiles = 5; // максимум 5 файлов логов

    // Создаем директорию для логов если не существует
    if (this.fileEnabled) {
      try {
        if (!fs.existsSync(this.logDir)) {
          fs.mkdirSync(this.logDir, { recursive: true });
        }
        if (!fs.existsSync(this.apiLogDir)) {
          fs.mkdirSync(this.apiLogDir, { recursive: true });
        }
      } catch (error) {
        console.error('Failed to create log directory:', error);
        this.fileEnabled = false; // Отключаем файловое логирование при ошибке
      }
    }

    // Логируем инициализацию логгера
    this.log(LogLevel.INFO, 'Logger initialized', {
      env,
      logLevel: this.logLevel,
      hostname: this.hostname,
      consoleEnabled: this.consoleEnabled,
      fileEnabled: this.fileEnabled,
      logDir: this.logDir
    });
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.log(LogLevel.INFO, `Log level changed to ${level}`);
  }

  public enableConsole(enable: boolean): void {
    this.consoleEnabled = enable;
    this.log(LogLevel.INFO, `Console logging ${enable ? 'enabled' : 'disabled'}`);
  }

  public enableFileLogging(enable: boolean): void {
    this.fileEnabled = enable;
    this.log(LogLevel.INFO, `File logging ${enable ? 'enabled' : 'disabled'}`);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const targetLevelIndex = levels.indexOf(level);
    return targetLevelIndex >= currentLevelIndex;
  }

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, ...context } = entry;
    let formattedContext = '';
    if (Object.keys(context).length > 0) {
      try {
        formattedContext = JSON.stringify(context);
      } catch (error) {
        formattedContext = `[Context serialization error: ${error.message}]`;
      }
    }
    return `[${timestamp}] [${level}] [${this.hostname}] [${this.appName}] ${message} ${formattedContext}`;
  }

  public log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      ...context
    };

    // Логируем в консоль если включено
    if (this.consoleEnabled) {
      this.logToConsole(logEntry);
    }

    // Логируем в файл если включено
    if (this.fileEnabled) {
      this.logToFile(logEntry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const { level } = entry;
    const formattedEntry = this.formatLogEntry(entry);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedEntry);
        break;
      case LogLevel.INFO:
        console.info(formattedEntry);
        break;
      case LogLevel.WARN:
        console.warn(formattedEntry);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(formattedEntry);
        break;
      default:
        console.log(formattedEntry);
    }
  }

  private logToFile(entry: LogEntry): void {
    try {
      const { level } = entry;
      const logFile = this.getLogFilePath(level);
      const formattedEntry = this.formatLogEntry(entry) + '\n';

      // Асинхронно дописываем в файл
      fs.appendFile(logFile, formattedEntry, (err) => {
        if (err) {
          console.error(`Failed to write to log file ${logFile}:`, err);
        } else {
          // Проверяем и ротируем файл логов если нужно
          this.rotateLogFileIfNeeded(logFile);
        }
      });
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  private getLogFilePath(level: LogLevel): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    let fileName;

    // Для критических и обычных ошибок используем отдельный файл
    if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
      fileName = `error-${date}.log`;
    } else {
      fileName = `app-${date}.log`;
    }

    return path.join(this.logDir, fileName);
  }

  private rotateLogFileIfNeeded(logFile: string): void {
    try {
      fs.stat(logFile, (err, stats) => {
        if (err) return;

        // Если файл превысил максимальный размер, делаем ротацию
        if (stats.size > this.maxLogFileSize) {
          const baseName = path.basename(logFile);
          const dirName = path.dirname(logFile);

          // Перемещаем текущие архивные файлы
          for (let i = this.maxLogFiles - 1; i > 0; i--) {
            const oldFile = path.join(dirName, `${baseName}.${i}`);
            const newFile = path.join(dirName, `${baseName}.${i + 1}`);

            if (fs.existsSync(oldFile)) {
              try {
                fs.renameSync(oldFile, newFile);
              } catch (e) {
                // Игнорируем ошибки
              }
            }
          }

          // Переименовываем текущий файл в архивный
          const archiveFile = path.join(dirName, `${baseName}.1`);
          try {
            fs.renameSync(logFile, archiveFile);
          } catch (e) {
            console.error(`Error rotating log file ${logFile}:`, e);
          }
        }
      });
    } catch (error) {
      console.error('Error checking log file size:', error);
    }
  }

  // Публичные методы уровней логирования
  public debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  public info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  public error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  public critical(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.CRITICAL, message, context);
  }

  // Логирование API запросов
  public logApiRequest(logEntry: ApiLogEntry): void {
    try {
      // Добавляем запись в память
      this.apiLogs.push(logEntry);
      if (this.apiLogs.length > this.maxApiLogsInMemory) {
        this.apiLogs.shift(); // Удаляем самый старый лог
      }

      // Записываем в файл
      if (this.fileEnabled) {
        const date = new Date(logEntry.timestamp).toISOString().split('T')[0];
        const logFile = path.join(this.apiLogDir, `api-${date}.json`);

        // Мы будем писать каждую запись в новой строке для удобства анализа
        const logLine = JSON.stringify(logEntry) + '\n';
        fs.appendFile(logFile, logLine, (err) => {
          if (err) {
            console.error(`Failed to write API log to file ${logFile}:`, err);
          }
        });
      }
    } catch (error) {
      console.error('Error logging API request:', error);
    }
  }

  // Получение последних API логов из памяти
  public getApiLogs(limit = 100): ApiLogEntry[] {
    return this.apiLogs.slice(-limit);
  }
}

// Создаем инстанс логгера
export const logger = Logger.getInstance();

// Middleware для логирования HTTP запросов
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Генерируем уникальный ID запроса
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  res.locals.requestId = requestId;
  res.locals.startTime = Date.now();

  // Устанавливаем заголовок для отслеживания запросов
  res.setHeader('X-Request-ID', requestId);

  // Логируем начало запроса
  const logMessage = `HTTP ${req.method} ${req.originalUrl || req.url}`;
  const logContext = {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: (req as any).userId // Если middleware авторизации установил userId
  };

  logger.info(logMessage, logContext);

  // Перехватываем событие завершения ответа
  res.on('finish', () => {
    const responseTime = Date.now() - res.locals.startTime;
    const apiLogEntry: ApiLogEntry = {
      requestId,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      responseTime,
      ip: req.ip,
      userId: (req as any).userId,
      userAgent: req.headers['user-agent'] as string,
    };

    // Если это JSON API запрос, записываем тело запроса и ответа
    if (req.is('application/json') && req.method !== 'GET') {
      apiLogEntry.requestBody = req.body;
    }

    // Логируем детали ответа
    logger.info(`HTTP ${req.method} ${req.originalUrl} ${res.statusCode} ${responseTime}ms`, {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip
    });

    // Сохраняем API лог
    logger.logApiRequest(apiLogEntry);
  });

  next();
};

// Middleware для логирования ошибок
export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction) => {
  const requestId = res.locals.requestId || `err_${Date.now()}`;

  logger.error(`Error in request: ${err.message}`, {
    requestId,
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    userId: (req as any).userId
  });

  next(err);
};

export default logger;
