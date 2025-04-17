export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  roles: UserRole[];
  customAccess?: CustomAccessRights; // Новое поле для пользовательских прав
}

// Перечисление ролей пользователя
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

// Интерфейс прав доступа
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

// Интерфейс для настраиваемых ролей
export interface CustomRole {
  id: string;
  name: string;
  description: string;
  access: AccessRights;
}

// Интерфейс для настраиваемых прав пользователя
export interface CustomAccessRights {
  roleIds: string[]; // ID настраиваемых ролей
  overrides?: Partial<AccessRights>; // Переопределение прав доступа
}

// Объект доступа для ролей
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
  }
};

export interface AuthData {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  username: string;
  fullName: string;
}

// Вспомогательная функция для проверки доступа
export const hasAccess = (user: User | null, right: keyof AccessRights): boolean => {
  if (!user || !user.roles || user.roles.length === 0) {
    return false;
  }

  // Сначала проверяем базовые роли
  const hasRoleAccess = user.roles.some(role => {
    const roleRights = roleAccessMap[role as UserRole];
    return roleRights && roleRights[right];
  });

  // Если есть доступ по роли, то разрешаем
  if (hasRoleAccess) return true;

  // Проверяем настраиваемые права пользователя
  if (user.customAccess) {
    // Если есть явные переопределения
    if (user.customAccess.overrides && user.customAccess.overrides[right] !== undefined) {
      return user.customAccess.overrides[right] === true;
    }
  }

  return false;
};
