#!/bin/bash
# Скрипт для сборки и развертывания приложения

# Переменные окружения - измените их при необходимости
FRONTEND_BUILD_DIR="dist"
BACKEND_BUILD_DIR="server/dist"
DEPLOY_DIR="../deploy"

# Функция для показа помощи
show_help() {
  echo "Использование: $0 [опции]"
  echo "Опции:"
  echo "  -h, --help        Показать эту справку"
  echo "  -f, --frontend    Собрать только frontend"
  echo "  -b, --backend     Собрать только backend"
  echo "  -a, --all         Собрать все (frontend и backend) - по умолчанию"
  echo "  -d, --deploy      Переместить сборку в папку деплоя"
  echo ""
  echo "Примеры:"
  echo "  $0 -a -d          Собрать все и подготовить к деплою"
  echo "  $0 -f             Собрать только frontend"
}

# Парсинг аргументов
BUILD_FRONTEND=false
BUILD_BACKEND=false
DEPLOY=false

if [ $# -eq 0 ]; then
  BUILD_FRONTEND=true
  BUILD_BACKEND=true
fi

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_help
      exit 0
      ;;
    -f|--frontend)
      BUILD_FRONTEND=true
      shift
      ;;
    -b|--backend)
      BUILD_BACKEND=true
      shift
      ;;
    -a|--all)
      BUILD_FRONTEND=true
      BUILD_BACKEND=true
      shift
      ;;
    -d|--deploy)
      DEPLOY=true
      shift
      ;;
    *)
      echo "Неизвестная опция: $1"
      show_help
      exit 1
      ;;
  esac
done

# Очистить предыдущие сборки
clean_dist() {
  echo "🧹 Очистка предыдущих сборок..."
  if [ -d "$FRONTEND_BUILD_DIR" ]; then
    rm -rf "$FRONTEND_BUILD_DIR"
  fi
  if [ -d "$BACKEND_BUILD_DIR" ]; then
    rm -rf "$BACKEND_BUILD_DIR"
  fi
}

# Сборка frontend
build_frontend() {
  echo "🔨 Сборка frontend..."
  # Обновляем зависимости
  bun install

  # Проверяем наличие ошибок типизации
  echo "🔍 Проверка типизации..."
  bun run tsc --noEmit

  if [ $? -ne 0 ]; then
    echo "❌ Ошибки типизации. Сборка прервана."
    exit 1
  fi

  # Сборка проекта
  echo "📦 Запуск сборки frontend..."
  bun run build

  if [ $? -ne 0 ]; then
    echo "❌ Ошибка сборки frontend. Процесс прерван."
    exit 1
  fi

  echo "✅ Frontend собран успешно!"
}

# Сборка backend
build_backend() {
  echo "🔨 Сборка backend..."
  cd server

  # Обновляем зависимости
  bun install

  # Проверяем наличие ошибок типизации
  echo "🔍 Проверка типизации..."
  bun run tsc --noEmit

  if [ $? -ne 0 ]; then
    echo "❌ Ошибки типизации. Сборка прервана."
    cd ..
    exit 1
  fi

  # Сборка проекта
  echo "📦 Запуск сборки backend..."
  bun run build

  if [ $? -ne 0 ]; then
    echo "❌ Ошибка сборки backend. Процесс прерван."
    cd ..
    exit 1
  fi

  cd ..
  echo "✅ Backend собран успешно!"
}

# Подготовка деплоя
prepare_deploy() {
  echo "🚀 Подготовка к деплою..."

  # Создаем папку деплоя, если ее нет
  mkdir -p "$DEPLOY_DIR"

  # Копируем frontend
  if [ -d "$FRONTEND_BUILD_DIR" ]; then
    echo "📋 Копирование frontend..."
    cp -r "$FRONTEND_BUILD_DIR" "$DEPLOY_DIR/"
  fi

  # Копируем backend
  if [ -d "$BACKEND_BUILD_DIR" ]; then
    echo "📋 Копирование backend..."
    mkdir -p "$DEPLOY_DIR/server"
    cp -r "$BACKEND_BUILD_DIR" "$DEPLOY_DIR/server/"

    # Копируем package.json и другие необходимые файлы
    cp server/package.json "$DEPLOY_DIR/server/"
    cp server/.env.production "$DEPLOY_DIR/server/.env" 2>/dev/null || echo "⚠️ .env.production не найден. Используйте свой файл .env для продакшена"
  fi

  # Копируем docker-compose для продакшена, если он существует
  if [ -f "docker-compose.prod.yml" ]; then
    cp docker-compose.prod.yml "$DEPLOY_DIR/docker-compose.yml"
  else
    cp docker-compose.yml "$DEPLOY_DIR/docker-compose.yml"
    echo "⚠️ docker-compose.prod.yml не найден. Используется стандартный docker-compose.yml"
  fi

  echo "✅ Деплой подготовлен в папке $DEPLOY_DIR"
}

# Основная логика
clean_dist

if [ "$BUILD_FRONTEND" = true ]; then
  build_frontend
fi

if [ "$BUILD_BACKEND" = true ]; then
  build_backend
fi

if [ "$DEPLOY" = true ]; then
  prepare_deploy
fi

echo "🎉 Сборка завершена!"
