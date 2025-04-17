#!/bin/bash
# Скрипт для настройки локальной среды разработки

# Создаем директории, если их нет
mkdir -p logs
mkdir -p logs/api
mkdir -p server/logs
mkdir -p server/logs/api
mkdir -p mongo-init

# Проверяем наличие docker и docker-compose
if ! command -v docker &> /dev/null; then
    echo "Docker не установлен. Пожалуйста, установите Docker."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose не установлен. Пожалуйста, установите Docker Compose."
    exit 1
fi

# Устанавливаем зависимости
echo "Устанавливаем зависимости frontend..."
bun install

echo "Устанавливаем зависимости backend..."
cd server && bun install && cd ..

# Запускаем Docker Compose
echo "Запускаем Docker Compose..."
docker-compose up -d

# Проверяем состояние сервисов
echo "Проверяем состояние сервисов..."
docker-compose ps

echo "==================================="
echo "Настройка локальной среды завершена"
echo "==================================="
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:5000/api"
echo "MongoDB: mongodb://localhost:27017"
echo "MongoDB Express: http://localhost:8081"
echo ""
echo "Логин администратора: admin@example.com"
echo "Пароль администратора: admin123"
echo "==================================="
