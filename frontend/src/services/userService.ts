import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = '/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  createdAt: string;
  updatedAt: string;
  _count?: {
    taughtSubjects?: number;
    enrollments?: number;
  };
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: 'TEACHER' | 'STUDENT';
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  role?: 'TEACHER' | 'STUDENT';
}

// Get all users (with optional role filter)
export const getAllUsers = async (role?: 'TEACHER' | 'STUDENT'): Promise<User[]> => {
  const token = useAuthStore.getState().token;
  const url = role ? `${API_URL}/users?role=${role}` : `${API_URL}/users`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data.data || [];
};

// Get single user by ID
export const getUserById = async (id: string): Promise<User> => {
  const token = useAuthStore.getState().token;

  const response = await axios.get(`${API_URL}/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data.data;
};

// Create new user
export const createUser = async (data: CreateUserRequest): Promise<User> => {
  const token = useAuthStore.getState().token;

  const response = await axios.post(`${API_URL}/users`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data.data;
};

// Update user
export const updateUser = async (id: string, data: UpdateUserRequest): Promise<User> => {
  const token = useAuthStore.getState().token;

  const response = await axios.put(`${API_URL}/users/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data.data;
};

// Delete user
export const deleteUser = async (id: string): Promise<void> => {
  const token = useAuthStore.getState().token;

  await axios.delete(`${API_URL}/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Get user statistics
export const getUserStats = async (): Promise<{
  total: number;
  teachers: number;
  students: number;
  admins: number;
}> => {
  const token = useAuthStore.getState().token;

  const response = await axios.get(`${API_URL}/users/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data.data;
};
