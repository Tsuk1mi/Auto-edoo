@echo off
REM Скрипт для управления Docker-контейнерами

REM Проверяем, установлен ли Docker
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [Ошибка] Docker не установлен. Пожалуйста, установите Docker Desktop.
    pause
    exit /b 1
)

:menu
cls
echo ===== Управление Docker для проекта EDO =====
echo.
echo  1. Запустить все контейнеры
echo  2. Остановить все контейнеры
echo  3. Перезапустить все контейнеры
echo  4. Показать статус контейнеров
echo  5. Показать логи MongoDB
echo  6. Показать логи Backend
echo  7. Показать логи Mongo Express
echo  8. Проверить здоровье сервисов
echo  9. Удалить все контейнеры (с сохранением данных)
echo  0. Выход
echo.
set /p choice="Выберите опцию (0-9): "

if "%choice%"=="1" goto start_containers
if "%choice%"=="2" goto stop_containers
if "%choice%"=="3" goto restart_containers
if "%choice%"=="4" goto show_status
if "%choice%"=="5" goto show_mongo_logs
if "%choice%"=="6" goto show_backend_logs
if "%choice%"=="7" goto show_mongo_express_logs
if "%choice%"=="8" goto check_health
if "%choice%"=="9" goto remove_containers
if "%choice%"=="0" goto end

echo Некорректный выбор. Пожалуйста, выберите 0-9.
timeout /t 2 >nul
goto menu

:start_containers
echo.
echo Запуск всех контейнеров...
docker-compose up -d
timeout /t 3 >nul
goto menu

:stop_containers
echo.
echo Остановка всех контейнеров...
docker-compose stop
timeout /t 3 >nul
goto menu

:restart_containers
echo.
echo Перезапуск всех контейнеров...
docker-compose restart
timeout /t 3 >nul
goto menu

:show_status
echo.
echo Статус контейнеров:
docker-compose ps
pause
goto menu

:show_mongo_logs
echo.
echo Логи MongoDB (нажмите Ctrl+C для выхода):
docker-compose logs --tail=50 -f mongodb
goto menu

:show_backend_logs
echo.
echo Логи Backend (нажмите Ctrl+C для выхода):
docker-compose logs --tail=50 -f backend
goto menu

:show_mongo_express_logs
echo.
echo Логи Mongo Express (нажмите Ctrl+C для выхода):
docker-compose logs --tail=50 -f mongo-express
goto menu

:check_health
echo.
echo Проверка здоровья сервисов...
echo.
echo MongoDB:
docker inspect --format='{{.State.Health.Status}}' edo-mongodb
echo.
echo Backend:
docker inspect --format='{{.State.Health.Status}}' edo-backend
echo.
echo Mongo Express:
docker inspect --format='{{.State.Status}}' edo-mongo-express
echo.
pause
goto menu

:remove_containers
echo.
echo Внимание! Это действие удалит все контейнеры, но сохранит данные.
set /p confirm="Вы уверены, что хотите продолжить? (y/n): "
if /i "%confirm%"=="y" (
    echo Удаление контейнеров...
    docker-compose down
    echo Контейнеры удалены.
) else (
    echo Операция отменена.
)
timeout /t 3 >nul
goto menu

:end
echo.
echo Выход из программы.
exit /b 0
