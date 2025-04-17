import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AppRouter } from './router/AppRouter';
import { logger } from '@/utils/logger';
import './index.css';

function App() {
  const { checkAuth, token } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on app load
    const initializeAuth = async () => {
      try {
        logger.debug('App: Initializing authentication check', { hasToken: !!token });

        // Проверяем аутентификацию только если есть токен
        if (token) {
          await checkAuth();
        }
      } catch (error) {
        logger.error('App: Failed to check authentication status:', {
          error: error instanceof Error ? error.message : String(error)
        });
      } finally {
        // Завершаем инициализацию в любом случае
        logger.debug('App: Authentication initialization completed');
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [checkAuth, token]);

  // Showing loading screen while checking authentication
  if (isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900">
        <div className="text-blue-400 text-xl">Инициализация приложения...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
