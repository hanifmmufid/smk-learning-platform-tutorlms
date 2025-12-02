import axios from '../lib/axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = '/api/classes';

export interface ClassType {
  id: string;
  name: string;
  grade: number;
  academicYear: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    subjects: number;
    enrollments: number;
  };
  subjects?: Subject[];
  enrollments?: Enrollment[];
}

interface Subject {
  id: string;
  name: string;
  teacher: {
    id: string;
    name: string;
    email: string;
  };
}

interface Enrollment {
  id: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateClassRequest {
  name: string;
  grade: number;
  academicYear: string;
}

export interface UpdateClassRequest {
  name?: string;
  grade?: number;
  academicYear?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Get authorization header with token from zustand store
 */
const getAuthHeader = () => {
  const token = useAuthStore.getState().token;
  return {
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Get all classes
 */
export const getAllClasses = async (): Promise<ClassType[]> => {
  const response = await axios.get<ApiResponse<ClassType[]>>(API_URL, {
    headers: getAuthHeader(),
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch classes');
  }

  return response.data.data;
};

/**
 * Get single class by ID
 */
export const getClassById = async (id: string): Promise<ClassType> => {
  const response = await axios.get<ApiResponse<ClassType>>(`${API_URL}/${id}`, {
    headers: getAuthHeader(),
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch class');
  }

  return response.data.data;
};

/**
 * Create new class
 */
export const createClass = async (classData: CreateClassRequest): Promise<ClassType> => {
  const response = await axios.post<ApiResponse<ClassType>>(API_URL, classData, {
    headers: getAuthHeader(),
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to create class');
  }

  return response.data.data;
};

/**
 * Update existing class
 */
export const updateClass = async (id: string, classData: UpdateClassRequest): Promise<ClassType> => {
  const response = await axios.put<ApiResponse<ClassType>>(`${API_URL}/${id}`, classData, {
    headers: getAuthHeader(),
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to update class');
  }

  return response.data.data;
};

/**
 * Delete class
 */
export const deleteClass = async (id: string): Promise<void> => {
  const response = await axios.delete<ApiResponse<void>>(`${API_URL}/${id}`, {
    headers: getAuthHeader(),
  });

  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to delete class');
  }
};
