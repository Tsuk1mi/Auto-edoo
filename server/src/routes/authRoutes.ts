import express from 'express';
import {
  login,
  register,
  getCurrentUser,
  updateProfile,
  changePassword
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Публичные маршруты
router.post('/register', register);
router.post('/login', login);

// Защищенные маршруты
router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

export default router;
