import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export type DocumentType = 'contract' | 'invoice' | 'report' | 'request' | 'other';
export type DocumentStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';

export interface IDocument {
  name: string;
  content: string;
  status: DocumentStatus;
  author: mongoose.Types.ObjectId | string;
  assignedTo?: mongoose.Types.ObjectId | string;
  type: DocumentType;
  metadata?: {
    [key: string]: any;
  };
  attachments?: string[];
}

export interface IDocumentDocument extends IDocument, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new mongoose.Schema<IDocumentDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['draft', 'pending', 'approved', 'rejected', 'archived'],
      default: 'draft',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      required: true,
      enum: ['contract', 'invoice', 'report', 'request', 'other'],
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    attachments: [String],
  },
  { timestamps: true }
);

// Мок документов для разработки без БД
const mockDocuments: Array<IDocumentDocument & { _id: mongoose.Types.ObjectId }> = [
  {
    _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cc'),
    name: 'Пример договора',
    content: 'Содержание примера договора...',
    status: 'draft',
    author: '60d0fe4f5311236168a109ca', // ID админа
    type: 'contract',
    metadata: {
      contractNumber: 'DOC-001',
      expiresAt: '2025-12-31'
    },
    attachments: ['contract_scan.pdf'],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cd'),
    name: 'Отчет за первый квартал',
    content: 'Отчет о проделанной работе за первый квартал...',
    status: 'approved',
    author: '60d0fe4f5311236168a109cb', // ID пользователя
    assignedTo: '60d0fe4f5311236168a109ca', // ID админа
    type: 'report',
    attachments: ['report.docx', 'financial_data.xlsx'],
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-20')
  }
];

// Создаем мок-модель документов
const createMockDocumentModel = () => {
  // Метод поиска по ID
  const findById = (id: string | mongoose.Types.ObjectId) => {
    logger.debug('Mock Document.findById called', { id });
    const document = mockDocuments.find(d => d._id.toString() === id.toString());

    if (!document) return null;

    return {
      ...document,
      populate: (field: string) => {
        // Здесь бы реализовали заполнение связанных полей
        return { ...document };
      }
    };
  };

  // Поиск всех документов с возможностью фильтрации
  const find = (filter?: any) => {
    logger.debug('Mock Document.find called', { filter });
    let results = [...mockDocuments];

    if (filter) {
      if (filter.author) {
        results = results.filter(d => d.author.toString() === filter.author.toString());
      }
      if (filter.status) {
        results = results.filter(d => d.status === filter.status);
      }
      if (filter.type) {
        results = results.filter(d => d.type === filter.type);
      }
      if (filter.name && filter.name.$regex) {
        const regex = new RegExp(filter.name.$regex, filter.name.$options);
        results = results.filter(d => regex.test(d.name));
      }
    }

    return {
      lean: () => results,
      populate: (field: string) => {
        // Здесь бы реализовали заполнение связанных полей
        return {
          sort: (sortOption: any) => {
            if (sortOption.createdAt === -1) {
              results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            } else if (sortOption.createdAt === 1) {
              results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            } else {
              // Сортировка по другим полям
              const field = Object.keys(sortOption)[0];
              const direction = sortOption[field];

              if (field && results.length > 0 && field in results[0]) {
                results.sort((a, b) => {
                  if (direction === 1) {
                    return a[field] > b[field] ? 1 : -1;
                  } else {
                    return a[field] < b[field] ? 1 : -1;
                  }
                });
              }
            }

            return {
              skip: (n: number) => {
                const skipped = results.slice(n);
                return {
                  limit: (n: number) => {
                    const limited = skipped.slice(0, n);
                    return {
                      lean: () => limited
                    };
                  },
                  lean: () => skipped
                };
              },
              limit: (n: number) => {
                const limited = results.slice(0, n);
                return {
                  lean: () => limited
                };
              },
              lean: () => results
            };
          },
          // Поддержка цепочки методов
          exec: () => Promise.resolve(results)
        };
      },
      // Если populate не вызван
      sort: (sortOption: any) => {
        if (sortOption.createdAt === -1) {
          results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } else if (sortOption.createdAt === 1) {
          results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        } else {
          // Сортировка по другим полям
          const field = Object.keys(sortOption)[0];
          const direction = sortOption[field];

          if (field && results.length > 0 && field in results[0]) {
            results.sort((a, b) => {
              if (direction === 1) {
                return a[field] > b[field] ? 1 : -1;
              } else {
                return a[field] < b[field] ? 1 : -1;
              }
            });
          }
        }

        return {
          skip: (n: number) => {
            const skipped = results.slice(n);
            return {
              limit: (n: number) => {
                const limited = skipped.slice(0, n);
                return {
                  lean: () => limited
                };
              },
              lean: () => skipped
            };
          },
          limit: (n: number) => {
            const limited = results.slice(0, n);
            return {
              lean: () => limited
            };
          },
          lean: () => results
        };
      },
      lean: () => results,
      skip: (n: number) => {
        return {
          limit: (n: number) => results.slice(n, n + n),
          lean: () => results.slice(n)
        };
      },
      limit: (n: number) => {
        return {
          lean: () => results.slice(0, n)
        };
      },
      exec: () => Promise.resolve(results)
    };
  };

  // Создание нового документа
  const create = async (docData: Partial<IDocument>) => {
    logger.debug('Mock Document.create called', { name: docData.name });

    const newDoc = {
      _id: new mongoose.Types.ObjectId(),
      ...docData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockDocuments.push(newDoc as any);
    return newDoc;
  };

  // Поиск и обновление
  const findByIdAndUpdate = (id: string | mongoose.Types.ObjectId, updateData: Partial<IDocument>) => {
    logger.debug('Mock Document.findByIdAndUpdate called', { id, updateData });
    const index = mockDocuments.findIndex(d => d._id.toString() === id.toString());

    if (index === -1) return null;

    const updatedDoc = {
      ...mockDocuments[index],
      ...updateData,
      updatedAt: new Date()
    };

    mockDocuments[index] = updatedDoc;

    return {
      populate: () => updatedDoc
    };
  };

  // Удаление документа
  const findByIdAndDelete = (id: string | mongoose.Types.ObjectId) => {
    logger.debug('Mock Document.findByIdAndDelete called', { id });
    const index = mockDocuments.findIndex(d => d._id.toString() === id.toString());

    if (index === -1) return null;

    const deletedDoc = mockDocuments[index];
    mockDocuments.splice(index, 1);

    return deletedDoc;
  };

  // Подсчет документов
  const countDocuments = (filter?: any) => {
    logger.debug('Mock Document.countDocuments called', { filter });
    let count = mockDocuments.length;

    if (filter) {
      if (filter.author) {
        count = mockDocuments.filter(d => d.author.toString() === filter.author.toString()).length;
      }
      if (filter.status) {
        count = mockDocuments.filter(d => d.status === filter.status).length;
      }
      if (filter.type) {
        count = mockDocuments.filter(d => d.type === filter.type).length;
      }
    }

    return count;
  };

  // Агрегация
  const aggregate = (pipeline: any[]) => {
    logger.debug('Mock Document.aggregate called', { pipeline });

    // Простая реализация для группировки по статусу и типу
    if (pipeline.length === 2 && pipeline[0].$match && pipeline[1].$group) {
      const matchField = pipeline[0].$match.author ? 'author' : '';
      const groupField = pipeline[1].$group._id;

      if (matchField === 'author' && (groupField === '$status' || groupField === '$type')) {
        const userId = pipeline[0].$match.author.toString();
        const userDocs = mockDocuments.filter(d => d.author.toString() === userId);

        const result: any[] = [];
        const counts: Record<string, number> = {};

        if (groupField === '$status') {
          userDocs.forEach(doc => {
            counts[doc.status] = (counts[doc.status] || 0) + 1;
          });
        } else if (groupField === '$type') {
          userDocs.forEach(doc => {
            counts[doc.type] = (counts[doc.type] || 0) + 1;
          });
        }

        for (const [key, count] of Object.entries(counts)) {
          result.push({ _id: key, count });
        }

        return result;
      }
    }

    return [];
  };

  // Возвращаем мок-модель
  return {
    findById,
    find,
    create,
    findByIdAndUpdate,
    findByIdAndDelete,
    countDocuments,
    aggregate
  };
};

// Экспортируем либо реальную модель, либо мок в зависимости от режима
const isNoDB = process.env.NODE_ENV === 'development-no-db';
const DocumentModel = isNoDB
  ? createMockDocumentModel() as any
  : mongoose.model<IDocumentDocument>('Document', documentSchema);

if (isNoDB) {
  logger.warn('Using mock Document model for development without DB');
}

export default DocumentModel;
