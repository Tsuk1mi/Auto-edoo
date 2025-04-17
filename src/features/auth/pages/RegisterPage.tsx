import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState({
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear password error when user types in either password field
    if (name === 'password' || name === 'confirmPassword') {
      setFormErrors((prev) => ({
        ...prev,
        password: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    let valid = true;
    const newErrors = { password: '' };

    if (formData.password !== formData.confirmPassword) {
      newErrors.password = 'Пароли не совпадают';
      valid = false;
    }

    setFormErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl border border-gray-700">
        <div className="text-center">
          <i className="fas fa-file-contract text-blue-400 text-4xl mb-2" />
          <h2 className="text-2xl font-bold text-gray-200">Регистрация в системе ЭДО</h2>
          <p className="mt-2 text-sm text-gray-400">
            Создайте аккаунт для доступа к системе электронного документооборота
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                Имя пользователя
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="user123"
                className="bg-gray-700 rounded-lg pl-4 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-gray-200 border border-gray-600"
              />
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">
                Полное имя
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Иванов Иван"
                className="bg-gray-700 rounded-lg pl-4 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-gray-200 border border-gray-600"
              />
            </div>

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
                value={formData.email}
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
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                className={`bg-gray-700 rounded-lg pl-4 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-gray-200 border ${
                  formErrors.password ? 'border-red-500' : 'border-gray-600'
                }`}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                Подтверждение пароля
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="********"
                className={`bg-gray-700 rounded-lg pl-4 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-gray-200 border ${
                  formErrors.password ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-500 rounded focus:ring-blue-500"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-300">
              Я принимаю условия использования и политику конфиденциальности
            </label>
          </div>

          <div>
            <Button
              type="submit"
              isLoading={isLoading}
              fullWidth
              size="lg"
            >
              Зарегистрироваться
            </Button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-400">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-blue-400 hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
