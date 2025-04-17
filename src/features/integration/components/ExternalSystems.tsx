import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { integrationService } from '../services/integrationService';

interface ExternalSystemButtonProps {
  name: string;
  icon: string;
  onClick: () => Promise<void>;
  isLoading: boolean;
}

const ExternalSystemButton = ({
  name,
  icon,
  onClick,
  isLoading,
}: ExternalSystemButtonProps) => (
  <Button
    onClick={onClick}
    isLoading={isLoading}
    className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
    fullWidth={false}
  >
    <i className={`fas ${icon} mr-2`} />
    <span>{name}</span>
  </Button>
);

export const ExternalSystems = () => {
  const [loadingSystem, setLoadingSystem] = useState<string | null>(null);

  const openGrafana = async () => {
    try {
      setLoadingSystem('grafana');
      await integrationService.openExternalSystem(
        integrationService.getGrafanaToken,
        'https://grafana.example.com',
        'Grafana'
      );
    } catch (error) {
      console.error('Failed to open Grafana:', error);
      // Здесь можно добавить код для отображения уведомления пользователю
    } finally {
      setLoadingSystem(null);
    }
  };

  const openAnsible = async () => {
    try {
      setLoadingSystem('ansible');
      await integrationService.openExternalSystem(
        integrationService.getAnsibleToken,
        'https://ansible.example.com',
        'Ansible'
      );
    } catch (error) {
      console.error('Failed to open Ansible:', error);
      // Здесь можно добавить код для отображения уведомления пользователю
    } finally {
      setLoadingSystem(null);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-300 mb-3">Внешние системы</h3>
      <div className="flex flex-col sm:flex-row gap-3">
        <ExternalSystemButton
          name="Графана"
          icon="fa-chart-line"
          onClick={openGrafana}
          isLoading={loadingSystem === 'grafana'}
        />
        <ExternalSystemButton
          name="Ansible"
          icon="fa-cogs"
          onClick={openAnsible}
          isLoading={loadingSystem === 'ansible'}
        />
      </div>
    </div>
  );
};
