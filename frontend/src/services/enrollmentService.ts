import axios from '../lib/axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = '/api/enrollments';

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  subjectId: string;
  enrolledAt: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  class: {
    id: string;
    name: string;
    grade: number;
    academicYear: string;
  };
  subject: {
    id: string;
    name: string;
    teacher: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface CreateEnrollmentRequest {
  studentId: string;
  classId: string;
  subjectId: string;
}

export interface BulkEnrollmentRequest {
  studentIds: string[];
  classId: string;
  subjectId: string;
}

export interface BulkEnrollmentResponse {
  created: number;
  skipped: number;
  total: number;
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
 * Get all enrollments (with optional filters)
 */
export const getAllEnrollments = async (params?: {
  classId?: string;
  subjectId?: string;
  studentId?: string;
}): Promise<Enrollment[]> => {
  const queryParams = new URLSearchParams();
  if (params?.classId) queryParams.append('classId', params.classId);
  if (params?.subjectId) queryParams.append('subjectId', params.subjectId);
  if (params?.studentId) queryParams.append('studentId', params.studentId);

  const url = queryParams.toString() ? `${API_URL}?${queryParams.toString()}` : API_URL;

  const response = await axios.get<ApiResponse<Enrollment[]>>(url, {
    headers: getAuthHeader(),
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch enrollments');
  }

  return response.data.data;
};

/**
 * Get single enrollment by ID
 */
export const getEnrollmentById = async (id: string): Promise<Enrollment> => {
  const response = await axios.get<ApiResponse<Enrollment>>(`${API_URL}/${id}`, {
    headers: getAuthHeader(),
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch enrollment');
  }

  return response.data.data;
};

/**
 * Create single enrollment
 */
export const createEnrollment = async (enrollmentData: CreateEnrollmentRequest): Promise<Enrollment> => {
  const response = await axios.post<ApiResponse<Enrollment>>(API_URL, enrollmentData, {
    headers: getAuthHeader(),
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to create enrollment');
  }

  return response.data.data;
};

/**
 * Create bulk enrollments
 */
export const bulkEnrollment = async (enrollmentData: BulkEnrollmentRequest): Promise<BulkEnrollmentResponse> => {
  const response = await axios.post<ApiResponse<BulkEnrollmentResponse>>(
    `${API_URL}/bulk`,
    enrollmentData,
    {
      headers: getAuthHeader(),
    }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to create bulk enrollment');
  }

  return response.data.data;
};

/**
 * Delete enrollment
 */
export const deleteEnrollment = async (id: string): Promise<void> => {
  const response = await axios.delete<ApiResponse<void>>(`${API_URL}/${id}`, {
    headers: getAuthHeader(),
  });

  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to delete enrollment');
  }
};
