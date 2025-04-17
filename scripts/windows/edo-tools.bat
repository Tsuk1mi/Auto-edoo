@echo off
REM EDO Инструменты разработчика - Мастер-скрипт для Windows

:menu
cls
echo ========================================
echo      EDO ИНСТРУМЕНТЫ РАЗРАБОТЧИКА
echo ========================================
echo.
echo  1. Настройка локальной среды
echo  2. Запуск серверов разработки
echo  3. Управление Docker-контейнерами
echo  4. Сборка и деплой
echo  5. Очистка временных файлов
echo  0. Выход
echo.
set /p choice="Выберите опцию (0-5): "

if "%choice%"=="1" goto setup_local
if "%choice%"=="2" goto start_dev
if "%choice%"=="3" goto docker_manage
if "%choice%"=="4" goto build_deploy
if "%choice%"=="5" goto clean_temp
if "%choice%"=="0" goto end

echo Некорректный выбор. Пожалуйста, выберите 0-5.
timeout /t 2 >nul
goto menu

:setup_local
call setup-local.bat
goto menu

:start_dev
call start-dev.bat
goto menu

:docker_manage
call docker-manage.bat
goto menu

:build_deploy
echo.
echo === Сборка и деплой ===
echo.
echo  1. Собрать только frontend
echo  2. Собрать только backend
echo  3. Собрать все
echo  4. Собрать все и подготовить деплой
echo  0. Назад
echo.
set /p build_choice="Выберите опцию (0-4): "

if "%build_choice%"=="1" call build-deploy.bat -f
if "%build_choice%"=="2" call build-deploy.bat -b
if "%build_choice%"=="3" call build-deploy.bat -a
if "%build_choice%"=="4" call build-deploy.bat -a -d
if "%build_choice%"=="0" goto menu

goto menu

:clean_temp
echo.
echo === Очистка временных файлов ===
echo.

echo Очистка node_modules и временных файлов...
if exist node_modules rmdir /s /q node_modules
if exist server\node_modules rmdir /s /q server\node_modules
if exist dist rmdir /s /q dist
if exist server\dist rmdir /s /q server\dist
if exist .vite rmdir /s /q .vite
if exist npm-debug.log del /q npm-debug.log
if exist server\npm-debug.log del /q server\npm-debug.log

echo Очистка кэшей...
if exist .cache rmdir /s /q .cache

echo Переустановка зависимостей...
call bun install
cd server && call bun install && cd ..

echo Очистка завершена!
pause
goto menu

:end
echo.
echo Выход из программы.
exit /b 0
