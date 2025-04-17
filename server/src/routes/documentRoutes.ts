import express from 'express';
import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentStats
} from '../controllers/documentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Все маршруты для документов требуют авторизации
router.use(protect);

// Статистика документов
router.get('/stats', getDocumentStats);

// Получение всех документов и создание нового
router.route('/')
  .get(getDocuments)
  .post(createDocument);

// Операции с конкретным документом по ID
router.route('/:id')
  .get(getDocumentById)
  .put(updateDocument)
  .delete(deleteDocument);

export default router;
