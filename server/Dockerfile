# Многоэтапная сборка для бэкенда

# Этап разработки
FROM oven/bun:latest as development

WORKDIR /app

# Копирование файлов зависимостей
COPY package.json bun.lock ./
RUN bun install

# Копирование исходных файлов
COPY . .

# Проверка здоровья для docker-compose
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

EXPOSE 5000

# Команда для запуска в режиме разработки
CMD ["bun", "--watch", "src/index.ts"]

# Этап сборки для продакшн
FROM oven/bun:latest as build

WORKDIR /app

# Копирование файлов зависимостей и их установка
COPY package.json bun.lock ./
RUN bun install --production

# Копирование исходных файлов и сборка
COPY . .
RUN bun run build

# Финальный этап для продакшн
FROM oven/bun:latest as production

WORKDIR /app

# Создание пользователя без привилегий
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunjs

# Установка только продакшн зависимостей
COPY --from=build /app/package.json /app/bun.lock ./
RUN bun install --production

# Копирование скомпилированных файлов из этапа сборки
COPY --from=build /app/dist ./dist

# Установка пользователя без привилегий
USER bunjs

# Проверка здоровья для Docker
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

EXPOSE 5000

# Команда для запуска в режиме продакшн
CMD ["bun", "dist/index.js"]
