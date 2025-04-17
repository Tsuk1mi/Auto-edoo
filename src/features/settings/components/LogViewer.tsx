import type React from 'react';
import { useState, useEffect } from 'react';
import { logger } from '../../../utils/logger';
import api from '../../../api/api';
import { apiRequest } from '@/api/api';

interface LogFile {
  name: string;
  size: number;
  created: string;
  modified: string;
  type: 'error' | 'app';
}

interface LogEntry {
  timestamp?: string;
  level?: string;
  hostname?: string;
  appName?: string;
  message?: string;
  context?: Record<string, any>;
  raw?: string;
}

interface LogFileListProps {
  files: LogFile[];
  onSelect: (file: LogFile) => void;
  selectedFile: LogFile | null;
}

const LogFileList: React.FC<LogFileListProps> = ({ files, onSelect, selectedFile }) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">Файлы логов</h3>
      {files.length === 0 ? (
        <p className="text-gray-500">Файлы логов не найдены</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Имя файла</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Тип</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Размер</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Изменен</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {files.map((file) => (
                <tr
                  key={file.name}
                  className={`hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                    selectedFile?.name === file.name ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => onSelect(file)}
                >
                  <td className="px-3 py-2 whitespace-nowrap">{file.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        file.type === 'error'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}
                    >
                      {file.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatFileSize(file.size)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(file.modified).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

interface LogContentProps {
  entries: LogEntry[];
  loading: boolean;
}

const LogContent: React.FC<LogContentProps> = ({ entries, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <p className="text-center text-gray-500">Выберите файл лога для просмотра</p>
      </div>
    );
  }

  const getLevelColor = (level?: string): string => {
    if (!level) return 'text-gray-700 dark:text-gray-300';

    switch (level.toUpperCase()) {
      case 'DEBUG':
        return 'text-gray-600 dark:text-gray-400';
      case 'INFO':
        return 'text-blue-600 dark:text-blue-400';
      case 'WARN':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'ERROR':
        return 'text-red-600 dark:text-red-400';
      case 'CRITICAL':
        return 'text-red-700 dark:text-red-300 font-semibold';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">Содержимое лога</h3>
      <div className="overflow-y-auto max-h-[calc(100vh-300px)] space-y-3">
        {entries.map((entry, index) => (
          <div key={index} className="border-b border-gray-100 dark:border-gray-700 pb-2 mb-2 last:border-0">
            {entry.raw ? (
              <pre className="text-xs whitespace-pre-wrap break-words font-mono bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                {entry.raw}
              </pre>
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${getLevelColor(entry.level)}`}>
                    {entry.level}
                  </span>
                  <span className="text-xs text-gray-500">
                    {entry.timestamp && new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="my-1 text-sm">{entry.message}</div>
                {entry.context && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded text-xs font-mono">
                    <pre className="whitespace-pre-wrap break-words">
                      {JSON.stringify(entry.context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const LogControls: React.FC<{
  onRefresh: () => void;
  onClearLogs: () => void;
  selectedFile: LogFile | null;
  isAdmin: boolean;
}> = ({ onRefresh, onClearLogs, selectedFile, isAdmin }) => {
  return (
    <div className="flex justify-between mb-4">
      <div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
        >
          Обновить
        </button>
        {isAdmin && (
          <button
            onClick={onClearLogs}
            disabled={!selectedFile}
            className={`px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 ${
              !selectedFile ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Очистить логи
          </button>
        )}
      </div>
      <div>
        {selectedFile && (
          <span className="text-sm text-gray-500">
            Выбран файл: <strong>{selectedFile.name}</strong>
          </span>
        )}
      </div>
    </div>
  );
};

const LogViewer: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = false }) => {
  const [files, setFiles] = useState<LogFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<LogFile | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiRequest({
        method: 'GET',
        url: '/api/logs/files'
      });

      setFiles(response.files || []);
    } catch (err: any) {
      logger.error('Error fetching log files', { error: err.message });
      setError(err.message || 'Не удалось загрузить список файлов логов');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogContent = async (file: LogFile) => {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);

      // Извлекаем дату из имени файла
      const dateMatch = file.name.match(/-([\\d-]+)\\./) || ["", ""];
      const date = dateMatch[1];
      const type = file.type;

      if (!date) {
        throw new Error('Не удалось определить дату из имени файла');
      }

      const response = await apiRequest({
        method: 'GET',
        url: `/api/logs/content`,
        params: { date, type }
      });

      setLogEntries(response.entries || []);
    } catch (err: any) {
      logger.error('Error fetching log content', { error: err.message, file: file.name });
      setError(err.message || 'Не удалось загрузить содержимое лога');
      setLogEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!selectedFile || !isAdmin) return;

    try {
      setLoading(true);

      const type = selectedFile.type;
      const response = await apiRequest({
        method: 'DELETE',
        url: `/api/logs/clear`,
        params: { type }
      });

      logger.info('Logs cleared successfully', { deletedCount: response.deletedCount });
      await fetchLogFiles();
      setSelectedFile(null);
      setLogEntries([]);
    } catch (err: any) {
      logger.error('Error clearing logs', { error: err.message });
      setError(err.message || 'Не удалось очистить логи');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = (file: LogFile) => {
    if (selectedFile?.name === file.name) {
      setSelectedFile(null);
      setLogEntries([]);
    } else {
      setSelectedFile(file);
      fetchLogContent(file);
    }
  };

  useEffect(() => {
    fetchLogFiles();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Просмотр логов</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Ошибка:</strong> {error}
        </div>
      )}

      <LogControls
        onRefresh={fetchLogFiles}
        onClearLogs={clearLogs}
        selectedFile={selectedFile}
        isAdmin={isAdmin}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <LogFileList
            files={files}
            onSelect={handleSelectFile}
            selectedFile={selectedFile}
          />
        </div>
        <div className="md:col-span-2">
          <LogContent entries={logEntries} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default LogViewer;
