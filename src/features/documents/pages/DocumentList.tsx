import { useEffect, useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { DocumentCard } from '@/features/documents/components/DocumentCard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useModal } from '@/hooks/useModal';
import type { Document as DocumentType, DocumentStatus, DocumentType as DocType } from '@/types/Document';
import { CreateDocumentForm } from '../components/CreateDocumentForm';

const DocumentList = () => {
  const {
    documents,
    fetchDocuments,
    deleteDocument,
    isLoading,
    error,
    pagination,
    stats,
    fetchStats,
    setFilters,
    resetFilters,
  } = useDocumentStore();

  const createModal = useModal(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const deleteModal = useModal(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Получаем документы при первой загрузке
  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, [fetchDocuments, fetchStats]);

  // Функция для обработки изменения поисковой строки
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Функция для применения поиска
  const applySearch = () => {
    setFilters({
      search: searchQuery || undefined,
      type: typeFilter !== 'all' ? typeFilter as DocType : undefined,
      status: statusFilter !== 'all' ? statusFilter as DocumentStatus : undefined,
    });
    setCurrentPage(1);
  };

  // Применяем поиск при нажатии на Enter
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applySearch();
    }
  };

  // Функция для сброса фильтров
  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    resetFilters();
    setCurrentPage(1);
  };

  // Функция для обработки изменения фильтра типа документа
  const handleTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(e.target.value);
  };

  // Функция для обработки изменения фильтра статуса
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  // Функция для обработки изменения страницы
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchDocuments({ page });
  };

  // Функция для обработки клика по документу
  const handleDocumentClick = (doc: DocumentType) => {
    console.log('Документ выбран:', doc);
    // Для будущей навигации на детальную страницу
    window.location.href = `/documents/${doc.id}`;
  };

  // Функция для обработки клика по кнопке удаления
  const handleDeleteClick = (id: string) => {
    setSelectedDocumentId(id);
    deleteModal.open();
  };

  // Функция для подтверждения удаления
  const confirmDelete = async () => {
    if (selectedDocumentId) {
      await deleteDocument(selectedDocumentId);
      deleteModal.close();
      setSelectedDocumentId(null);
    }
  };

  // Функция для обработки успешного создания документа
  const handleCreateSuccess = () => {
    createModal.close();
    fetchDocuments();
  };

  // Генерация пагинации
  const renderPagination = () => {
    const { pages } = pagination;
    if (pages <= 1) return null;

    return (
      <div className="flex justify-center mt-6 space-x-2">
        {currentPage > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <i className="fas fa-chevron-left mr-1" /> Назад
          </Button>
        )}

        {Array.from({ length: Math.min(5, pages) }, (_, index) => {
          // Показываем страницы вокруг текущей
          let pageToShow;
          if (pages <= 5) {
            pageToShow = index + 1;
          } else if (currentPage <= 3) {
            pageToShow = index + 1;
          } else if (currentPage >= pages - 2) {
            pageToShow = pages - 4 + index;
          } else {
            pageToShow = currentPage - 2 + index;
          }

          return (
            <Button
              key={pageToShow}
              variant={pageToShow === currentPage ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handlePageChange(pageToShow)}
            >
              {pageToShow}
            </Button>
          );
        })}

        {currentPage < pages && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Далее <i className="fas fa-chevron-right ml-1" />
          </Button>
        )}
      </div>
    );
  };

  // Вспомогательные функции для определения цвета статуса
  const getStatusClass = (status: DocumentStatus) => {
    switch (status) {
      case 'approved':
        return 'bg-green-900/30 text-green-400 border-green-800';
      case 'rejected':
        return 'bg-red-900/30 text-red-400 border-red-800';
      default:
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-200">Документы</h1>
        <Button
          onClick={createModal.open}
          icon={<i className="fas fa-plus" />}
        >
          Создать документ
        </Button>
      </div>

      {/* Статистика документов */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 flex flex-col items-center">
            <h3 className="text-gray-400 mb-1">Всего документов</h3>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 flex flex-col items-center">
            <h3 className="text-gray-400 mb-1">В обработке</h3>
            <p className="text-2xl font-bold text-yellow-400">{stats.byStatus.pending}</p>
          </div>
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 flex flex-col items-center">
            <h3 className="text-gray-400 mb-1">Одобренные</h3>
            <p className="text-2xl font-bold text-green-400">{stats.byStatus.approved}</p>
          </div>
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 flex flex-col items-center">
            <h3 className="text-gray-400 mb-1">Отклоненные</h3>
            <p className="text-2xl font-bold text-red-400">{stats.byStatus.rejected}</p>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-6 gap-4">
          <div className="w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск документов..."
                className="bg-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 text-gray-200 border border-gray-600"
                value={searchQuery}
                onChange={handleSearch}
                onKeyPress={handleSearchKeyPress}
              />
              <i className="fas fa-search absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <select
              className="bg-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 border border-gray-600"
              value={typeFilter}
              onChange={handleTypeFilterChange}
            >
              <option value="all">Все типы</option>
              <option value="contract">Договоры</option>
              <option value="invoice">Счета</option>
              <option value="report">Отчеты</option>
            </select>

            <select
              className="bg-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 border border-gray-600"
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <option value="all">Все статусы</option>
              <option value="pending">В обработке</option>
              <option value="approved">Одобренные</option>
              <option value="rejected">Отклоненные</option>
            </select>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={applySearch}
              >
                Применить
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
              >
                Сбросить
              </Button>
            </div>
          </div>
        </div>

        {isLoading && documents.length === 0 ? (
          <div className="text-center py-16">
            <i className="fas fa-circle-notch fa-spin text-blue-400 text-3xl mb-3" />
            <p className="text-gray-400">Загрузка документов...</p>
          </div>
        ) : error && documents.length === 0 ? (
          <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg">
            {error}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16 bg-gray-800 rounded-lg border border-gray-700">
            <i className="fas fa-folder-open text-gray-600 text-5xl mb-3" />
            <p className="text-gray-400 text-lg mb-2">Нет документов</p>
            <p className="text-gray-500 mb-4">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Не найдено документов по вашему запросу'
                : 'Создайте свой первый документ'}
            </p>
            {!searchQuery && typeFilter === 'all' && statusFilter === 'all' && (
              <Button
                variant="primary"
                size="sm"
                onClick={createModal.open}
              >
                Создать документ
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onClick={handleDocumentClick}
                  onDelete={handleDeleteClick}
                  statusClass={getStatusClass(doc.status)}
                />
              ))}
            </div>

            {/* Показываем ошибку над результатами, если она есть и есть загруженные документы */}
            {error && documents.length > 0 && (
              <div className="mt-4 bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg">
                {error}
              </div>
            )}

            {/* Показываем индикатор загрузки внизу, если идет загрузка и есть документы */}
            {isLoading && documents.length > 0 && (
              <div className="mt-4 text-center py-3">
                <i className="fas fa-circle-notch fa-spin text-blue-400 text-xl mr-2" />
                <span className="text-gray-400">Обновление...</span>
              </div>
            )}

            {renderPagination()}
          </>
        )}
      </div>

      {/* Модальное окно создания документа */}
      <Modal
        isOpen={createModal.isOpen}
        onClose={createModal.close}
        title="Создать документ"
      >
        <CreateDocumentForm
          onSuccess={handleCreateSuccess}
          onCancel={createModal.close}
        />
      </Modal>

      {/* Модальное окно подтверждения удаления */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        title="Удалить документ"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Вы уверены, что хотите удалить этот документ? Это действие нельзя отменить.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={deleteModal.close}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              isLoading={isLoading}
            >
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentList;
