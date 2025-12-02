import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';

// Types
export interface Assignment {
  id: string;
  title: string;
  description?: string;
  instructions: string;
  subjectId: string;
  teacherId: string;
  dueDate: string;
  maxScore: number;
  allowLateSubmission: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  subject?: {
    id: string;
    name: string;
    class: {
      id: string;
      name: string;
      grade: number;
    };
  };
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    submissions: number;
  };
}

export interface CreateAssignmentData {
  title: string;
  description?: string;
  instructions: string;
  subjectId: string;
  dueDate: string;
  maxScore: number;
  allowLateSubmission: boolean;
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
}

export interface UpdateAssignmentData {
  title?: string;
  description?: string;
  instructions?: string;
  dueDate?: string;
  maxScore?: number;
  allowLateSubmission?: boolean;
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
}

/**
 * Get all assignments (with optional filters)
 */
export const getAllAssignments = async (params?: {
  subjectId?: string;
  status?: string;
}) => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/assignments`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params,
  });
  return response.data;
};

/**
 * Get single assignment by ID
 */
export const getAssignmentById = async (id: string) => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/assignments/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Create new assignment (Teachers only)
 */
export const createAssignment = async (data: CreateAssignmentData) => {
  const token = useAuthStore.getState().token;
  const response = await axios.post(`${API_URL}/assignments`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

/**
 * Update assignment (Teachers only - must be creator)
 */
export const updateAssignment = async (
  id: string,
  data: UpdateAssignmentData
) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(`${API_URL}/assignments/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

/**
 * Delete assignment (Teachers only - must be creator)
 */
export const deleteAssignment = async (id: string) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/assignments/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Helper function to format due date
 */
export const formatDueDate = (dueDate: string): string => {
  const date = new Date(dueDate);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Helper function to check if assignment is overdue
 */
export const isOverdue = (dueDate: string): boolean => {
  return new Date(dueDate) < new Date();
};

/**
 * Helper function to get status badge color
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-500';
    case 'PUBLISHED':
      return 'bg-green-500';
    case 'CLOSED':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

/**
 * Helper function to get status label
 */
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'PUBLISHED':
      return 'Dipublikasikan';
    case 'CLOSED':
      return 'Ditutup';
    default:
      return status;
  }
};
