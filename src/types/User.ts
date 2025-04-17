export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
}

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
