@echo off
REM Скрипт для сборки и деплоя приложения в Windows

REM Переменные окружения - измените их при необходимости
set FRONTEND_BUILD_DIR=dist
set BACKEND_BUILD_DIR=server\dist
set DEPLOY_DIR=..\deploy

REM Обработка аргументов командной строки
set BUILD_FRONTEND=false
set BUILD_BACKEND=false
set DEPLOY=false

REM Если нет аргументов, собираем всё
if "%~1"=="" (
    set BUILD_FRONTEND=true
    set BUILD_BACKEND=true
)

:parse_args
if "%~1"=="" goto :end_parse_args

if /i "%~1"=="-h" goto :show_help
if /i "%~1"=="--help" goto :show_help
if /i "%~1"=="-f" set BUILD_FRONTEND=true
if /i "%~1"=="--frontend" set BUILD_FRONTEND=true
if /i "%~1"=="-b" set BUILD_BACKEND=true
if /i "%~1"=="--backend" set BUILD_BACKEND=true
if /i "%~1"=="-a" (
    set BUILD_FRONTEND=true
    set BUILD_BACKEND=true
)
if /i "%~1"=="--all" (
    set BUILD_FRONTEND=true
    set BUILD_BACKEND=true
)
if /i "%~1"=="-d" set DEPLOY=true
if /i "%~1"=="--deploy" set DEPLOY=true

shift
goto :parse_args

:show_help
echo Использование: %0 [опции]
echo Опции:
echo   -h, --help        Показать эту справку
echo   -f, --frontend    Собрать только frontend
echo   -b, --backend     Собрать только backend
echo   -a, --all         Собрать все (frontend и backend) - по умолчанию
echo   -d, --deploy      Переместить сборку в папку деплоя
echo.
echo Примеры:
echo   %0 -a -d          Собрать все и подготовить к деплою
echo   %0 -f             Собрать только frontend
exit /b 0

:end_parse_args

REM Очистить предыдущие сборки
echo 🧹 Очистка предыдущих сборок...
if exist "%FRONTEND_BUILD_DIR%" rmdir /s /q "%FRONTEND_BUILD_DIR%"
if exist "%BACKEND_BUILD_DIR%" rmdir /s /q "%BACKEND_BUILD_DIR%"

REM Сборка frontend
if "%BUILD_FRONTEND%"=="true" (
    echo 🔨 Сборка frontend...

    REM Обновляем зависимости
    call bun install

    REM Проверяем наличие ошибок типизации
    echo 🔍 Проверка типизации...
    call bun run tsc --noEmit

    if %ERRORLEVEL% neq 0 (
        echo ❌ Ошибки типизации. Сборка прервана.
        exit /b 1
    )

    REM Сборка проекта
    echo 📦 Запуск сборки frontend...
    call bun run build

    if %ERRORLEVEL% neq 0 (
        echo ❌ Ошибка сборки frontend. Процесс прерван.
        exit /b 1
    )

    echo ✅ Frontend собран успешно!
)

REM Сборка backend
if "%BUILD_BACKEND%"=="true" (
    echo 🔨 Сборка backend...
    cd server

    REM Обновляем зависимости
    call bun install

    REM Проверяем наличие ошибок типизации
    echo 🔍 Проверка типизации...
    call bun run tsc --noEmit

    if %ERRORLEVEL% neq 0 (
        echo ❌ Ошибки типизации. Сборка прервана.
        cd ..
        exit /b 1
    )

    REM Сборка проекта
    echo 📦 Запуск сборки backend...
    call bun run build

    if %ERRORLEVEL% neq 0 (
        echo ❌ Ошибка сборки backend. Процесс прерван.
        cd ..
        exit /b 1
    )

    cd ..
    echo ✅ Backend собран успешно!
)

REM Подготовка деплоя
if "%DEPLOY%"=="true" (
    echo 🚀 Подготовка к деплою...

    REM Создаем папку деплоя, если ее нет
    if not exist "%DEPLOY_DIR%" mkdir "%DEPLOY_DIR%"

    REM Копируем frontend
    if exist "%FRONTEND_BUILD_DIR%" (
        echo 📋 Копирование frontend...
        xcopy /E /I /Y "%FRONTEND_BUILD_DIR%" "%DEPLOY_DIR%\%FRONTEND_BUILD_DIR%"
    )

    REM Копируем backend
    if exist "%BACKEND_BUILD_DIR%" (
        echo 📋 Копирование backend...
        if not exist "%DEPLOY_DIR%\server" mkdir "%DEPLOY_DIR%\server"
        xcopy /E /I /Y "%BACKEND_BUILD_DIR%" "%DEPLOY_DIR%\%BACKEND_BUILD_DIR%"

        REM Копируем package.json и другие необходимые файлы
        copy /Y "server\package.json" "%DEPLOY_DIR%\server\"
        copy /Y "server\.env.production" "%DEPLOY_DIR%\server\.env" 2>nul
        if %ERRORLEVEL% neq 0 (
            echo ⚠️ .env.production не найден. Используйте свой файл .env для продакшена
        )
    )

    REM Копируем docker-compose для продакшена, если он существует
    if exist "docker-compose.prod.yml" (
        copy /Y "docker-compose.prod.yml" "%DEPLOY_DIR%\docker-compose.yml"
    ) else (
        copy /Y "docker-compose.yml" "%DEPLOY_DIR%\docker-compose.yml"
        echo ⚠️ docker-compose.prod.yml не найден. Используется стандартный docker-compose.yml
    )

    echo ✅ Деплой подготовлен в папке %DEPLOY_DIR%
)

echo 🎉 Сборка завершена!
pause
