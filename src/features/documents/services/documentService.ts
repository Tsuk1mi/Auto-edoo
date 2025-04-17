import { apiRequest } from '@/api/api';
import type { CreateDocumentDto, Document, DocumentFilters, DocumentStats, DocumentType, DocumentStatus } from '@/types/Document';

// Интерфейс для параметров запроса списка документов
export interface GetDocumentsParams extends DocumentFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// Интерфейс для ответа с пагинацией
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const documentService = {
  async getDocuments(params?: GetDocumentsParams): Promise<PaginatedResponse<Document>> {
    return apiRequest<PaginatedResponse<Document>>({
      method: 'GET',
      url: '/api/documents',
      params,
    });
  },

  async getDocumentById(id: string): Promise<Document> {
    return apiRequest<Document>({
      method: 'GET',
      url: `/api/documents/${id}`,
    });
  },

  async createDocument(documentData: CreateDocumentDto): Promise<Document> {
    return apiRequest<Document>({
      method: 'POST',
      url: '/api/documents',
      data: documentData,
    });
  },

  async updateDocument(id: string, documentData: Partial<Document>): Promise<Document> {
    return apiRequest<Document>({
      method: 'PUT',
      url: `/api/documents/${id}`,
      data: documentData,
    });
  },

  async deleteDocument(id: string): Promise<void> {
    return apiRequest<void>({
      method: 'DELETE',
      url: `/api/documents/${id}`,
    });
  },

  async getDocumentStats(): Promise<DocumentStats> {
    return apiRequest<DocumentStats>({
      method: 'GET',
      url: '/api/documents/stats',
    });
  },

  // Mock data для разработки, если API недоступен
  mockGetDocuments(): Promise<PaginatedResponse<Document>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockDocuments: Document[] = [
          {
            id: '1',
            name: 'Договор поставки №123',
            type: 'contract' as DocumentType,
            status: 'approved' as DocumentStatus,
            createdAt: '2023-09-15T14:30:00Z',
            updatedAt: '2023-09-16T10:15:00Z',
            author: 'user123',
          },
          {
            id: '2',
            name: 'Счет на оплату №456',
            type: 'invoice' as DocumentType,
            status: 'pending' as DocumentStatus,
            createdAt: '2023-09-18T09:45:00Z',
            updatedAt: '2023-09-18T09:45:00Z',
            author: 'user123',
          },
          {
            id: '3',
            name: 'Отчет за 3 квартал 2023',
            type: 'report' as DocumentType,
            status: 'pending' as DocumentStatus,
            createdAt: '2023-09-20T16:20:00Z',
            updatedAt: '2023-09-20T16:20:00Z',
            author: 'user123',
          },
          {
            id: '4',
            name: 'Договор аренды №789',
            type: 'contract' as DocumentType,
            status: 'rejected' as DocumentStatus,
            createdAt: '2023-09-10T11:00:00Z',
            updatedAt: '2023-09-12T14:30:00Z',
            author: 'user123',
          },
        ];

        resolve({
          data: mockDocuments,
          meta: {
            total: mockDocuments.length,
            page: 1,
            limit: 10,
            pages: 1,
          },
        });
      }, 500);
    });
  },

  mockCreateDocument(data: CreateDocumentDto): Promise<Document> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Math.random().toString(36).substring(2, 9),
          name: data.name,
          type: data.type,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: 'user123',
        });
      }, 500);
    });
  },

  mockGetDocumentStats(): Promise<DocumentStats> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          total: 4,
          byStatus: {
            pending: 2,
            approved: 1,
            rejected: 1,
          },
          byType: {
            contract: 2,
            invoice: 1,
            report: 1,
          },
        });
      }, 500);
    });
  },
};
