import type { Request, Response } from 'express';
import Document, { type DocumentType, type DocumentStatus } from '../models/documentModel';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

// Стандартный формат ответа
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// Получение всех документов пользователя с пагинацией и фильтрацией
export const getDocuments = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      search,
      sortBy = 'createdAt',
      sortDirection = 'desc'
    } = req.query;

    // Создаем фильтр
    const filter: any = { author: req.userId };

    // Добавляем фильтр по статусу если он указан
    if (status && ['pending', 'approved', 'rejected'].includes(status as string)) {
      filter.status = status;
    }

    // Добавляем фильтр по типу документа если он указан
    if (type && ['contract', 'invoice', 'report'].includes(type as string)) {
      filter.type = type;
    }

    // Добавляем поиск по имени документа если указан
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Параметры пагинации
    const pageNum = Number.parseInt(page as string) || 1;
    const limitNum = Math.min(Number.parseInt(limit as string) || 10, 50); // Ограничиваем максимальное количество документов на странице
    const skip = (pageNum - 1) * limitNum;

    // Параметры сортировки
    const sort: any = {};
    sort[sortBy as string] = sortDirection === 'asc' ? 1 : -1;

    // Получаем общее количество документов по фильтру
    const total = await Document.countDocuments(filter);

    // Получаем документы с пагинацией и сортировкой
    const documents = await Document.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    logger.debug('Documents retrieved successfully', {
      userId: req.userId,
      count: documents.length,
      total,
      page: pageNum,
      limit: limitNum
    });

    res.json({
      success: true,
      data: documents.map(doc => ({
        id: doc._id,
        name: doc.name,
        type: doc.type,
        status: doc.status,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        author: doc.author,
        content: doc.content,
      })),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      }
    });
  } catch (error) {
    logger.error('Error retrieving documents', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack available',
      userId: req.userId
    });

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении документов',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};

// Получение документа по ID
export const getDocumentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный ID документа'
      });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Документ не найден'
      });
    }

    // Проверяем, имеет ли пользователь доступ к этому документу
    if (document.author.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Нет доступа к этому документу'
      });
    }

    res.json({
      success: true,
      data: {
        id: document._id,
        name: document.name,
        type: document.type,
        status: document.status,
        content: document.content,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        author: document.author,
      }
    });
  } catch (error) {
    logger.error('Ошибка при получении документа:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack available',
      userId: req.userId
    });
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении документа',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};

// Создание нового документа
export const createDocument = async (req: Request, res: Response) => {
  try {
    const { name, type, content } = req.body;

    logger.debug('Create document request', {
      userId: req.userId,
      documentName: name,
      documentType: type
    });

    if (!name || !type) {
      logger.warn('Invalid document creation request - missing fields', {
        userId: req.userId,
        name: !!name,
        type: !!type
      });

      return res.status(400).json({
        success: false,
        message: 'Пожалуйста, укажите название и тип документа'
      });
    }

    // Проверка типа документа
    if (!['contract', 'invoice', 'report'].includes(type)) {
      logger.warn('Invalid document type', {
        userId: req.userId,
        documentName: name,
        invalidType: type
      });

      return res.status(400).json({
        success: false,
        message: 'Неверный тип документа. Допустимые типы: contract, invoice, report'
      });
    }

    const newDocument = await Document.create({
      name,
      type,
      content,
      author: req.userId,
      status: 'pending',
    });

    logger.info('Document created successfully', {
      userId: req.userId,
      documentId: newDocument._id,
      documentName: newDocument.name,
      documentType: newDocument.type
    });

    res.status(201).json({
      success: true,
      message: 'Документ успешно создан',
      data: {
        id: newDocument._id,
        name: newDocument.name,
        type: newDocument.type,
        status: newDocument.status,
        content: newDocument.content,
        createdAt: newDocument.createdAt,
        updatedAt: newDocument.updatedAt,
        author: newDocument.author,
      }
    });
  } catch (error) {
    logger.error('Error creating document', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack available',
      userId: req.userId,
      requestBody: req.body
    });

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании документа',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};

// Обновление документа
export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, content, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный ID документа'
      });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Документ не найден'
      });
    }

    // Проверяем, имеет ли пользователь доступ к этому документу
    if (document.author.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Нет доступа к этому документу'
      });
    }

    // Проверка типа документа
    if (type && !['contract', 'invoice', 'report'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный тип документа. Допустимые типы: contract, invoice, report'
      });
    }

    // Проверка статуса документа
    if (status && !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный статус документа. Допустимые статусы: pending, approved, rejected'
      });
    }

    // Обновляем документ
    document.name = name || document.name;
    if (type) document.type = type as DocumentType;
    document.content = content !== undefined ? content : document.content;
    if (status) document.status = status as DocumentStatus;

    await document.save();

    res.json({
      success: true,
      message: 'Документ успешно обновлен',
      data: {
        id: document._id,
        name: document.name,
        type: document.type,
        status: document.status,
        content: document.content,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        author: document.author,
      }
    });
  } catch (error) {
    logger.error('Ошибка при обновлении документа:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack available',
      userId: req.userId
    });
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении документа',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};

// Удаление документа
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный ID документа'
      });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Документ не найден'
      });
    }

    // Проверяем, имеет ли пользователь доступ к этому документу
    if (document.author.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Нет доступа к этому документу'
      });
    }

    await Document.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Документ успешно удален'
    });
  } catch (error) {
    logger.error('Ошибка при удалении документа:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack available',
      userId: req.userId
    });
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении документа',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};

// Получение статистики документов
export const getDocumentStats = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    // Получаем общие статистические данные
    const totalCount = await Document.countDocuments({ author: userId });

    // Получаем количество документов по статусам
    const statusStats = await Document.aggregate([
      { $match: { author: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Получаем количество документов по типам
    const typeStats = await Document.aggregate([
      { $match: { author: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Формируем статистику по статусам
    const statusCounts: Record<string, number> = {};
    statusStats.forEach((item) => {
      statusCounts[item._id] = item.count;
    });

    // Формируем статистику по типам
    const typeCounts: Record<string, number> = {};
    typeStats.forEach((item) => {
      typeCounts[item._id] = item.count;
    });

    res.json({
      success: true,
      data: {
        total: totalCount,
        byStatus: {
          pending: statusCounts.pending || 0,
          approved: statusCounts.approved || 0,
          rejected: statusCounts.rejected || 0
        },
        byType: {
          contract: typeCounts.contract || 0,
          invoice: typeCounts.invoice || 0,
          report: typeCounts.report || 0
        }
      }
    });
  } catch (error) {
    logger.error('Ошибка при получении статистики:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack available',
      userId: req.userId
    });
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении статистики',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};
