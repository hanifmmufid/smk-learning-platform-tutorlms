import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';

// Types
export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content?: string;
  attachmentUrl?: string;
  submittedAt?: string;
  score?: number;
  feedback?: string;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'LATE';
  gradedAt?: string;
  gradedBy?: string;
  assignment?: {
    id: string;
    title: string;
    maxScore: number;
    dueDate: string;
    subject?: {
      id: string;
      name: string;
    };
  };
  student?: {
    id: string;
    name: string;
    email: string;
  };
  grader?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SubmitAssignmentData {
  content?: string;
  file?: File;
}

export interface GradeSubmissionData {
  score: number;
  feedback?: string;
}

/**
 * Get all submissions (with optional filters)
 */
export const getAllSubmissions = async (params?: {
  assignmentId?: string;
  studentId?: string;
  status?: string;
}) => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/submissions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params,
  });
  return response.data;
};

/**
 * Get single submission by ID
 */
export const getSubmissionById = async (id: string) => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/submissions/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Submit an assignment (Students only)
 */
export const submitAssignment = async (
  assignmentId: string,
  data: SubmitAssignmentData
) => {
  const token = useAuthStore.getState().token;

  const formData = new FormData();
  if (data.content) {
    formData.append('content', data.content);
  }
  if (data.file) {
    formData.append('file', data.file);
  }

  const response = await axios.post(
    `${API_URL}/submissions/assignments/${assignmentId}/submit`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Grade a submission (Teachers only)
 */
export const gradeSubmission = async (
  submissionId: string,
  data: GradeSubmissionData
) => {
  const token = useAuthStore.getState().token;
  const response = await axios.put(
    `${API_URL}/submissions/${submissionId}/grade`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

/**
 * Delete a submission (Students can delete their own ungraded submissions)
 */
export const deleteSubmission = async (id: string) => {
  const token = useAuthStore.getState().token;
  const response = await axios.delete(`${API_URL}/submissions/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Helper function to get download URL for submission file
 */
export const getDownloadUrl = (attachmentUrl: string): string => {
  if (!attachmentUrl) return '';
  const baseUrl = API_URL.replace('/api', '');
  return `${baseUrl}${attachmentUrl}`;
};

/**
 * Helper function to get status badge color
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'bg-gray-500';
    case 'SUBMITTED':
      return 'bg-blue-500';
    case 'GRADED':
      return 'bg-green-500';
    case 'LATE':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};

/**
 * Helper function to get status label
 */
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'Belum Dikerjakan';
    case 'SUBMITTED':
      return 'Sudah Dikumpulkan';
    case 'GRADED':
      return 'Sudah Dinilai';
    case 'LATE':
      return 'Terlambat';
    default:
      return status;
  }
};

/**
 * Helper function to format submission date
 */
export const formatSubmissionDate = (date: string | undefined): string => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};
