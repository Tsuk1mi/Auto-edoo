#!/bin/bash
# Скрипт для запуска сервера разработки с отладкой

# Создаем директории для логов, если их нет
mkdir -p logs
mkdir -p logs/api
mkdir -p server/logs
mkdir -p server/logs/api

# Функция очистки при завершении
cleanup() {
  echo ""
  echo "🛑 Остановка серверов..."
  kill $FRONTEND_PID 2>/dev/null
  kill $BACKEND_PID 2>/dev/null
  exit 0
}

# Отлавливаем прерывание (Ctrl+C)
trap cleanup SIGINT SIGTERM

# Запускаем frontend и backend одновременно
echo "🚀 Запуск frontend сервера..."
NODE_ENV=development \
VITE_DEBUG=true \
bun run dev &
FRONTEND_PID=$!

echo "🚀 Запуск backend сервера..."
cd server && \
NODE_ENV=development \
LOG_LEVEL=debug \
PORT=5000 \
bun run dev:no-db &
BACKEND_PID=$!
cd ..

echo "✅ Серверы запущены"
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:5000/api"
echo "Backend Health: http://localhost:5000/health"
echo ""
echo "📋 Логи:"

# Бесконечный цикл для поддержания скрипта активным
while true; do
  # Проверяем, живы ли процессы
  if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Frontend сервер остановлен!"
    cleanup
  fi

  if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend сервер остановлен!"
    cleanup
  fi

  sleep 2
done
