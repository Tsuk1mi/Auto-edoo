import { useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { Button } from '@/components/ui/Button';
import type { DocumentType } from '@/types/Document';

interface CreateDocumentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateDocumentForm = ({ onSuccess, onCancel }: CreateDocumentFormProps) => {
  const { createDocument, isLoading, error } = useDocumentStore();

  const [formData, setFormData] = useState({
    name: '',
    type: 'contract' as DocumentType,
    content: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Название документа не может быть пустым');
      return;
    }

    try {
      await createDocument(formData);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating document:', error);
      setFormError(error instanceof Error ? error.message : 'Ошибка при создании документа');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(error || formError) && <div className="bg-red-900/30 border border-red-800 text-red-300 p-3 rounded text-sm">{error || formError}</div>}

      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-gray-300">
          Название документа
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="bg-gray-700 rounded-lg pl-4 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-gray-200 border border-gray-600"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="type" className="block text-sm font-medium text-gray-300">
          Тип документа
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
          className="bg-gray-700 rounded-lg pl-4 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-gray-200 border border-gray-600"
        >
          <option value="contract">Договор</option>
          <option value="invoice">Счет</option>
          <option value="report">Отчет</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className="block text-sm font-medium text-gray-300">
          Содержимое документа
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          rows={5}
          className="bg-gray-700 rounded-lg pl-4 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-gray-200 border border-gray-600"
          placeholder="Введите содержимое документа..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Отмена
        </Button>

        <Button
          type="submit"
          isLoading={isLoading}
          disabled={!formData.name.trim() || isLoading}
        >
          Создать документ
        </Button>
      </div>
    </form>
  );
};
