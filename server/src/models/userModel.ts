import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { logger } from '../utils/logger.ts';

// Добавляем возможные роли пользователей
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager',
  INVENTORY = 'inventory'
}

// Добавляем набор прав доступа
export interface AccessRights {
  canViewDocuments: boolean;
  canCreateDocuments: boolean;
  canEditDocuments: boolean;
  canViewInventory: boolean;
  canManageInventory: boolean;
  canAccessAdmin: boolean;
  canManageUsers: boolean;
  canViewExternalSystems: boolean;
}

// Объект с правами доступа для каждой роли
export const roleAccessMap: Record<UserRole, AccessRights> = {
  [UserRole.ADMIN]: {
    canViewDocuments: true,
    canCreateDocuments: true,
    canEditDocuments: true,
    canViewInventory: true,
    canManageInventory: true,
    canAccessAdmin: true,
    canManageUsers: true,
    canViewExternalSystems: true
  },
  [UserRole.USER]: {
    canViewDocuments: true,
    canCreateDocuments: true,
    canEditDocuments: false,
    canViewInventory: false,
    canManageInventory: false,
    canAccessAdmin: false,
    canManageUsers: false,
    canViewExternalSystems: false
  },
  [UserRole.MANAGER]: {
    canViewDocuments: true,
    canCreateDocuments: true,
    canEditDocuments: true,
    canViewInventory: true,
    canManageInventory: false,
    canAccessAdmin: false,
    canManageUsers: false,
    canViewExternalSystems: true
  },
  [UserRole.INVENTORY]: {
    canViewDocuments: true,
    canCreateDocuments: false,
    canEditDocuments: false,
    canViewInventory: true,
    canManageInventory: true,
    canAccessAdmin: false,
    canManageUsers: false,
    canViewExternalSystems: false
  }
};

export interface IUser {
  username: string;
  email: string;
  password: string;
  fullName: string;
  avatar?: string;
  roles: UserRole[];
}

export interface IUserDocument extends IUser, mongoose.Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  hasAccess(right: keyof AccessRights): boolean;
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
    roles: {
      type: [String],
      enum: Object.values(UserRole),
      default: [UserRole.USER]
    }
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

// Метод для проверки прав доступа
userSchema.methods.hasAccess = function (right: keyof AccessRights): boolean {
  if (!this.roles || this.roles.length === 0) {
    return false;
  }

  // Проверяем, есть ли у пользователя хотя бы одна роль, дающая указанное право
  return this.roles.some(role => {
    const roleRights = roleAccessMap[role as UserRole];
    return roleRights && roleRights[right];
  });
};

// Мок пользовательских данных для режима разработки без БД
const mockUsers = [
  {
    _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109ca'),
    username: 'admin',
    email: 'admin@example.com',
    password: '$2b$10$zQSWDY6Uy4JGK/i6IwAGf.1fZfYUzzeHy0r6ETnKH.gfDrJFTvxFG', // пароль: password123
    fullName: 'Администратор Системы',
    avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
    roles: [UserRole.ADMIN]
  },
  {
    _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cb'),
    username: 'user',
    email: 'user@example.com',
    password: '$2b$10$zQSWDY6Uy4JGK/i6IwAGf.1fZfYUzzeHy0r6ETnKH.gfDrJFTvxFG', // пароль: password123
    fullName: 'Тестовый Пользователь',
    avatar: 'https://avatars.githubusercontent.com/u/2?v=4',
    roles: [UserRole.USER]
  },
  {
    _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cc'),
    username: 'manager',
    email: 'manager@example.com',
    password: '$2b$10$zQSWDY6Uy4JGK/i6IwAGf.1fZfYUzzeHy0r6ETnKH.gfDrJFTvxFG', // пароль: password123
    fullName: 'Менеджер Проекта',
    avatar: 'https://avatars.githubusercontent.com/u/3?v=4',
    roles: [UserRole.MANAGER]
  },
  {
    _id: new mongoose.Types.ObjectId('60d0fe4f5311236168a109cd'),
    username: 'inventory',
    email: 'inventory@example.com',
    password: '$2b$10$zQSWDY6Uy4JGK/i6IwAGf.1fZfYUzzeHy0r6ETnKH.gfDrJFTvxFG', // пароль: password123
    fullName: 'Кладовщик',
    avatar: 'https://avatars.githubusercontent.com/u/4?v=4',
    roles: [UserRole.INVENTORY]
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
    },
    hasAccess: function(this: any, right: keyof AccessRights): boolean {
      logger.debug('Mock hasAccess called', { right, roles: this.roles });
      if (!this.roles || this.roles.length === 0) {
        return false;
      }
      return this.roles.some((role: UserRole) => {
        const roleRights = roleAccessMap[role];
        return roleRights && roleRights[right];
      });
    }
  };

  // Методы поиска
  const findById = (id: string | mongoose.Types.ObjectId) => {
    logger.debug('Mock User.findById called', { id });
    const user = mockUsers.find(u => u._id.toString() === id.toString());

    if (!user) return null;

    // Добавляем методы к возвращаемому объекту
    const userWithMethods = {
      ...user,
      comparePassword: methods.comparePassword,
      hasAccess: methods.hasAccess
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

    // Добавляем методы
    return {
      ...foundUser,
      comparePassword: methods.comparePassword,
      hasAccess: methods.hasAccess
    };
  };

  const find = (filter: any = {}) => {
    logger.debug('Mock User.find called', { filter });

    // Фильтрация пользователей по условию
    let filteredUsers = [...mockUsers];

    // Реализуем фильтрацию по ролям, если указано
    if (filter.roles) {
      filteredUsers = filteredUsers.filter(u =>
        u.roles.some(r => filter.roles.includes(r))
      );
    }

    // Возвращаем пользователей с методами
    return filteredUsers.map(user => ({
      ...user,
      comparePassword: methods.comparePassword,
      hasAccess: methods.hasAccess
    }));
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

    // Если роли не указаны, устанавливаем роль USER по умолчанию
    const roles = userData.roles && userData.roles.length > 0
      ? userData.roles
      : [UserRole.USER];

    // Создаем нового пользователя
    const newUser = {
      _id: new mongoose.Types.ObjectId(),
      ...userData,
      password: hashedPassword,
      roles
    };

    // Добавляем пользователя в мок базу данных
    // В реальном приложении мы бы сохранили в MongoDB
    mockUsers.push(newUser as any);

    // Добавляем методы
    return {
      ...newUser,
      comparePassword: methods.comparePassword,
      hasAccess: methods.hasAccess
    };
  };

  const findByIdAndUpdate = async (id: string | mongoose.Types.ObjectId, updateData: any, options: any = {}) => {
    logger.debug('Mock User.findByIdAndUpdate called', { id, updateData, options });

    const userIndex = mockUsers.findIndex(u => u._id.toString() === id.toString());

    if (userIndex === -1) return null;

    // Создаем обновленный объект пользователя
    const updatedUser = {
      ...mockUsers[userIndex],
      ...updateData.$set
    };

    // Обновляем пользователя в массиве
    mockUsers[userIndex] = updatedUser;

    // Добавляем методы
    const userWithMethods = {
      ...updatedUser,
      comparePassword: methods.comparePassword,
      hasAccess: methods.hasAccess
    };

    return options.new ? userWithMethods : mockUsers[userIndex];
  };

  // Возвращаем мок модели
  return {
    findById,
    findOne,
    find,
    create,
    findByIdAndUpdate
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
