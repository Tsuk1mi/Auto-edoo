import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { integrationService } from '@/features/integration/services/integrationService';

interface SidebarItemProps {
  to: string;
  icon: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  isExternal?: boolean;
}

const SidebarItem = ({ to, icon, label, isActive = false, onClick, isExternal = false }: SidebarItemProps) => {
  if (isExternal) {
    return (
      <div className="relative sidebar-item">
        <button
          onClick={onClick}
          className={`w-full h-12 flex items-center justify-start pl-4 rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:bg-gray-700 text-gray-400 hover:text-blue-400`}
        >
          <i className={`fas ${icon} text-xl mr-3`} />
          <span>{label}</span>
          <i className="fas fa-external-link-alt text-xs ml-2 opacity-75" />
        </button>
        <span className="sidebar-tooltip absolute left-full ml-2 px-2 py-1 bg-gray-700 rounded text-sm whitespace-nowrap opacity-0 transform -translate-x-2 transition-all duration-200">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="relative sidebar-item">
      <Link
        to={to}
        className={`w-full h-12 flex items-center justify-start pl-4 rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'hover:bg-gray-700 text-gray-400 hover:text-blue-400'
        }`}
      >
        <i className={`fas ${icon} text-xl mr-3`} />
        <span>{label}</span>
      </Link>
      <span className="sidebar-tooltip absolute left-full ml-2 px-2 py-1 bg-gray-700 rounded text-sm whitespace-nowrap opacity-0 transform -translate-x-2 transition-all duration-200">
        {label}
      </span>
    </div>
  );
};

export const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState({
    grafana: false,
    ansible: false,
  });

  const handleLogout = async () => {
    await logout();
  };

  // Обработчики для внешних систем
  const openGrafana = async () => {
    try {
      setIsLoading({ ...isLoading, grafana: true });
      await integrationService.openExternalSystem(
        integrationService.getGrafanaToken,
        'https://grafana.example.com',
        'Grafana'
      );
    } catch (error) {
      console.error('Failed to open Grafana:', error);
    } finally {
      setIsLoading({ ...isLoading, grafana: false });
    }
  };

  const openAnsible = async () => {
    try {
      setIsLoading({ ...isLoading, ansible: true });
      await integrationService.openExternalSystem(
        integrationService.getAnsibleToken,
        'https://ansible.example.com',
        'Ansible'
      );
    } catch (error) {
      console.error('Failed to open Ansible:', error);
    } finally {
      setIsLoading({ ...isLoading, ansible: false });
    }
  };

  return (
    <aside className="w-64 bg-gray-800 flex flex-col items-center py-4 border-r border-gray-700 relative">
      {/* Logo */}
      <div className="mb-8">
        <i className="fas fa-file-contract text-blue-400 text-3xl" />
        <span className="ml-2 text-lg font-semibold">ЭДО</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 w-full px-4">
        <div className="mb-6">
          <SidebarItem
            to="/"
            icon="fa-home"
            label="Главная"
            isActive={location.pathname === '/'}
          />

          <SidebarItem
            to="/documents"
            icon="fa-inbox"
            label="Входящие"
            isActive={location.pathname === '/documents'}
          />

          <SidebarItem
            to="/outbox"
            icon="fa-paper-plane"
            label="Исходящие"
            isActive={location.pathname === '/outbox'}
          />

          <SidebarItem
            to="/automation"
            icon="fa-robot"
            label="Автоматизация"
            isActive={location.pathname === '/automation'}
          />
        </div>

        {/* Внешние системы */}
        <div className="pt-4 border-t border-gray-700">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider pb-2 px-4">Внешние системы</h3>

          <SidebarItem
            to=""
            icon="fa-chart-line"
            label="Графана"
            isExternal
            onClick={openGrafana}
          />

          <SidebarItem
            to=""
            icon="fa-cogs"
            label="Ansible"
            isExternal
            onClick={openAnsible}
          />
        </div>

        {/* Настройки */}
        <div className="pt-4 mt-auto">
          <SidebarItem
            to="/settings"
            icon="fa-cog"
            label="Настройки"
            isActive={location.pathname === '/settings'}
          />
        </div>
      </nav>

      {/* User */}
      <button
        onClick={handleLogout}
        className="mt-auto w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <i className="fas fa-sign-out-alt text-gray-300" />
      </button>
    </aside>
  );
};
