import axios from '../lib/axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = '/api/materials';

export interface MaterialType {
  id: string;
  title: string;
  description?: string | null;
  type: 'FILE' | 'VIDEO' | 'LINK';
  fileUrl?: string | null;
  url?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  subjectId: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  subject?: {
    id: string;
    name: string;
    class?: {
      id: string;
      name: string;
    };
  };
  uploader?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface UploadMaterialRequest {
  title: string;
  description?: string;
  subjectId: string;
  file: File;
}

export interface CreateLinkMaterialRequest {
  title: string;
  description?: string;
  type: 'LINK';
  url: string;
  subjectId: string;
}

export interface UpdateMaterialRequest {
  title?: string;
  description?: string;
  url?: string;
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
 * Get all materials (with optional subject filter)
 */
export const getAllMaterials = async (subjectId?: string): Promise<MaterialType[]> => {
  const url = subjectId ? `${API_URL}?subjectId=${subjectId}` : API_URL;
  const response = await axios.get<ApiResponse<MaterialType[]>>(url, {
    headers: getAuthHeader(),
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch materials');
  }

  return response.data.data;
};

/**
 * Get single material by ID
 */
export const getMaterialById = async (id: string): Promise<MaterialType> => {
  const response = await axios.get<ApiResponse<MaterialType>>(`${API_URL}/${id}`, {
    headers: getAuthHeader(),
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch material');
  }

  return response.data.data;
};

/**
 * Upload file material
 */
export const uploadMaterial = async (
  materialData: UploadMaterialRequest
): Promise<MaterialType> => {
  const formData = new FormData();
  formData.append('title', materialData.title);
  if (materialData.description) {
    formData.append('description', materialData.description);
  }
  formData.append('subjectId', materialData.subjectId);
  formData.append('file', materialData.file);

  const response = await axios.post<ApiResponse<MaterialType>>(
    `${API_URL}/upload`,
    formData,
    {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to upload material');
  }

  return response.data.data;
};

/**
 * Create link material (YouTube, Google Drive, etc)
 */
export const createLinkMaterial = async (
  materialData: CreateLinkMaterialRequest
): Promise<MaterialType> => {
  const response = await axios.post<ApiResponse<MaterialType>>(
    `${API_URL}/link`,
    materialData,
    {
      headers: getAuthHeader(),
    }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to create link material');
  }

  return response.data.data;
};

/**
 * Update material
 */
export const updateMaterial = async (
  id: string,
  materialData: UpdateMaterialRequest
): Promise<MaterialType> => {
  const response = await axios.put<ApiResponse<MaterialType>>(
    `${API_URL}/${id}`,
    materialData,
    {
      headers: getAuthHeader(),
    }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to update material');
  }

  return response.data.data;
};

/**
 * Delete material
 */
export const deleteMaterial = async (id: string): Promise<void> => {
  const response = await axios.delete<ApiResponse<void>>(`${API_URL}/${id}`, {
    headers: getAuthHeader(),
  });

  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to delete material');
  }
};

/**
 * Get download URL for material
 */
export const getDownloadUrl = (id: string): string => {
  return `${API_URL}/${id}/download`;
};

/**
 * Get file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get material icon based on type
 */
export const getMaterialIcon = (material: MaterialType): string => {
  if (material.type === 'LINK') return '🔗';
  if (material.type === 'VIDEO') return '🎥';

  // For files, check MIME type
  if (material.mimeType?.includes('pdf')) return '📄';
  if (material.mimeType?.includes('word')) return '📝';
  if (material.mimeType?.includes('powerpoint') || material.mimeType?.includes('presentation'))
    return '📊';
  if (material.mimeType?.includes('excel') || material.mimeType?.includes('spreadsheet'))
    return '📈';
  if (material.mimeType?.includes('zip') || material.mimeType?.includes('rar')) return '📦';
  if (material.mimeType?.includes('image')) return '🖼️';

  return '📁';
};
