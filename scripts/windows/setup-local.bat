@echo off
REM Скрипт для настройки локальной среды разработки в Windows

echo === Настройка локальной среды разработки ===

REM Создаем директории, если их нет
echo Создание директорий для логов...
if not exist logs mkdir logs
if not exist logs\api mkdir logs\api
if not exist server\logs mkdir server\logs
if not exist server\logs\api mkdir server\logs\api
if not exist mongo-init mkdir mongo-init

REM Проверяем наличие Docker и Docker Compose
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [Ошибка] Docker не установлен. Пожалуйста, установите Docker Desktop.
    exit /b 1
)

where docker-compose >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [Информация] Docker Compose не обнаружен через where, но может быть доступен через docker compose...
    docker compose version >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo [Ошибка] Docker Compose не установлен. Пожалуйста, установите Docker Desktop с Docker Compose.
        exit /b 1
    ) else (
        echo [Информация] Docker Compose доступен через команду docker compose.
    )
)

REM Устанавливаем зависимости
echo.
echo Установка зависимостей frontend...
call bun install

echo.
echo Установка зависимостей backend...
cd server
call bun install
cd ..

REM Запускаем Docker Compose
echo.
echo Запуск Docker Compose...
docker-compose up -d

REM Проверяем состояние сервисов
echo.
echo Проверка состояния сервисов...
docker-compose ps

echo.
echo ===================================
echo Настройка локальной среды завершена
echo ===================================
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:5000/api
echo MongoDB: mongodb://localhost:27017
echo MongoDB Express: http://localhost:8081
echo.
echo Логин администратора: admin@example.com
echo Пароль администратора: admin123
echo ===================================

pause
