import axios from '../lib/axios';

// API Base URL - uses Vite proxy configured in vite.config.ts
const API_URL = '/api/auth';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  avatar: string | null;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Login user with email and password
 */
export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const response = await axios.post<ApiResponse<AuthResponse>>(`${API_URL}/login`, credentials);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Login failed');
  }

  return response.data.data;
};

/**
 * Register a new user
 */
export const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
  const response = await axios.post<ApiResponse<AuthResponse>>(`${API_URL}/register`, userData);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Registration failed');
  }

  return response.data.data;
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (token: string): Promise<User> => {
  const response = await axios.get<ApiResponse<User>>(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to get user profile');
  }

  return response.data.data;
};

/**
 * Logout user (client-side only since JWT is stateless)
 */
export const logout = async (token: string): Promise<void> => {
  try {
    await axios.post<ApiResponse<void>>(
      `${API_URL}/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (error) {
    // Logout on client side even if server request fails
    console.warn('Logout request failed, but clearing local session anyway');
  }
};
