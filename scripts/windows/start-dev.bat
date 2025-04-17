@echo off
REM Скрипт для запуска сервера разработки с отладкой в Windows

REM Создаем директории для логов, если их нет
if not exist logs mkdir logs
if not exist logs\api mkdir logs\api
if not exist server\logs mkdir server\logs
if not exist server\logs\api mkdir server\logs\api

REM Установка переменных окружения
set NODE_ENV=development
set LOG_LEVEL=debug
set VITE_DEBUG=true

REM Запуск процессов в отдельных консолях
echo Запуск frontend и backend серверов...

REM Запускаем frontend в отдельной консоли
start "EDO Frontend" cmd /k "title EDO Frontend && set NODE_ENV=development && set VITE_DEBUG=true && bun run dev"

REM Небольшая пауза для последовательного запуска
timeout /t 2 > nul

REM Запускаем backend в отдельной консоли
start "EDO Backend" cmd /k "title EDO Backend && cd server && set NODE_ENV=development && set LOG_LEVEL=debug && set PORT=5000 && bun run dev:no-db"

echo.
echo ✅ Серверы запущены
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:5000/api
echo Backend Health: http://localhost:5000/health
echo.
echo Для остановки серверов, закройте открытые окна консоли.

REM Ждем нажатия клавиши
pause
