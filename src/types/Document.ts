export type DocumentType = 'contract' | 'invoice' | 'report';
export type DocumentStatus = 'pending' | 'approved' | 'rejected';

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  author: string;
  content?: string;
}

export interface CreateDocumentDto {
  name: string;
  type: DocumentType;
  content?: string;
}

export interface UpdateDocumentDto {
  name?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  content?: string;
}

export interface DocumentFilters {
  status?: DocumentStatus;
  type?: DocumentType;
  search?: string;
}

export interface DocumentStats {
  total: number;
  byStatus: {
    pending: number;
    approved: number;
    rejected: number;
  };
  byType: {
    contract: number;
    invoice: number;
    report: number;
  };
}
