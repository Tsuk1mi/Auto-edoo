export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  roles: UserRole[];
}

// Перечисление ролей пользователя
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager',
  INVENTORY = 'inventory'
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

  return user.roles.some(role => {
    const roleRights = roleAccessMap[role as UserRole];
    return roleRights && roleRights[right];
  });
};
