import { useEffect, useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { DocumentCard } from '@/features/documents/components/DocumentCard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useModal } from '@/hooks/useModal';
import type { Document as DocumentType } from '@/types/Document';
import { CreateDocumentForm } from '../components/CreateDocumentForm';

const OutboxDocuments = () => {
  const { documents, fetchDocuments, deleteDocument, isLoading, error } = useDocumentStore();
  const createModal = useModal(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const deleteModal = useModal(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentType[]>([]);

  // Имитируем загрузку только исходящих документов
  // В реальном приложении здесь был бы отдельный метод для получения исходящих документов
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Фильтруем только исходящие документы (для демонстрации)
  // В реальном приложении фильтрация происходила бы на стороне сервера
  useEffect(() => {
    // Имитация фильтрации исходящих документов (автор - текущий пользователь)
    const outboxDocuments = documents.filter(doc =>
      doc.status === 'pending' || doc.status === 'approved'
    );

    if (searchQuery.trim() === '') {
      setFilteredDocuments(outboxDocuments);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      setFilteredDocuments(
        outboxDocuments.filter(
          (doc) =>
            doc.name.toLowerCase().includes(lowercaseQuery) ||
            doc.type.toLowerCase().includes(lowercaseQuery) ||
            doc.author.toLowerCase().includes(lowercaseQuery)
        )
      );
    }
  }, [searchQuery, documents]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleDocumentClick = (doc: DocumentType) => {
    console.log('Документ выбран:', doc);
    // Navigate to document details in the future
  };

  const handleDeleteClick = (id: string) => {
    setSelectedDocumentId(id);
    deleteModal.open();
  };

  const confirmDelete = async () => {
    if (selectedDocumentId) {
      await deleteDocument(selectedDocumentId);
      deleteModal.close();
      setSelectedDocumentId(null);
    }
  };

  const handleCreateSuccess = () => {
    createModal.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-200">Исходящие документы</h1>
        <Button
          onClick={createModal.open}
          icon={<i className="fas fa-plus" />}
        >
          Создать документ
        </Button>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Поиск документов..."
              className="bg-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-gray-200 border border-gray-600"
              value={searchQuery}
              onChange={handleSearch}
            />
            <i className="fas fa-search absolute left-3 top-2.5 text-gray-400" />
          </div>

          <div className="flex space-x-2">
            <select
              className="bg-gray-700 rounded-lg pl-4 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 border border-gray-600"
            >
              <option value="all">Все типы</option>
              <option value="contract">Договоры</option>
              <option value="invoice">Счета</option>
              <option value="report">Отчеты</option>
            </select>

            <select
              className="bg-gray-700 rounded-lg pl-4 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 border border-gray-600"
            >
              <option value="all">Все статусы</option>
              <option value="pending">В обработке</option>
              <option value="approved">Одобренные</option>
              <option value="rejected">Отклоненные</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <i className="fas fa-circle-notch fa-spin text-blue-400 text-3xl mb-3" />
            <p className="text-gray-400">Загрузка документов...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg">
            {error}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-16 bg-gray-800 rounded-lg border border-gray-700">
            <i className="fas fa-paper-plane text-gray-600 text-5xl mb-3" />
            <p className="text-gray-400 text-lg mb-2">Нет исходящих документов</p>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Не найдено документов по вашему запросу' : 'Создайте свой первый исходящий документ'}
            </p>
            {!searchQuery && (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onClick={handleDocumentClick}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Document Modal */}
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

      {/* Delete Confirmation Modal */}
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

export default OutboxDocuments;
