import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { logger } from '../utils/logger.ts';

export interface IUser {
  username: string;
  email: string;
  password: string;
  fullName: string;
  avatar?: string;
}

export interface IUserDocument extends IUser, mongoose.Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Мок пользовательских данных для режима разработки без БД
const mockUsers = [
  {
    _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109ca'),
    username: 'admin',
    email: 'admin@example.com',
    password: '$2b$10$zQSWDY6Uy4JGK/i6IwAGf.1fZfYUzzeHy0r6ETnKH.gfDrJFTvxFG', // пароль: password123
    fullName: 'Администратор Системы',
    avatar: 'https://avatars.githubusercontent.com/u/1?v=4'
  },
  {
    _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cb'),
    username: 'user',
    email: 'user@example.com',
    password: '$2b$10$zQSWDY6Uy4JGK/i6IwAGf.1fZfYUzzeHy0r6ETnKH.gfDrJFTvxFG', // пароль: password123
    fullName: 'Тестовый Пользователь',
    avatar: 'https://avatars.githubusercontent.com/u/2?v=4'
  }
];

// Создаем мок модели User для режима без БД
const createMockUserModel = () => {
  const methods = {
    comparePassword: async function(this: any, candidatePassword: string): Promise<boolean> {
      logger.debug('Mock comparePassword called', { candidatePassword });
      // Для отладочного режима без базы данных, возвращаем true если пароль совпадает с заданным
      if (candidatePassword === 'password123') {
        return true;
      }
      // Стандартное поведение - проверка через bcrypt
      return bcrypt.compare(candidatePassword, this.password);
    }
  };

  // Методы поиска
  const findById = (id: string | mongoose.Types.ObjectId) => {
    logger.debug('Mock User.findById called', { id });
    const user = mockUsers.find(u => u._id.toString() === id.toString());

    if (!user) return null;

    // Добавляем метод comparePassword к возвращаемому объекту
    const userWithMethods = {
      ...user,
      comparePassword: methods.comparePassword
    };

    // Метод select - убираем поле password если '-password'
    return {
      ...userWithMethods,
      select: (fields: string) => {
        if (fields === '-password') {
          const { password, ...userWithoutPassword } = userWithMethods;
          return userWithoutPassword;
        }
        return userWithMethods;
      }
    };
  };

  const findOne = (filter: any) => {
    logger.debug('Mock User.findOne called', { filter });
    let foundUser = null;

    if (filter.email) {
      foundUser = mockUsers.find(u => u.email === filter.email);
    } else if (filter.$or) {
      foundUser = mockUsers.find(u =>
        filter.$or.some((condition: any) =>
          (condition.email && u.email === condition.email) ||
          (condition.username && u.username === condition.username)
        )
      );
    }

    if (!foundUser) return null;

    // Добавляем метод comparePassword
    return {
      ...foundUser,
      comparePassword: methods.comparePassword
    };
  };

  const create = async (userData: IUser) => {
    logger.debug('Mock User.create called', {
      email: userData.email,
      username: userData.username
    });

    // Проверка на дубликаты
    const existingUser = mockUsers.find(
      u => u.email === userData.email || u.username === userData.username
    );

    if (existingUser) {
      const error: any = new Error('Duplicate key error');
      error.code = 11000;
      error.keyPattern = existingUser.email === userData.email
        ? { email: 1 }
        : { username: 1 };
      error.keyValue = existingUser.email === userData.email
        ? { email: userData.email }
        : { username: userData.username };
      throw error;
    }

    // Хеширование пароля
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Создаем нового пользователя
    const newUser = {
      _id: new mongoose.Types.ObjectId(),
      ...userData,
      password: hashedPassword
    };

    // Добавляем пользователя в мок базу данных
    // В реальном приложении мы бы сохранили в MongoDB
    mockUsers.push(newUser as any);

    // Добавляем метод comparePassword
    return {
      ...newUser,
      comparePassword: methods.comparePassword
    };
  };

  // Возвращаем мок модели
  return {
    findById,
    findOne,
    create
  };
};

// Экспортируем либо реальную модель, либо мок в зависимости от режима
const isNoDB = process.env.NODE_ENV === 'development-no-db';
const UserModel = isNoDB
  ? createMockUserModel() as any
  : mongoose.model<IUserDocument>('User', userSchema);

if (isNoDB) {
  logger.warn('Using mock User model for development without DB');
}

export default UserModel;
