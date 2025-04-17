import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { logger, setupErrorTracking } from './utils/logger';

// Инициализация системы логирования и отслеживания ошибок
setupErrorTracking();
logger.info('Application starting', {
  version: import.meta.env.VITE_APP_VERSION || '0.1.0',
  environment: import.meta.env.MODE,
  buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString()
});

// Create a script tag to include FontAwesome
const fontAwesomeScript = document.createElement('script');
fontAwesomeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js';
fontAwesomeScript.defer = true;
document.head.appendChild(fontAwesomeScript);

const rootElement = document.getElementById("root");
if (!rootElement) {
  logger.error("Failed to find root element");
  throw new Error("Failed to find root element");
}

// Засекаем время рендеринга для анализа производительности
const startRenderTime = performance.now();

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Логируем время, затраченное на рендеринг
window.addEventListener('load', () => {
  const renderTime = performance.now() - startRenderTime;
  logger.info('Application rendered', { renderTimeMs: Math.round(renderTime) });

  // Собираем и логируем метрики производительности
  if ('performance' in window && 'getEntriesByType' in performance) {
    try {
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationTiming) {
        logger.debug('Performance metrics', {
          dnsLookup: Math.round(navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart),
          tcpHandshake: Math.round(navigationTiming.connectEnd - navigationTiming.connectStart),
          responseTime: Math.round(navigationTiming.responseEnd - navigationTiming.responseStart),
          domProcessing: Math.round(navigationTiming.domComplete - navigationTiming.domInteractive),
          pageLoad: Math.round(navigationTiming.loadEventEnd - navigationTiming.loadEventStart)
        });
      }
    } catch (e) {
      logger.warn('Failed to collect performance metrics', { error: String(e) });
    }
  }
});
