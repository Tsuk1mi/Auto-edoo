import type { Request, Response } from 'express';
import User from '../models/userModel.ts';
import { generateToken } from '../middleware/authMiddleware.ts';
import { logger } from '../utils/logger.ts';

// Стандартизированный ответ API
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Регистрация нового пользователя
export const register = async (req: Request, res: Response) => {
  try {
    logger.debug('Register request received', {
      email: req.body.email,
      username: req.body.username
    });

    const { username, email, password, fullName } = req.body;

    // Проверяем наличие обязательных полей
    if (!username || !email || !password || !fullName) {
      logger.warn('Registration failed - missing required fields', {
        email, username, hasPassword: !!password, hasFullName: !!fullName
      });
      return res.status(400).json({
        success: false,
        message: 'Пожалуйста, заполните все обязательные поля'
      });
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn('Registration failed - invalid email format', { email });
      return res.status(400).json({
        success: false,
        message: 'Некорректный формат email'
      });
    }

    // Валидация пароля
    if (password.length < 6) {
      logger.warn('Registration failed - password too short', { email });
      return res.status(400).json({
        success: false,
        message: 'Пароль должен содержать минимум 6 символов'
      });
    }

    // Проверяем, существует ли пользователь с таким email или username
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      logger.warn('Registration failed - user already exists', {
        email, username, existingEmail: userExists.email, existingUsername: userExists.username
      });
      return res.status(400).json({
        success: false,
        message: 'Пользователь с таким email или username уже существует'
      });
    }

    // Создаем нового пользователя
    const user = await User.create({
      username,
      email,
      password,
      fullName,
    });

    // Формируем ответ
    if (user) {
      const token = generateToken(user._id.toString());
      logger.info('User registered successfully', {
        userId: user._id.toString(), email, username
      });

      res.status(201).json({
        success: true,
        message: 'Регистрация прошла успешно',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
          },
          token,
        }
      });
    }
  } catch (error) {
    logger.error('Registration error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack available',
      requestBody: req.body
    });
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при регистрации',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};

// Авторизация пользователя
export const login = async (req: Request, res: Response) => {
  try {
    logger.debug('Login attempt', { email: req.body.email });
    const { email, password } = req.body;

    // Проверяем наличие обязательных полей
    if (!email || !password) {
      logger.warn('Login failed - missing email or password', {
        hasEmail: !!email, hasPassword: !!password
      });
      return res.status(400).json({
        success: false,
        message: 'Пожалуйста, введите email и пароль'
      });
    }

    // Находим пользователя по email
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn('Login failed - user not found', { email });
      return res.status(401).json({
        success: false,
        message: 'Неверные учетные данные'
      });
    }

    // Проверяем пароль
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn('Login failed - incorrect password', {
        userId: user._id.toString(), email
      });
      return res.status(401).json({
        success: false,
        message: 'Неверные учетные данные'
      });
    }

    // Формируем ответ
    const token = generateToken(user._id.toString());
    logger.info('User logged in successfully', {
      userId: user._id.toString(), email
    });

    res.json({
      success: true,
      message: 'Авторизация успешна',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar,
        },
        token,
      }
    });
  } catch (error) {
    logger.error('Login error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack available',
      email: req.body.email
    });
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при авторизации',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};

// Получение данных текущего пользователя
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // Так как мы используем middleware protect, req.user уже доступен
    const user = req.user;
    const userId = req.userId;

    logger.debug('Get current user request', { userId });

    if (!user) {
      logger.warn('Get current user failed - user not found', { userId });
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    logger.debug('Current user data retrieved successfully', { userId });
    res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
      }
    });
  } catch (error) {
    logger.error('Error getting current user', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack available',
      userId: req.userId
    });
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении данных пользователя',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};

// Выход пользователя из системы
export const logout = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    logger.info('User logged out', { userId });

    // На стороне сервера нет необходимости что-то делать,
    // так как JWT токены не хранятся на сервере
    res.json({
      success: true,
      message: 'Вы успешно вышли из системы'
    });
  } catch (error) {
    logger.error('Logout error', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.userId
    });
    res.status(500).json({
      success: false,
      message: 'Ошибка при выходе из системы',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};

// Обновление профиля пользователя
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { fullName, username, avatar } = req.body;

    logger.debug('Update profile request', { userId, fullName, username });

    // Проверяем доступность username, если он изменился
    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        logger.warn('Update profile failed - username already taken', {
          userId, username, existingUserId: existingUser._id.toString()
        });
        return res.status(400).json({
          success: false,
          message: 'Пользователь с таким username уже существует'
        });
      }
    }

    // Обновляем данные пользователя
    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (username) updateData.username = username;
    if (avatar) updateData.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      logger.warn('Update profile failed - user not found', { userId });
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    logger.info('User profile updated successfully', { userId });
    res.json({
      success: true,
      message: 'Профиль обновлен успешно',
      data: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        avatar: updatedUser.avatar,
      }
    });
  } catch (error) {
    logger.error('Update profile error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack available',
      userId: req.userId
    });
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении профиля',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};

// Изменение пароля пользователя
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    logger.debug('Change password request', { userId });

    // Проверяем наличие обязательных полей
    if (!currentPassword || !newPassword) {
      logger.warn('Change password failed - missing required fields', {
        userId, hasCurrentPassword: !!currentPassword, hasNewPassword: !!newPassword
      });
      return res.status(400).json({
        success: false,
        message: 'Пожалуйста, введите текущий и новый пароль'
      });
    }

    // Проверяем минимальную длину нового пароля
    if (newPassword.length < 6) {
      logger.warn('Change password failed - new password too short', { userId });
      return res.status(400).json({
        success: false,
        message: 'Новый пароль должен содержать минимум 6 символов'
      });
    }

    // Получаем пользователя из базы
    const user = await User.findById(userId).select('+password');
    if (!user) {
      logger.warn('Change password failed - user not found', { userId });
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Проверяем текущий пароль
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      logger.warn('Change password failed - incorrect current password', { userId });
      return res.status(401).json({
        success: false,
        message: 'Текущий пароль введен неверно'
      });
    }

    // Обновляем пароль
    user.password = newPassword;
    await user.save();

    logger.info('User password changed successfully', { userId });
    res.json({
      success: true,
      message: 'Пароль успешно изменен'
    });
  } catch (error) {
    logger.error('Change password error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack available',
      userId: req.userId
    });
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при изменении пароля',
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
};
