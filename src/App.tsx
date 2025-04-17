import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AppRouter } from './router/AppRouter';
import './index.css';

function App() {
  const { checkAuth } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on app load
    const initializeAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Failed to check authentication status:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [checkAuth]);

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
