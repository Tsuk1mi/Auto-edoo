import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

// Типы для автоматизации
interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: {
    documentType?: string;
    fromUser?: string;
    hasKeywords?: string[];
  };
  actions: {
    type: 'sign' | 'forward' | 'notify' | 'categorize';
    target?: string;
    category?: string;
  };
}

// Демо-данные для правил автоматизации
const defaultRules: AutomationRule[] = [
  {
    id: '1',
    name: 'Автоподписание счетов',
    description: 'Автоматически подписывать счета от проверенных контрагентов',
    enabled: true,
    conditions: {
      documentType: 'invoice',
      fromUser: 'ООО "Надежный поставщик"',
      hasKeywords: ['счет', 'оплата', 'услуги'],
    },
    actions: {
      type: 'sign',
    },
  },
  {
    id: '2',
    name: 'Перенаправление отчетов руководителю',
    description: 'Перенаправлять все входящие отчеты руководителю отдела',
    enabled: false,
    conditions: {
      documentType: 'report',
    },
    actions: {
      type: 'forward',
      target: 'Руководитель отдела',
    },
  },
  {
    id: '3',
    name: 'Уведомления о срочных документах',
    description: 'Присылать уведомления о документах с пометкой "срочно"',
    enabled: true,
    conditions: {
      hasKeywords: ['срочно', 'важно', 'критично'],
    },
    actions: {
      type: 'notify',
    },
  },
];

const Automation = () => {
  const [rules, setRules] = useState<AutomationRule[]>(defaultRules);
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Получаем правило для редактирования
  const editingRule = editingRuleId
    ? rules.find(rule => rule.id === editingRuleId)
    : null;

  // Эффект для открытия модального окна при изменении editingRuleId
  useEffect(() => {
    if (editingRuleId) {
      setIsEditModalOpen(true);
    }
  }, [editingRuleId]);

  // Закрываем модальное окно и сбрасываем редактируемое правило
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingRuleId(null);
  };

  const toggleRule = (id: string) => {
    setRules(
      rules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  const toggleAutomation = () => {
    setAutomationEnabled(!automationEnabled);
  };

  const getActionDescription = (action: AutomationRule['actions']) => {
    switch (action.type) {
      case 'sign':
        return 'Автоматическое подписание';
      case 'forward':
        return `Перенаправление: ${action.target}`;
      case 'notify':
        return 'Отправка уведомления';
      case 'categorize':
        return `Назначение категории: ${action.category}`;
      default:
        return 'Неизвестное действие';
    }
  };

  const getConditionsDescription = (conditions: AutomationRule['conditions']) => {
    const parts = [];
    if (conditions.documentType) {
      parts.push(`Тип: ${conditions.documentType}`);
    }
    if (conditions.fromUser) {
      parts.push(`От: ${conditions.fromUser}`);
    }
    if (conditions.hasKeywords && conditions.hasKeywords.length > 0) {
      parts.push(`Ключевые слова: ${conditions.hasKeywords.join(', ')}`);
    }
    return parts.join(' | ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-200">Автоматизация</h1>
        <div className="flex items-center">
          <span className="mr-3 text-gray-400">
            {automationEnabled ? 'Автоматизация включена' : 'Автоматизация отключена'}
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={automationEnabled}
              onChange={toggleAutomation}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
          </label>
        </div>
      </div>

      {/* Automation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center mr-3">
              <i className="fas fa-cogs text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium">Активных правил</h3>
              <p className="text-2xl font-bold text-blue-400">
                {rules.filter((r) => r.enabled).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center mb-2">
            <div className="w-10 h-10 rounded-full bg-green-900 flex items-center justify-center mr-3">
              <i className="fas fa-check-circle text-green-400" />
            </div>
            <div>
              <h3 className="font-medium">Документов обработано</h3>
              <p className="text-2xl font-bold text-green-400">247</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center mb-2">
            <div className="w-10 h-10 rounded-full bg-purple-900 flex items-center justify-center mr-3">
              <i className="fas fa-stopwatch text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium">Время сэкономлено</h3>
              <p className="text-2xl font-bold text-purple-400">38 ч</p>
            </div>
          </div>
        </div>
      </div>

      {/* Automation Rules */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-200 flex items-center">
            <i className="fas fa-robot text-blue-400 mr-2" />
            Правила автоматизации
          </h2>
          <Button icon={<i className="fas fa-plus" />}>
            Создать правило
          </Button>
        </div>

        {rules.length === 0 ? (
          <div className="text-center py-16 bg-gray-800 rounded-lg border border-gray-700">
            <i className="fas fa-robot text-gray-600 text-5xl mb-3" />
            <p className="text-gray-400 text-lg mb-2">Нет правил автоматизации</p>
            <p className="text-gray-500 mb-4">
              Создайте правила для автоматизации рутинных задач
            </p>
            <Button variant="primary" size="sm">
              Создать правило
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="bg-gray-700 rounded-lg p-4 border border-gray-600 transition-colors duration-200 hover:bg-gray-650"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 ${
                        rule.enabled ? 'bg-green-400' : 'bg-gray-500'
                      }`}
                    />
                    <h3 className="font-medium text-lg">{rule.name}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={rule.enabled}
                        onChange={() => toggleRule(rule.id)}
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                    <button
                      className="text-gray-400 hover:text-gray-200 transition-colors duration-200"
                      onClick={() => setEditingRuleId(rule.id)}
                    >
                      <i className="fas fa-edit" />
                    </button>
                    <button className="text-gray-400 hover:text-red-400 transition-colors duration-200">
                      <i className="fas fa-trash" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-3">{rule.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded p-3 text-sm">
                    <div className="text-gray-400 mb-1">Условия:</div>
                    <div className="text-gray-300">
                      {getConditionsDescription(rule.conditions)}
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded p-3 text-sm">
                    <div className="text-gray-400 mb-1">Действие:</div>
                    <div className="text-gray-300">
                      {getActionDescription(rule.actions)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-200 flex items-center">
            <i className="fas fa-history text-blue-400 mr-2" />
            История автоматизации
          </h2>
        </div>

        <div className="space-y-4">
          {/* History Item */}
          <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center mr-3">
                  <i className="fas fa-file-signature text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium">Счет №123 автоматически подписан</h3>
                  <p className="text-xs text-gray-400">
                    Правило: Автоподписание счетов
                  </p>
                </div>
              </div>
              <span className="text-gray-400 text-sm">Сегодня, 12:34</span>
            </div>
          </div>

          {/* History Item */}
          <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-900 flex items-center justify-center mr-3">
                  <i className="fas fa-bell text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium">Уведомление о срочном документе</h3>
                  <p className="text-xs text-gray-400">
                    Правило: Уведомления о срочных документах
                  </p>
                </div>
              </div>
              <span className="text-gray-400 text-sm">Вчера, 15:17</span>
            </div>
          </div>

          {/* History Item */}
          <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-900 flex items-center justify-center mr-3">
                  <i className="fas fa-paper-plane text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium">Отчет перенаправлен руководителю</h3>
                  <p className="text-xs text-gray-400">
                    Правило: Перенаправление отчетов руководителю
                  </p>
                </div>
              </div>
              <span className="text-gray-400 text-sm">21 апр, 09:45</span>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно редактирования правила */}
      {isEditModalOpen && editingRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-200">Редактирование правила</h3>
              <button
                className="text-gray-400 hover:text-white"
                onClick={closeEditModal}
              >
                <i className="fas fa-times" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-400">
                Редактирование правила "{editingRule.name}"
              </p>
              <p className="text-gray-500 text-sm">
                Функциональность редактирования находится в разработке.
              </p>
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <Button
                variant="secondary"
                onClick={closeEditModal}
              >
                Отмена
              </Button>
              <Button
                variant="primary"
                onClick={closeEditModal}
              >
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Automation;
