/**
 * Система логирования для клиентской части приложения
 * Обеспечивает разные уровни логирования и форматирование сообщений
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  source?: string;
}

class Logger {
  private static instance: Logger;
  private logHistory: LogEntry[] = [];
  private logLevel: LogLevel = LogLevel.INFO;
  private maxHistorySize = 100;
  private shouldPersist = false;
  private persistKey = 'edo_app_logs';

  private constructor() {
    // Определяем уровень логов на основе режима работы
    if (import.meta.env.MODE === 'development') {
      this.logLevel = LogLevel.DEBUG;
      this.shouldPersist = true;
    }

    // Восстанавливаем логи из localStorage если включено персистентное хранение
    if (this.shouldPersist) {
      try {
        const savedLogs = localStorage.getItem(this.persistKey);
        if (savedLogs) {
          this.logHistory = JSON.parse(savedLogs);
        }
      } catch (error) {
        console.error('Failed to restore logs from localStorage:', error);
      }
    }

    // Логируем инициализацию системы логирования
    this.log(LogLevel.INFO, 'Logger initialized', {
      mode: import.meta.env.MODE,
      level: this.logLevel
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

  public enablePersistence(enable: boolean): void {
    this.shouldPersist = enable;
    this.log(LogLevel.INFO, `Log persistence ${enable ? 'enabled' : 'disabled'}`);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const targetLevelIndex = levels.indexOf(level);
    return targetLevelIndex >= currentLevelIndex;
  }

  public log(level: LogLevel, message: string, context?: Record<string, any>, source?: string): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      context,
      source: source || this.getCallerInfo(),
    };

    // Добавляем запись в историю и обрезаем если превышен лимит
    this.logHistory.push(logEntry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // Сохраняем в localStorage если включена персистентность
    if (this.shouldPersist) {
      try {
        localStorage.setItem(this.persistKey, JSON.stringify(this.logHistory));
      } catch (error) {
        console.error('Failed to save logs to localStorage:', error);
      }
    }

    // Отображаем логи в консоли
    this.outputToConsole(logEntry);

    // Отправляем критические логи на сервер
    if (level === LogLevel.ERROR) {
      this.sendToServer(logEntry);
    }
  }

  private outputToConsole(logEntry: LogEntry): void {
    const { level, message, context, source, timestamp } = logEntry;
    const formattedTime = new Date(timestamp).toLocaleTimeString();

    const styles = {
      [LogLevel.DEBUG]: 'color: #808080',
      [LogLevel.INFO]: 'color: #0077cc',
      [LogLevel.WARN]: 'color: #ff9900; font-weight: bold',
      [LogLevel.ERROR]: 'color: #cc0000; font-weight: bold',
    };

    console.groupCollapsed(
      `%c${level} [${formattedTime}] ${message}`,
      styles[level]
    );
    console.log(`Source: ${source || 'Unknown'}`);
    if (context) {
      console.log('Context:', context);
    }
    console.groupEnd();
  }

  private getCallerInfo(): string {
    try {
      const err = new Error();
      const stack = err.stack?.split('\n');
      // Пропускаем 3 строки (Error, getCallerInfo, log)
      if (stack && stack.length > 3) {
        const callerLine = stack[3].trim();
        return callerLine.replace(/^at /, '').substring(0, 80);
      }
    } catch (e) {
      // Игнорируем ошибки, если не удалось получить информацию
    }
    return 'Unknown';
  }

  private sendToServer(logEntry: LogEntry): void {
    // В реальном приложении здесь был бы код для отправки ошибок на сервер
    // Например, через API или сервис мониторинга ошибок
    try {
      const apiUrl = '/api/logs';
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...logEntry,
          client: {
            userAgent: navigator.userAgent,
            url: window.location.href,
            platform: navigator.platform,
            language: navigator.language,
            screenSize: `${window.screen.width}x${window.screen.height}`,
          },
        }),
      };

      // Используем fetch API для отправки логов на сервер
      // В реальном сценарии стоит добавить обработку ошибок и повторные попытки
      if (import.meta.env.PROD) {
        fetch(apiUrl, options).catch((error) => {
          console.error('Failed to send logs to server:', error);
        });
      }
    } catch (e) {
      console.error('Error sending log to server:', e);
    }
  }

  public getLogHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  public clearHistory(): void {
    this.logHistory = [];
    if (this.shouldPersist) {
      localStorage.removeItem(this.persistKey);
    }
    this.log(LogLevel.INFO, 'Log history cleared');
  }

  // Удобные методы для разных уровней логирования
  public debug(message: string, context?: Record<string, any>, source?: string): void {
    this.log(LogLevel.DEBUG, message, context, source);
  }

  public info(message: string, context?: Record<string, any>, source?: string): void {
    this.log(LogLevel.INFO, message, context, source);
  }

  public warn(message: string, context?: Record<string, any>, source?: string): void {
    this.log(LogLevel.WARN, message, context, source);
  }

  public error(message: string, context?: Record<string, any>, source?: string): void {
    this.log(LogLevel.ERROR, message, context, source);
  }
}

// Экспортируем синглтон для использования во всем приложении
export const logger = Logger.getInstance();

// Экспортируем функцию для мониторинга нежелательных событий
export function setupErrorTracking(): void {
  // Перехватываем необработанные ошибки
  window.addEventListener('error', (event) => {
    logger.error('Uncaught error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack || 'No stack available'
    });
    // Не блокируем стандартную обработку ошибок
    return false;
  });

  // Перехватываем непойманные ошибки в промисах
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection', {
      type: 'unhandledRejection',
      reason: event.reason?.toString() || String(event.reason),
    });
    // Не блокируем стандартную обработку ошибок
    return false;
  });
}
