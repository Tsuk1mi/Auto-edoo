import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { logger } from '@/utils/logger';

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();

  // Получаем путь, с которого пользователь был перенаправлен
  const from = (location.state as any)?.from?.pathname || '/';

  logger.debug("Login page loaded", { redirectPath: from, state: location.state });

  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      logger.debug("Attempting login", { email: credentials.email, from });

      // Выполняем вход с текущими учетными данными
      const creds = credentials.email === '' ?
        { email: 'user@example.com', password: 'password123' } :
        credentials;

      // Сначала выполняем вход
      logger.debug("Before login call", { email: creds.email });
      await login(creds);
      logger.debug("After login call - authentication successful");

      // После успешного входа сразу перенаправляем
      logger.info("Login successful, redirecting to:", { to: from });

      // Используем небольшую задержку для перенаправления, чтобы состояние успело обновиться
      logger.debug("Setting navigation timeout to", { path: from });
      setTimeout(() => {
        logger.debug("Navigation timeout triggered, navigating to", { path: from });
        navigate(from, { replace: true });
        logger.debug("Navigation called");
      }, 100);

    } catch (error) {
      logger.error('Login error', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  const handleForgotPassword = () => {
    logger.debug('Forgot password clicked');
    // Implement password recovery logic
  };

  // Для упрощения тестирования демо-режима
  const setDemoCredentials = () => {
    logger.debug("Demo mode activated");

    // Устанавливаем демо-данные
    const demoCredentials = {
      email: 'user@example.com',
      password: 'password123'
    };

    logger.debug("Setting demo credentials", { email: demoCredentials.email });
    // Сначала обновляем состояние
    setCredentials(demoCredentials);

    // Непосредственно вызываем логин с демо-данными вместо создания фейкового события
    try {
      logger.debug("Calling login directly with demo credentials");
      login(demoCredentials).then(() => {
        logger.info("Demo login successful, redirecting to:", { to: from });
        // Перенаправляем после успешного входа
        logger.debug("Setting navigation timeout for demo mode");
        setTimeout(() => {
          logger.debug("Demo navigation timeout triggered, navigating to", { path: from });
          navigate(from, { replace: true });
          logger.debug("Demo navigation called");
        }, 100);
      }).catch(error => {
        logger.error('Demo login promise error', {
          error: error instanceof Error ? error.message : String(error)
        });
      });
    } catch (error) {
      logger.error('Demo login error', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl border border-gray-700">
        <div className="text-center">
          <i className="fas fa-file-contract text-blue-400 text-4xl mb-2" />
          <h2 className="text-2xl font-bold text-gray-200">Вход в систему ЭДО</h2>
          <p className="mt-2 text-sm text-gray-400">
            Войдите в систему электронного документооборота
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={credentials.email}
              onChange={handleChange}
              placeholder="user@example.com"
              className="bg-gray-700 rounded-lg pl-4 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-gray-200 border border-gray-600"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Пароль
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={credentials.password}
              onChange={handleChange}
              placeholder="********"
              className="bg-gray-700 rounded-lg pl-4 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-gray-200 border border-gray-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember_me"
                name="remember_me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-500 rounded focus:ring-blue-500"
              />
              <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-300">
                Запомнить меня
              </label>
            </div>

            <div className="text-sm">
              <button
                type="button"
                className="text-blue-400 hover:underline"
                onClick={handleForgotPassword}
              >
                Забыли пароль?
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              isLoading={isLoading}
              fullWidth
              size="lg"
            >
              Войти
            </Button>

            <Button
              type="button"
              onClick={setDemoCredentials}
              variant="outline"
              fullWidth
            >
              Демо режим
            </Button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-400">
            Еще нет аккаунта?{' '}
            <Link to="/register" className="text-blue-400 hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
