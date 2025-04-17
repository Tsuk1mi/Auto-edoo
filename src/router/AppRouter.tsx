import { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authEvents } from '@/api/api';
import { logger } from '@/utils/logger';
import { hasAccess } from '@/types/User';

// Макеты
const MainLayout = lazy(() => import('@/components/layout/MainLayout'));

// Страницы
const HomePage = lazy(() => import('@/pages/Home'));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const DocumentListPage = lazy(() => import('@/features/documents/pages/DocumentList'));
const CreateDocumentPage = lazy(() => import('@/features/documents/pages/CreateDocument'));
const OutboxDocumentsPage = lazy(() => import('@/features/documents/pages/OutboxDocuments'));
const AutomationPage = lazy(() => import('@/features/automation/pages/Automation'));
const SettingsPage = lazy(() => import('@/features/settings/pages/Settings'));
const InventoryPage = lazy(() => import('@/features/inventory/pages/Inventory'));
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboard'));

// Запасной вариант во время ленивой загрузки
const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-gray-900">
    <div className="text-blue-400 text-xl">Загрузка...</div>
  </div>
);

// Обертка для защищенного маршрута
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, checkAuth, isLoading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  logger.debug('ProtectedRoute rendered', {
    path: location.pathname,
    token: !!token,
    isChecking,
    isLoading
  });

  useEffect(() => {
    // Функция для проверки аутентификации
    const verifyAuth = async () => {
      try {
        logger.debug('Verifying authentication', { token: !!token });

        if (!token) {
          logger.warn('No token found during auth verification');
          setIsAuthenticated(false);
          setIsChecking(false);
          return;
        }

        // Если есть токен, проверяем его валидность
        const isValid = await checkAuth();
        logger.debug('Token validation result', { isValid });

        setIsAuthenticated(isValid);
        setIsChecking(false);

        // Если токен невалиден, это будет обработано в редиректе ниже
        if (!isValid) {
          logger.warn('Token is invalid during verification');
        }
      } catch (error) {
        logger.error('Auth check failed', {
          error: error instanceof Error ? error.message : String(error)
        });
        setIsAuthenticated(false);
        setIsChecking(false);
      }
    };

    // Проверяем аутентификацию только если не находимся на странице логина
    if (!location.pathname.includes('/login')) {
      verifyAuth();
    } else {
      setIsChecking(false);
    }

    // Подписываемся на событие ошибки авторизации
    const handleUnauthorized = () => {
      logger.warn('Unauthorized event received');
      setIsAuthenticated(false);
      setIsChecking(false);

      // Перенаправляем на страницу логина, если получили событие о необходимости авторизации
      if (location.pathname !== '/login') {
        navigate('/login', { state: { from: location }, replace: true });
      }
    };

    authEvents.unauthorized.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      authEvents.unauthorized.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [token, checkAuth, location, navigate]);

  // Показываем загрузку во время проверки аутентификации
  if (isChecking || isLoading) {
    return <LoadingFallback />;
  }

  // Если токена нет или токен невалиден, перенаправляем на страницу авторизации
  if (!token || !isAuthenticated) {
    logger.info('Redirecting to login', {
      path: location.pathname,
      hasToken: !!token,
      isAuthenticated
    });

    // Важно: используем Navigate вместо useNavigate для исключения побочных эффектов
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Если токен есть и он валиден, отображаем защищенный контент
  logger.debug('Rendering protected content', { path: location.pathname });
  return <>{children}</>;
};

// Обертка для маршрутов, требующих специальных прав доступа
const RoleProtectedRoute = ({
  accessRight,
  children
}: {
  accessRight: string;
  children: React.ReactNode
}) => {
  const { user } = useAuthStore();
  const location = useLocation();

  // Проверяем наличие прав доступа
  if (!hasAccess(user, accessRight as any)) {
    logger.warn(`Access denied to ${location.pathname} - missing right: ${accessRight}`);
    // Редирект на главную, если нет прав
    return <Navigate to="/" replace />;
  }

  // Отображаем защищенный контент
  return <>{children}</>;
};

// Компонент для защиты маршрута логина от уже авторизованных пользователей
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, isLoading } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Отладка
  logger.debug('PublicOnlyRoute check', {
    hasToken: !!token,
    isLoading,
    pathname: location.pathname,
    state: location.state
  });

  // Ждем, пока загрузка закончится
  if (isLoading) {
    return <LoadingFallback />;
  }

  // Если пользователь авторизован, перенаправляем на главную или предыдущую страницу
  useEffect(() => {
    if (token) {
      logger.debug('Redirecting authenticated user from public route', {
        from: location.pathname,
        state: location.state
      });

      // Перенаправляем на запрошенный ранее путь или на главную
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [token, navigate, location]);

  // Если пользователь не авторизован, показываем публичный контент
  if (!token) {
    return <>{children}</>;
  }

  // Пока происходит перенаправление, показываем Fallback
  return <LoadingFallback />;
};

export const AppRouter = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Публичные маршруты */}
        <Route path="/login" element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        } />
        <Route path="/register" element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        } />

        {/* Защищенные маршруты */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="documents" element={<DocumentListPage />} />
          <Route path="documents/create" element={<CreateDocumentPage />} />
          <Route path="outbox" element={<OutboxDocumentsPage />} />
          <Route path="automation" element={<AutomationPage />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* Новый маршрут для инвентаризации - доступен только с правом canViewInventory */}
          <Route path="inventory" element={
            <RoleProtectedRoute accessRight="canViewInventory">
              <InventoryPage />
            </RoleProtectedRoute>
          } />

          {/* Новый маршрут для админки - доступен только с правом canAccessAdmin */}
          <Route path="admin" element={
            <RoleProtectedRoute accessRight="canAccessAdmin">
              <AdminDashboardPage />
            </RoleProtectedRoute>
          } />
        </Route>

        {/* Маршрут для неизвестных путей */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
