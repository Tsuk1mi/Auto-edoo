import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentStore } from '@/store/documentStore';
import { DocumentCard } from '@/features/documents/components/DocumentCard';
import type { Document } from '@/types/Document';
import { Button } from '@/components/ui/Button';
import { logger } from '@/utils/logger';

const Home = () => {
  const navigate = useNavigate();
  const { documents, fetchDocuments, isLoading, error } = useDocumentStore();
  const [localDocuments, setLocalDocuments] = useState<Document[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [automationStatus, setAutomationStatus] = useState({
    autoSend: false,
    autoSign: false,
    autoCheck: false,
  });

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLocalLoading(true);
        await fetchDocuments();
      } catch (err) {
        logger.error('Ошибка при загрузке документов на главной:', {
          error: err instanceof Error ? err.message : String(err)
        });
        setLocalError(err instanceof Error ? err.message : 'Ошибка при загрузке документов');
      } finally {
        setLocalLoading(false);
      }
    };

    loadDocuments();
  }, [fetchDocuments]);

  // Обновляем локальное состояние при изменении глобального
  useEffect(() => {
    if (!isLoading) {
      setLocalDocuments(documents);
    }
    if (error) {
      setLocalError(error);
    }
  }, [documents, error, isLoading]);

  const handleDocumentClick = (doc: Document) => {
    logger.debug('Документ выбран:', { id: doc.id, name: doc.name });
    navigate(`/documents/${doc.id}`);
  };

  const handleActionClick = (action: string) => {
    logger.debug('Действие выбрано:', { action });

    switch (action) {
      case 'import':
        navigate('/documents/import');
        break;
      case 'export':
        navigate('/documents/export');
        break;
      case 'sign':
        navigate('/documents?filter=pending');
        break;
      default:
        // По умолчанию никуда не переходим
        break;
    }
  };

  const toggleAutomation = (key: keyof typeof automationStatus) => {
    setAutomationStatus((prev) => {
      const newState = {
        ...prev,
        [key]: !prev[key],
      };
      logger.debug('Изменен статус автоматизации:', { feature: key, enabled: newState[key] });
      return newState;
    });
  };

  const recentDocuments = localDocuments.slice(0, 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Documents Section */}
      <div className="lg:col-span-2 space-y-6">
        {/* Quick Actions */}
        <section className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <i className="fas fa-bolt text-yellow-400 mr-2" />
            Быстрые действия
          </h2>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleActionClick('import')}
              className="bg-gray-700 hover:bg-gray-600 rounded-lg p-3 text-sm flex flex-col items-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <i className="fas fa-file-import text-blue-400 mb-1 text-xl" />
              <span>Импорт</span>
            </button>

            <button
              onClick={() => handleActionClick('export')}
              className="bg-gray-700 hover:bg-gray-600 rounded-lg p-3 text-sm flex flex-col items-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <i className="fas fa-file-export text-green-400 mb-1 text-xl" />
              <span>Экспорт</span>
            </button>

            <button
              onClick={() => handleActionClick('sign')}
              className="bg-gray-700 hover:bg-gray-600 rounded-lg p-3 text-sm flex flex-col items-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <i className="fas fa-file-signature text-purple-400 mb-1 text-xl" />
              <span>Подписать</span>
            </button>
          </div>
        </section>

        {/* Recent Documents */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium flex items-center">
              <i className="fas fa-clock text-gray-400 mr-2" />
              Недавние документы
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/documents')}
            >
              Показать все
            </Button>
          </div>

          {localLoading ? (
            <div className="text-center py-8">
              <i className="fas fa-circle-notch fa-spin text-blue-400 text-2xl mb-2" />
              <p className="text-gray-400">Загрузка документов...</p>
            </div>
          ) : localError ? (
            <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg">
              <div className="flex items-center">
                <i className="fas fa-exclamation-circle text-red-400 mr-2" />
                <span>{localError}</span>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => {
                    setLocalError(null);
                    setLocalLoading(true);
                    fetchDocuments().finally(() => setLocalLoading(false));
                  }}
                  className="text-sm text-blue-400 hover:underline focus:outline-none"
                >
                  Повторить загрузку
                </button>
              </div>
            </div>
          ) : recentDocuments.length === 0 ? (
            <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
              <i className="fas fa-folder-open text-gray-600 text-4xl mb-2" />
              <p className="text-gray-400">Нет недавних документов</p>
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={() => navigate('/documents/create')}
              >
                Создать документ
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onClick={handleDocumentClick}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Automation Section */}
      <section className="space-y-6">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <i className="fas fa-robot text-purple-400 mr-2" />
            Автоматизация процессов
          </h2>

          <div className="space-y-3">
            {/* Automation Option */}
            <div className="automation-option bg-gray-700 rounded-lg p-3 cursor-pointer transition-colors duration-200 border border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-purple-900 flex items-center justify-center mr-3">
                    <i className="fas fa-envelope text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Авторассылка документов</h3>
                    <p className="text-xs text-gray-400">Отправка документов по расписанию</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    value=""
                    className="sr-only peer"
                    checked={automationStatus.autoSend}
                    onChange={() => toggleAutomation('autoSend')}
                  />
                  <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>
            </div>

            {/* Automation Option */}
            <div className="automation-option bg-gray-700 rounded-lg p-3 cursor-pointer transition-colors duration-200 border border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center mr-3">
                    <i className="fas fa-file-signature text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Автоподписание</h3>
                    <p className="text-xs text-gray-400">Автоматическая подпись стандартных документов</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    value=""
                    className="sr-only peer"
                    checked={automationStatus.autoSign}
                    onChange={() => toggleAutomation('autoSign')}
                  />
                  <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>
            </div>

            {/* Automation Option */}
            <div className="automation-option bg-gray-700 rounded-lg p-3 cursor-pointer transition-colors duration-200 border border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-green-900 flex items-center justify-center mr-3">
                    <i className="fas fa-check-double text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Автоматическая проверка</h3>
                    <p className="text-xs text-gray-400">Автоматическая проверка входящих документов</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    value=""
                    className="sr-only peer"
                    checked={automationStatus.autoCheck}
                    onChange={() => toggleAutomation('autoCheck')}
                  />
                  <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Help and Support */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <i className="fas fa-question-circle text-blue-400 mr-2" />
            Помощь и поддержка
          </h2>
          <p className="text-sm text-gray-300">Если у вас возникли вопросы, обратитесь в нашу службу поддержки.</p>
          <button
            className="text-blue-400 hover:underline text-sm mt-2 block transition-colors duration-200"
            onClick={() => navigate('/support')}
          >
            Связаться с поддержкой
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;
