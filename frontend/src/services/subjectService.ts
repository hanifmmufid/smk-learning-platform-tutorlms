import axios from '../lib/axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = '/api/subjects';

export interface SubjectType {
  id: string;
  name: string;
  classId: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
  class?: {
    id: string;
    name: string;
    grade: number;
    academicYear: string;
  };
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    enrollments: number;
  };
  enrollments?: Enrollment[];
}

interface Enrollment {
  id: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateSubjectRequest {
  name: string;
  classId: string;
  teacherId: string;
}

export interface UpdateSubjectRequest {
  name?: string;
  classId?: string;
  teacherId?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Get authorization header with token
 */
const getAuthHeader = () => {
  const token = useAuthStore.getState().token;
  return {
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Get all subjects (optionally filtered by classId)
 */
export const getAllSubjects = async (classId?: string): Promise<SubjectType[]> => {
  const url = classId ? `${API_URL}?classId=${classId}` : API_URL;
  const response = await axios.get<ApiResponse<SubjectType[]>>(url, {
    headers: getAuthHeader(),
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch subjects');
  }

  return response.data.data;
};

/**
 * Get single subject by ID
 */
export const getSubjectById = async (id: string): Promise<SubjectType> => {
  const response = await axios.get<ApiResponse<SubjectType>>(`${API_URL}/${id}`, {
    headers: getAuthHeader(),
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch subject');
  }

  return response.data.data;
};

/**
 * Create new subject
 */
export const createSubject = async (subjectData: CreateSubjectRequest): Promise<SubjectType> => {
  const response = await axios.post<ApiResponse<SubjectType>>(API_URL, subjectData, {
    headers: getAuthHeader(),
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to create subject');
  }

  return response.data.data;
};

/**
 * Update existing subject
 */
export const updateSubject = async (id: string, subjectData: UpdateSubjectRequest): Promise<SubjectType> => {
  const response = await axios.put<ApiResponse<SubjectType>>(`${API_URL}/${id}`, subjectData, {
    headers: getAuthHeader(),
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to update subject');
  }

  return response.data.data;
};

/**
 * Delete subject
 */
export const deleteSubject = async (id: string): Promise<void> => {
  const response = await axios.delete<ApiResponse<void>>(`${API_URL}/${id}`, {
    headers: getAuthHeader(),
  });

  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to delete subject');
  }
};
