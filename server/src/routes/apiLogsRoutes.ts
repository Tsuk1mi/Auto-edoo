import express from 'express';
import fs from 'fs';
import path from 'path';
import { logger, LogLevel } from '../utils/logger';
import { protect as authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();
const logsDir = path.join(process.cwd(), 'logs');
const apiLogsDir = path.join(logsDir, 'api');

// Создаем директории для логов, если они не существуют
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  if (!fs.existsSync(apiLogsDir)) {
    fs.mkdirSync(apiLogsDir, { recursive: true });
  }
} catch (error) {
  logger.error('Failed to create log directories', { error });
}

// Получение списка файлов с API логами
router.get('/api-logs', authMiddleware, async (req, res) => {
  try {
    logger.debug('API logs request', {
      userId: req.userId,
      query: req.query
    });

    // Проверяем, есть ли директория API логов
    if (!fs.existsSync(apiLogsDir)) {
      return res.status(404).json({
        success: false,
        message: 'API logs directory not found'
      });
    }

    // Получаем параметры запроса
    const date = req.query.date as string || new Date().toISOString().split('T')[0];
    const limit = Number.parseInt(req.query.limit as string || '100', 10);
    const page = Number.parseInt(req.query.page as string || '1', 10);
    const statusFilter = req.query.status ? Number.parseInt(req.query.status as string, 10) : undefined;
    const pathFilter = req.query.path as string;
    const methodFilter = req.query.method as string;

    // Получаем имя файла API логов
    const apiLogFileName = `api-${date}.log`;
    const apiLogFilePath = path.join(apiLogsDir, apiLogFileName);

    if (!fs.existsSync(apiLogFilePath)) {
      logger.debug('API log file not found', {
        date,
        filePath: apiLogFilePath
      });
      return res.json({
        success: true,
        data: {
          logs: [],
          meta: {
            total: 0,
            page,
            limit,
            pages: 0
          }
        }
      });
    }

    // Читаем содержимое файла
    const logContent = fs.readFileSync(apiLogFilePath, 'utf8');

    // Разбираем логи (формат JSON)
    let logs = logContent
      .split('\n')
      .filter(Boolean)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          logger.warn('Failed to parse API log line', { line });
          return null;
        }
      })
      .filter(Boolean);

    // Применяем фильтры
    if (statusFilter) {
      logs = logs.filter(log => log.status === statusFilter);
    }
    if (pathFilter) {
      logs = logs.filter(log => log.path && log.path.includes(pathFilter));
    }
    if (methodFilter) {
      logs = logs.filter(log => log.method === methodFilter);
    }

    // Сортируем от новых к старым
    logs.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Пагинация
    const total = logs.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = logs.slice(startIndex, endIndex);

    logger.debug('API logs retrieved', {
      date,
      total,
      filtered: logs.length
    });

    res.json({
      success: true,
      data: {
        logs: paginatedLogs,
        meta: {
          total,
          page,
          limit,
          pages
        }
      }
    });
  } catch (error: any) {
    logger.error('Error getting API logs', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get API logs',
      error: error.message
    });
  }
});

// Получение статистики по API запросам
router.get('/api-stats', authMiddleware, async (req, res) => {
  try {
    logger.debug('API stats request', {
      userId: req.userId,
      query: req.query
    });

    // Проверяем, есть ли директория API логов
    if (!fs.existsSync(apiLogsDir)) {
      return res.status(404).json({
        success: false,
        message: 'API logs directory not found'
      });
    }

    // Получаем параметры запроса
    const date = req.query.date as string || new Date().toISOString().split('T')[0];

    // Получаем имя файла API логов
    const apiLogFileName = `api-${date}.log`;
    const apiLogFilePath = path.join(apiLogsDir, apiLogFileName);

    if (!fs.existsSync(apiLogFilePath)) {
      logger.debug('API log file not found for stats', {
        date,
        filePath: apiLogFilePath
      });
      return res.json({
        success: true,
        data: {
          stats: {
            totalRequests: 0,
            methods: {},
            statusCodes: {},
            endpoints: {},
            averageResponseTime: 0,
            slowestEndpoints: [],
            errorsCount: 0
          }
        }
      });
    }

    // Читаем содержимое файла
    const logContent = fs.readFileSync(apiLogFilePath, 'utf8');

    // Разбираем логи
    const logs = logContent
      .split('\n')
      .filter(Boolean)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);

    // Собираем статистику
    const totalRequests = logs.length;
    const methods: Record<string, number> = {};
    const statusCodes: Record<string, number> = {};
    const endpoints: Record<string, { count: number, totalTime: number, avgTime: number }> = {};
    let totalResponseTime = 0;
    let errorsCount = 0;

    logs.forEach(log => {
      // Методы
      methods[log.method] = (methods[log.method] || 0) + 1;

      // Статус коды
      statusCodes[log.status] = (statusCodes[log.status] || 0) + 1;

      // Ошибки
      if (log.status >= 400) {
        errorsCount++;
      }

      // Время ответа
      if (log.responseTime) {
        totalResponseTime += log.responseTime;

        // Эндпоинты
        // Извлекаем базовый путь без параметров
        const basePath = log.path.split('?')[0];
        if (!endpoints[basePath]) {
          endpoints[basePath] = { count: 0, totalTime: 0, avgTime: 0 };
        }
        endpoints[basePath].count++;
        endpoints[basePath].totalTime += log.responseTime;
        endpoints[basePath].avgTime = endpoints[basePath].totalTime / endpoints[basePath].count;
      }
    });

    // Средне время ответа
    const averageResponseTime = totalRequests > 0
      ? Math.round(totalResponseTime / totalRequests)
      : 0;

    // Самые медленные эндпоинты
    const slowestEndpoints = Object.entries(endpoints)
      .map(([path, data]) => ({
        path,
        avgResponseTime: data.avgTime,
        count: data.count
      }))
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, 5);

    logger.debug('API stats generated', {
      date,
      totalRequests,
      errorsCount
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalRequests,
          methods,
          statusCodes,
          endpoints: Object.fromEntries(
            Object.entries(endpoints).map(([path, data]) => [
              path,
              {
                count: data.count,
                avgResponseTime: Math.round(data.avgTime)
              }
            ])
          ),
          averageResponseTime,
          slowestEndpoints,
          errorsCount
        }
      }
    });
  } catch (error: any) {
    logger.error('Error getting API stats', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get API stats',
      error: error.message
    });
  }
});

// Получение содержимого лог-файла приложения
router.get('/app-logs', authMiddleware, async (req, res) => {
  try {
    logger.debug('App logs request', {
      userId: req.userId,
      query: req.query
    });

    // Получаем параметры запроса
    const date = req.query.date as string || new Date().toISOString().split('T')[0];
    const logType = (req.query.type as string || 'app') === 'error' ? 'error' : 'app';
    const limit = Number.parseInt(req.query.limit as string || '500', 10);
    const level = req.query.level as string;

    // Получаем имя файла логов
    const logFileName = `${logType}-${date}.log`;
    const logFilePath = path.join(logsDir, logFileName);

    if (!fs.existsSync(logFilePath)) {
      logger.debug('App log file not found', {
        date,
        logType,
        filePath: logFilePath
      });
      return res.json({
        success: true,
        data: {
          logs: [],
          meta: {
            fileName: logFileName,
            date,
            logType
          }
        }
      });
    }

    // Читаем содержимое файла
    const logContent = fs.readFileSync(logFilePath, 'utf8');

    // Разбираем логи (построчно)
    const logLines = logContent.split('\n').filter(Boolean);

    // Применяем фильтр уровня логирования
    let filteredLogs = logLines;
    if (level && Object.values(LogLevel).includes(level as LogLevel)) {
      filteredLogs = logLines.filter(line => line.includes(`[${level}]`));
    }

    // Ограничиваем количество возвращаемых логов
    const logs = filteredLogs.slice(-limit);

    logger.debug('App logs retrieved', {
      date,
      logType,
      total: logLines.length,
      filtered: filteredLogs.length,
      returned: logs.length
    });

    res.json({
      success: true,
      data: {
        logs,
        meta: {
          fileName: logFileName,
          date,
          logType,
          total: logLines.length,
          returned: logs.length
        }
      }
    });
  } catch (error: any) {
    logger.error('Error getting app logs', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get application logs',
      error: error.message
    });
  }
});

export default router;
