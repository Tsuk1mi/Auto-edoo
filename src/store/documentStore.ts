import { create } from 'zustand';
import {
  documentService,
  type GetDocumentsParams
} from '@/features/documents/services/documentService';
import type {
  CreateDocumentDto,
  Document,
  DocumentFilters,
  DocumentStats
} from '@/types/Document';

interface DocumentState {
  documents: Document[];
  selectedDocument: Document | null;
  stats: DocumentStats | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  filters: DocumentFilters;
  // Actions
  fetchDocuments: (params?: GetDocumentsParams) => Promise<void>;
  getDocumentById: (id: string) => Promise<void>;
  createDocument: (data: CreateDocumentDto) => Promise<Document>;
  updateDocument: (id: string, data: Partial<CreateDocumentDto>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  setFilters: (filters: DocumentFilters) => void;
  resetFilters: () => void;
}

const defaultPagination = {
  total: 0,
  page: 1,
  limit: 10,
  pages: 0,
};

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  selectedDocument: null,
  stats: null,
  isLoading: false,
  error: null,
  pagination: defaultPagination,
  filters: {},

  fetchDocuments: async (params?: GetDocumentsParams) => {
    // Только устанавливаем isLoading: true если документы еще не загружены
    const currentDocuments = get().documents;
    set({
      isLoading: currentDocuments.length === 0,
      error: null
    });

    try {
      // Объединяем сохраненные фильтры с новыми параметрами
      const currentFilters = get().filters;
      const queryParams: GetDocumentsParams = {
        ...currentFilters,
        ...params,
      };

      // В реальном приложении используем API, а не моки
      // const response = await documentService.mockGetDocuments();
      const response = await documentService.getDocuments(queryParams);

      set({
        documents: response.data,
        pagination: response.meta,
        isLoading: false
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при загрузке документов';
      // Если есть уже загруженные документы, мы сохраняем их и показываем ошибку в отдельном поле
      // вместо очистки документов, что вызывает мерцание
      set((state) => ({
        isLoading: false,
        error: errorMessage,
        documents: state.documents // Сохраняем текущие документы
      }));
    }
  },

  getDocumentById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const document = await documentService.getDocumentById(id);
      set({ selectedDocument: document, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при загрузке документа';
      set({ isLoading: false, error: errorMessage });
    }
  },

  createDocument: async (data) => {
    set({ isLoading: true, error: null });
    try {
      // В реальном приложении используем API, а не моки
      // const newDocument = await documentService.mockCreateDocument(data);
      const newDocument = await documentService.createDocument(data);

      // Обновляем список документов только если создаваемый документ соответствует текущим фильтрам
      // или если фильтры не установлены
      set((state) => {
        const { filters } = state;
        const documentMatchesFilters =
          (!filters.type || filters.type === newDocument.type) &&
          (!filters.status || filters.status === newDocument.status) &&
          (!filters.search || newDocument.name.toLowerCase().includes(filters.search.toLowerCase()));

        return {
          documents: documentMatchesFilters
            ? [newDocument, ...state.documents].slice(0, state.pagination.limit)
            : state.documents,
          isLoading: false,
        };
      });

      // Обновляем статистику после создания документа
      get().fetchStats();

      return newDocument;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при создании документа';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  updateDocument: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedDocument = await documentService.updateDocument(id, data);
      set((state) => ({
        documents: state.documents.map((doc) =>
          doc.id === id ? updatedDocument : doc
        ),
        selectedDocument:
          state.selectedDocument?.id === id ? updatedDocument : state.selectedDocument,
        isLoading: false,
      }));

      // Обновляем статистику после обновления документа
      get().fetchStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при обновлении документа';
      set({ isLoading: false, error: errorMessage });
    }
  },

  deleteDocument: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await documentService.deleteDocument(id);
      set((state) => ({
        documents: state.documents.filter((doc) => doc.id !== id),
        selectedDocument: state.selectedDocument?.id === id ? null : state.selectedDocument,
        isLoading: false,
      }));

      // Обновляем статистику после удаления документа
      get().fetchStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при удалении документа';
      set({ isLoading: false, error: errorMessage });
    }
  },

  fetchStats: async () => {
    try {
      // В реальном приложении используем API, а не моки
      // const stats = await documentService.mockGetDocumentStats();
      const stats = await documentService.getDocumentStats();
      set({ stats });
    } catch (error) {
      console.error('Ошибка при получении статистики:', error);
    }
  },

  setFilters: (filters) => {
    set({ filters });
    // Автоматически загружаем документы с новыми фильтрами
    get().fetchDocuments({ page: 1 }); // Сбрасываем на первую страницу при изменении фильтров
  },

  resetFilters: () => {
    set({ filters: {} });
    get().fetchDocuments({ page: 1 });
  },
}));
