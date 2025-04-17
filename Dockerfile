# Многоэтапная сборка для оптимизации размера образа
FROM oven/bun:latest as development

WORKDIR /app

# Кэширование зависимостей
COPY package.json bun.lock ./
RUN bun install

# Копирование остальных файлов (для режима разработки)
COPY . .

EXPOSE 5173

# Команда для разработки - dev сервер будет перезагружаться при изменении файлов
CMD ["bun", "run", "dev"]

# Этап сборки для продакшена
FROM oven/bun:latest as build

WORKDIR /app

# Копирование и установка зависимостей
COPY package.json bun.lock ./
RUN bun install

# Копирование исходных файлов для сборки
COPY . .

# Сборка приложения
RUN bun run build

# Финальный этап для продакшена
FROM node:20-alpine as production

WORKDIR /app

# Установка nginx для более эффективной раздачи статических файлов
RUN apk add --no-cache nginx

# Копирование собранных файлов из этапа сборки
COPY --from=build /app/dist /usr/share/nginx/html

# Копирование конфигурации nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Запуск nginx в foreground режиме
CMD ["nginx", "-g", "daemon off;"]
