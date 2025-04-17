import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ExternalSystems } from '@/features/integration/components/ExternalSystems';
import LogViewer from '../components/LogViewer';
import { logger } from '@/utils/logger';

// Получаем роль пользователя из localStorage для демонстрации
const getUserRole = (): 'admin' | 'user' => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.role || 'user';
    }
  } catch (error) {
    logger.error('Error parsing user from localStorage', { error });
  }
  return 'user';
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const userRole = getUserRole();
  const isAdmin = userRole === 'admin';

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-8">Настройки</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Боковое меню настроек */}
        <div className="w-full md:w-64 bg-gray-800 rounded-lg p-4">
          <ul className="space-y-2">
            <li>
              <button
                className={`w-full text-left px-4 py-2 rounded ${
                  activeTab === 'general'
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
                onClick={() => setActiveTab('general')}
              >
                <i className="fas fa-cog mr-2"></i>
                Основные
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left px-4 py-2 rounded ${
                  activeTab === 'profile'
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
                onClick={() => setActiveTab('profile')}
              >
                <i className="fas fa-user mr-2"></i>
                Профиль
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left px-4 py-2 rounded ${
                  activeTab === 'security'
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
                onClick={() => setActiveTab('security')}
              >
                <i className="fas fa-shield-alt mr-2"></i>
                Безопасность
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left px-4 py-2 rounded ${
                  activeTab === 'integrations'
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
                onClick={() => setActiveTab('integrations')}
              >
                <i className="fas fa-plug mr-2"></i>
                Интеграции
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left px-4 py-2 rounded ${
                  activeTab === 'logs'
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
                onClick={() => setActiveTab('logs')}
              >
                <i className="fas fa-file-alt mr-2"></i>
                Логи
              </button>
            </li>
          </ul>
        </div>

        {/* Содержимое выбранной вкладки */}
        <div className="flex-1 bg-gray-800 rounded-lg p-6">
          {activeTab === 'general' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Основные настройки</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Количество элементов на странице
                  </label>
                  <select
                    className="bg-gray-700 rounded-lg px-4 py-2 w-full text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue="20"
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Часовой пояс
                  </label>
                  <select
                    className="bg-gray-700 rounded-lg px-4 py-2 w-full text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue="Europe/Moscow"
                  >
                    <option value="Europe/Moscow">Москва (GMT+3)</option>
                    <option value="Europe/Kaliningrad">Калининград (GMT+2)</option>
                    <option value="Asia/Yekaterinburg">Екатеринбург (GMT+5)</option>
                    <option value="Asia/Vladivostok">Владивосток (GMT+10)</option>
                  </select>
                </div>

                <div className="pt-4">
                  <Button>Сохранить изменения</Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Профиль пользователя</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    ФИО
                  </label>
                  <input
                    type="text"
                    className="bg-gray-700 rounded-lg px-4 py-2 w-full text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Иванов Иван Иванович"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="bg-gray-700 rounded-lg px-4 py-2 w-full text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Должность
                  </label>
                  <input
                    type="text"
                    className="bg-gray-700 rounded-lg px-4 py-2 w-full text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Начальник отдела"
                  />
                </div>

                <div className="pt-4">
                  <Button>Обновить профиль</Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Безопасность</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Текущий пароль
                  </label>
                  <input
                    type="password"
                    className="bg-gray-700 rounded-lg px-4 py-2 w-full text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="********"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Новый пароль
                  </label>
                  <input
                    type="password"
                    className="bg-gray-700 rounded-lg px-4 py-2 w-full text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="********"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Подтверждение пароля
                  </label>
                  <input
                    type="password"
                    className="bg-gray-700 rounded-lg px-4 py-2 w-full text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="********"
                  />
                </div>

                <div className="pt-4">
                  <Button>Изменить пароль</Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Внешние интеграции</h2>
              <p className="text-gray-400 mb-6">
                Настройте доступ к внешним системам. При переходе по ссылкам авторизация выполняется автоматически.
              </p>

              {/* Компонент с кнопками для внешних систем */}
              <ExternalSystems />

              <div className="mt-8 pt-6 border-t border-gray-700">
                <h3 className="text-lg font-medium text-gray-300 mb-3">Настройки интеграций</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      URL Grafana
                    </label>
                    <input
                      type="text"
                      className="bg-gray-700 rounded-lg px-4 py-2 w-full text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://grafana.example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      URL Ansible
                    </label>
                    <input
                      type="text"
                      className="bg-gray-700 rounded-lg px-4 py-2 w-full text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://ansible.example.com"
                    />
                  </div>
                  <div className="pt-4">
                    <Button>Сохранить настройки интеграций</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Журнал логов</h2>
              {isAdmin ? (
                <LogViewer isAdmin={isAdmin} />
              ) : (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
                  <p className="font-bold">Ограниченный доступ</p>
                  <p>Вы не являетесь администратором. Доступ к логам ограничен.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
