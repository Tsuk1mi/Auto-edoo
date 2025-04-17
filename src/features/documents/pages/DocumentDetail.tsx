import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentStore } from '@/store/documentStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useModal } from '@/hooks/useModal';
import type { Document as DocumentType } from '@/types/Document';

// Имитация структуры документа с дополнительными полями
interface DocumentDetails extends DocumentType {
  content: string;
  recipients: string[];
  history: {
    action: string;
    user: string;
    date: string;
  }[];
  attachments: {
    id: string;
    name: string;
    size: string;
    type: string;
  }[];
  comments: {
    id: string;
    user: string;
    text: string;
    date: string;
  }[];
}

const DocumentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { documents, updateDocument, isLoading, error } = useDocumentStore();
  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDocument, setEditedDocument] = useState<Partial<DocumentDetails>>({});

  const deleteModal = useModal(false);
  const signModal = useModal(false);
  const addCommentModal = useModal(false);
  const shareModal = useModal(false);

  const [newComment, setNewComment] = useState('');
  const [shareEmail, setShareEmail] = useState('');

  // Заглушка для данных документа
  useEffect(() => {
    if (id) {
      const foundDoc = documents.find(doc => doc.id === id);

      if (foundDoc) {
        // Добавляем дополнительные данные для детального просмотра
        const enhancedDoc: DocumentDetails = {
          ...foundDoc,
          content: `# ${foundDoc.name}\n\nЭтот документ был создан ${foundDoc.createdAt} пользователем ${foundDoc.author}.\n\n## Основное содержание\n\nЗдесь находится основное содержание документа. В реальном приложении это может быть текст договора, счета или отчета.\n\n## Дополнительная информация\n\nСтатус: ${foundDoc.status}\nТип: ${foundDoc.type}\nПоследнее обновление: ${foundDoc.updatedAt}`,
          recipients: ['director@company.ru', 'manager@company.ru'],
          history: [
            { action: 'Создание', user: foundDoc.author, date: foundDoc.createdAt },
            { action: 'Редактирование', user: foundDoc.author, date: foundDoc.updatedAt },
          ],
          attachments: [
            { id: '1', name: 'Приложение 1.pdf', size: '1.2 MB', type: 'pdf' },
            { id: '2', name: 'Схема.jpg', size: '0.8 MB', type: 'image' },
          ],
          comments: [
            { id: '1', user: 'Иван Петров', text: 'Документ требует уточнения в разделе 2.', date: '2024-04-10 15:30' },
            { id: '2', user: foundDoc.author, text: 'Внес необходимые изменения.', date: '2024-04-11 10:15' },
          ],
        };

        setDocument(enhancedDoc);
        setEditedDocument(enhancedDoc);
      }
    }
  }, [id, documents]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (document && editedDocument) {
      // В реальном приложении здесь был бы полноценный API-запрос
      await updateDocument(document.id, {
        name: editedDocument.name || document.name,
        type: editedDocument.type || document.type,
      });

      setIsEditing(false);

      // Обновляем историю
      if (document) {
        const updatedDoc = {
          ...document,
          name: editedDocument.name || document.name,
          type: editedDocument.type || document.type,
          history: [
            ...document.history,
            { action: 'Редактирование', user: document.author, date: new Date().toISOString() },
          ],
        };
        setDocument(updatedDoc);
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Сброс изменений
    if (document) {
      setEditedDocument(document);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedDocument(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSign = () => {
    if (document) {
      // В реальном приложении здесь был бы API-запрос для подписания
      const updatedDoc = {
        ...document,
        status: 'approved' as const,
        history: [
          ...document.history,
          { action: 'Подписание', user: document.author, date: new Date().toISOString() },
        ],
      };
      setDocument(updatedDoc);
      signModal.close();
    }
  };

  const handleAddComment = () => {
    if (document && newComment.trim()) {
      const updatedDoc = {
        ...document,
        comments: [
          ...document.comments,
          {
            id: Date.now().toString(),
            user: document.author,
            text: newComment,
            date: new Date().toISOString(),
          },
        ],
      };
      setDocument(updatedDoc);
      setNewComment('');
      addCommentModal.close();
    }
  };

  const handleShareDocument = () => {
    if (document && shareEmail.trim()) {
      const updatedDoc = {
        ...document,
        recipients: [...document.recipients, shareEmail],
        history: [
          ...document.history,
          {
            action: 'Отправка документа',
            user: document.author,
            date: new Date().toISOString()
          },
        ],
      };
      setDocument(updatedDoc);
      setShareEmail('');
      shareModal.close();
    }
  };

  const handleDelete = async () => {
    // В реальном приложении здесь был бы API-запрос для удаления
    navigate('/documents');
    deleteModal.close();
  };

  // Отображение загрузки или ошибки
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-blue-500 text-3xl mb-4"></i>
          <p className="text-gray-400">Загрузка документа...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-red-500 text-3xl mb-4"></i>
          <h2 className="text-xl font-semibold text-gray-200 mb-2">Документ не найден</h2>
          <p className="text-gray-400 mb-4">
            {error || 'Не удалось загрузить запрашиваемый документ.'}
          </p>
          <Button onClick={() => navigate('/documents')}>
            Вернуться к списку документов
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и действия */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <button
              onClick={() => navigate('/documents')}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            {isEditing ? (
              <Input
                type="text"
                name="name"
                value={editedDocument.name || ''}
                onChange={handleInputChange}
                className="text-xl font-semibold"
              />
            ) : (
              <h1 className="text-2xl font-semibold text-gray-200">{document.name}</h1>
            )}
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-400">
            <span className="flex items-center">
              <i className="fas fa-user mr-1"></i> {document.author}
            </span>
            <span className="flex items-center">
              <i className="fas fa-calendar mr-1"></i> {new Date(document.createdAt).toLocaleDateString()}
            </span>
            <div className={`px-2 py-0.5 rounded-full text-xs font-medium
              ${document.status === 'approved' ? 'bg-green-900 text-green-300' :
                document.status === 'rejected' ? 'bg-red-900 text-red-300' :
                'bg-yellow-900 text-yellow-300'}`}
            >
              {document.status === 'approved' ? 'Подписан' :
               document.status === 'rejected' ? 'Отклонен' :
               'На рассмотрении'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <>
              <Button
                variant="primary"
                onClick={handleSave}
                icon={<i className="fas fa-save"></i>}
              >
                Сохранить
              </Button>
              <Button
                variant="secondary"
                onClick={handleCancel}
              >
                Отмена
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={handleEdit}
                icon={<i className="fas fa-edit"></i>}
              >
                Редактировать
              </Button>
              <Button
                variant="primary"
                onClick={signModal.open}
                icon={<i className="fas fa-signature"></i>}
                disabled={document.status === 'approved'}
              >
                Подписать
              </Button>
              <Button
                variant="secondary"
                onClick={shareModal.open}
                icon={<i className="fas fa-share"></i>}
              >
                Отправить
              </Button>
              <Button
                variant="danger"
                onClick={deleteModal.open}
                icon={<i className="fas fa-trash"></i>}
              >
                Удалить
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Основное содержимое */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Информация о документе */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <i className="fas fa-info-circle text-blue-400 mr-2"></i>
              Информация о документе
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Тип документа</label>
                {isEditing ? (
                  <select
                    name="type"
                    value={editedDocument.type || ''}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 rounded border border-gray-600 focus:ring-2 focus:ring-blue-500 text-gray-200 py-2 px-3"
                  >
                    <option value="contract">Договор</option>
                    <option value="invoice">Счет</option>
                    <option value="report">Отчет</option>
                  </select>
                ) : (
                  <div className="bg-gray-700 rounded p-2 text-gray-200">
                    {document.type === 'contract' ? 'Договор' :
                     document.type === 'invoice' ? 'Счет' : 'Отчет'}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Статус</label>
                <div className="bg-gray-700 rounded p-2 text-gray-200">
                  {document.status === 'approved' ? 'Подписан' :
                   document.status === 'rejected' ? 'Отклонен' :
                   'На рассмотрении'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Дата создания</label>
                <div className="bg-gray-700 rounded p-2 text-gray-200">
                  {new Date(document.createdAt).toLocaleDateString()} {new Date(document.createdAt).toLocaleTimeString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Последнее обновление</label>
                <div className="bg-gray-700 rounded p-2 text-gray-200">
                  {new Date(document.updatedAt).toLocaleDateString()} {new Date(document.updatedAt).toLocaleTimeString()}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Получатели</label>
              <div className="bg-gray-700 rounded p-2 text-gray-200">
                {document.recipients.map((recipient, index) => (
                  <span key={index} className="bg-gray-600 text-gray-200 px-2 py-1 rounded text-sm mr-2 mb-2 inline-block">
                    {recipient}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Содержимое документа */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <i className="fas fa-file-alt text-blue-400 mr-2"></i>
              Содержимое документа
            </h2>

            {isEditing ? (
              <textarea
                name="content"
                value={editedDocument.content || ''}
                onChange={handleInputChange}
                className="w-full bg-gray-700 rounded border border-gray-600 focus:ring-2 focus:ring-blue-500 text-gray-200 py-2 px-3 min-h-[300px] font-mono text-sm"
              />
            ) : (
              <div className="bg-gray-700 rounded p-4 text-gray-200 whitespace-pre-wrap min-h-[300px] prose prose-invert prose-sm max-w-none">
                {document.content}
              </div>
            )}
          </div>

          {/* Вложения */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <i className="fas fa-paperclip text-blue-400 mr-2"></i>
              Вложения
            </h2>

            {document.attachments.length > 0 ? (
              <div className="space-y-2">
                {document.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between bg-gray-700 rounded p-3 border border-gray-600">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded bg-gray-600 flex items-center justify-center mr-3">
                        <i className={`fas ${
                          attachment.type === 'pdf' ? 'fa-file-pdf text-red-400' :
                          attachment.type === 'image' ? 'fa-file-image text-blue-400' :
                          'fa-file text-gray-400'
                        }`}></i>
                      </div>
                      <div>
                        <div className="font-medium">{attachment.name}</div>
                        <div className="text-xs text-gray-400">{attachment.size}</div>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-blue-400 transition-colors">
                      <i className="fas fa-download"></i>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-700 rounded border border-gray-600">
                <i className="fas fa-paperclip text-gray-500 text-2xl mb-2"></i>
                <p className="text-gray-400">Нет прикрепленных файлов</p>
              </div>
            )}

            {isEditing && (
              <div className="mt-4">
                <Button variant="secondary" size="sm" icon={<i className="fas fa-plus"></i>}>
                  Добавить вложение
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* История изменений */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <i className="fas fa-history text-blue-400 mr-2"></i>
              История
            </h2>

            <div className="space-y-3">
              {document.history.map((item, index) => (
                <div key={index} className="relative pl-5 pb-4 border-l border-gray-600 last:border-l-0">
                  <div className="absolute left-0 top-0 w-3 h-3 rounded-full bg-blue-500 -translate-x-1.5"></div>
                  <div className="text-sm font-medium">{item.action}</div>
                  <div className="text-xs text-gray-400 flex items-center mt-1">
                    <span className="mr-2">{item.user}</span>
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Комментарии */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium flex items-center">
                <i className="fas fa-comments text-blue-400 mr-2"></i>
                Комментарии
              </h2>
              <Button
                variant="ghost"
                size="sm"
                icon={<i className="fas fa-plus"></i>}
                onClick={addCommentModal.open}
              >
                Добавить
              </Button>
            </div>

            {document.comments.length > 0 ? (
              <div className="space-y-4">
                {document.comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{comment.user}</div>
                      <div className="text-xs text-gray-400">{new Date(comment.date).toLocaleDateString()}</div>
                    </div>
                    <div className="text-sm text-gray-300">{comment.text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-700 rounded border border-gray-600">
                <i className="fas fa-comment-slash text-gray-500 text-2xl mb-2"></i>
                <p className="text-gray-400">Нет комментариев</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модальные окна */}
      {/* Модальное окно удаления */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        title="Удалить документ"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Вы уверены, что хотите удалить документ "{document.name}"? Это действие нельзя отменить.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={deleteModal.close}>
              Отмена
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Удалить
            </Button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно подписания */}
      <Modal
        isOpen={signModal.isOpen}
        onClose={signModal.close}
        title="Подписать документ"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
            <div className="flex items-center mb-2">
              <i className="fas fa-file-signature text-blue-400 mr-2 text-lg"></i>
              <span className="font-medium">{document.name}</span>
            </div>
            <div className="text-sm text-gray-300 mb-3">
              Вы собираетесь подписать этот документ электронной подписью. После этого документ будет считаться утвержденным.
            </div>
            <div className="flex items-center text-green-400 text-sm">
              <i className="fas fa-check-circle mr-1"></i>
              <span>Документ проверен и готов к подписанию</span>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={signModal.close}>
              Отмена
            </Button>
            <Button variant="primary" onClick={handleSign}>
              Подписать
            </Button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно добавления комментария */}
      <Modal
        isOpen={addCommentModal.isOpen}
        onClose={addCommentModal.close}
        title="Добавить комментарий"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Текст комментария
            </label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full bg-gray-700 rounded border border-gray-600 focus:ring-2 focus:ring-blue-500 text-gray-200 py-2 px-3 min-h-[100px]"
              placeholder="Введите ваш комментарий..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={addCommentModal.close}>
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
            >
              Добавить
            </Button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно отправки документа */}
      <Modal
        isOpen={shareModal.isOpen}
        onClose={shareModal.close}
        title="Отправить документ"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Email получателя
            </label>
            <Input
              type="email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              placeholder="example@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Текущие получатели
            </label>
            <div className="bg-gray-700 rounded p-2 text-sm text-gray-300">
              {document.recipients.map((recipient, index) => (
                <div key={index} className="mb-1 last:mb-0">
                  <i className="fas fa-user text-gray-400 mr-1"></i> {recipient}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={shareModal.close}>
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={handleShareDocument}
              disabled={!shareEmail.trim() || !shareEmail.includes('@')}
            >
              Отправить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentDetail;
