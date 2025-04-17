import { useState } from 'react';
import type { Document } from '@/types/Document';

interface DocumentCardProps {
  document: Document;
  onClick?: (doc: Document) => void;
  onDelete?: (id: string) => void;
  statusClass?: string;
}

export const DocumentCard = ({
  document,
  onClick,
  onDelete,
  statusClass
}: DocumentCardProps) => {
  const [showActions, setShowActions] = useState(false);

  // Define icon based on document type
  const getIcon = () => {
    switch (document.type) {
      case 'contract':
        return <i className="fas fa-file-contract text-blue-400" />;
      case 'invoice':
        return <i className="fas fa-file-invoice-dollar text-green-400" />;
      case 'report':
        return <i className="fas fa-chart-bar text-purple-400" />;
      default:
        return <i className="fas fa-file text-gray-400" />;
    }
  };

  // Define status badge
  const getStatusBadge = () => {
    const labels = {
      approved: 'Одобрен',
      rejected: 'Отклонен',
      pending: 'В обработке',
    };

    // Если передан пользовательский класс для статуса, используем его
    if (statusClass) {
      return (
        <span className={`px-2 py-1 ${statusClass} text-xs rounded-full`}>
          {labels[document.status]}
        </span>
      );
    }

    // Иначе используем стандартные стили
    switch (document.status) {
      case 'approved':
        return (
          <span className="px-2 py-1 bg-green-900 text-green-300 text-xs rounded-full">
            Одобрен
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 bg-red-900 text-red-300 text-xs rounded-full">
            Отклонен
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 bg-yellow-900 text-yellow-300 text-xs rounded-full">
            В обработке
          </span>
        );
      default:
        return null;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  // Получаем тип документа на русском
  const getTypeLabel = () => {
    const types = {
      contract: 'Договор',
      invoice: 'Счет',
      report: 'Отчет',
    };
    return types[document.type] || document.type;
  };

  return (
    <div
      className="document-card bg-gray-800 rounded-lg border border-gray-700 p-4 transition-all duration-200 hover:bg-gray-700/50 cursor-pointer relative"
      onClick={() => onClick?.(document)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start">
        <div className="text-2xl mr-3">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-medium text-gray-200 truncate">{document.name}</h3>
            {getStatusBadge()}
          </div>

          <div className="mt-2 flex flex-col text-xs text-gray-400">
            <div className="flex justify-between items-center">
              <div>Тип: {getTypeLabel()}</div>
              <div>Создан: {formatDate(document.createdAt)}</div>
            </div>
            <div className="mt-1">
              Автор: {typeof document.author === 'object' ? (document.author as any).username || 'Неизвестный пользователь' : document.author}
            </div>
          </div>
        </div>
      </div>

      {/* Actions Overlay */}
      {showActions && onDelete && (
        <div className="absolute top-2 right-2 bg-gray-800 rounded-full shadow-md">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(document.id);
            }}
            className="text-gray-400 hover:text-red-400 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Delete document"
          >
            <i className="fas fa-trash-alt" />
          </button>
        </div>
      )}
    </div>
  );
};
