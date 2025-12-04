import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';

// ============================================
// TypeScript Types
// ============================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

export interface Class {
  id: string;
  name: string;
  grade: number;
}

export interface Subject {
  id: string;
  name: string;
}

export interface AnnouncementRead {
  id: string;
  readAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  targetType: 'ALL' | 'CLASS' | 'SUBJECT';
  classId?: string | null;
  subjectId?: string | null;
  createdBy: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  creator: User;
  class?: Class | null;
  subject?: Subject | null;
  isRead?: boolean;
  readAt?: string | null;
  totalReads?: number;
  reads?: AnnouncementRead[];
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  targetType: 'ALL' | 'CLASS' | 'SUBJECT';
  classId?: string;
  subjectId?: string;
  isPinned?: boolean;
}

export interface UpdateAnnouncementData {
  title?: string;
  content?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  targetType?: 'ALL' | 'CLASS' | 'SUBJECT';
  classId?: string | null;
  subjectId?: string | null;
  isPinned?: boolean;
}

export interface GetAnnouncementsParams {
  targetType?: 'ALL' | 'CLASS' | 'SUBJECT';
  classId?: string;
  subjectId?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  unreadOnly?: boolean;
}

export interface UnreadCountData {
  total: number;
  read: number;
  unread: number;
}

// ============================================
// API Functions
// ============================================

/**
 * Get all announcements (filtered based on user role and enrollments)
 */
export const getAllAnnouncements = async (
  params?: GetAnnouncementsParams
): Promise<Announcement[]> => {
  try {
    const token = useAuthStore.getState().token;

    const response = await axios.get(`${API_URL}/announcements`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params,
    });

    return response.data.data;
  } catch (error) {
    console.error('Error fetching announcements:', error);
    throw error;
  }
};

/**
 * Get single announcement by ID
 */
export const getAnnouncementById = async (id: string): Promise<Announcement> => {
  try {
    const token = useAuthStore.getState().token;

    const response = await axios.get(`${API_URL}/announcements/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.data;
  } catch (error) {
    console.error('Error fetching announcement:', error);
    throw error;
  }
};

/**
 * Create new announcement
 */
export const createAnnouncement = async (
  data: CreateAnnouncementData
): Promise<Announcement> => {
  try {
    const token = useAuthStore.getState().token;

    const response = await axios.post(`${API_URL}/announcements`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data.data;
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
};

/**
 * Update announcement
 */
export const updateAnnouncement = async (
  id: string,
  data: UpdateAnnouncementData
): Promise<Announcement> => {
  try {
    const token = useAuthStore.getState().token;

    const response = await axios.put(`${API_URL}/announcements/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data.data;
  } catch (error) {
    console.error('Error updating announcement:', error);
    throw error;
  }
};

/**
 * Delete announcement
 */
export const deleteAnnouncement = async (id: string): Promise<void> => {
  try {
    const token = useAuthStore.getState().token;

    await axios.delete(`${API_URL}/announcements/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    throw error;
  }
};

/**
 * Mark announcement as read
 */
export const markAsRead = async (id: string): Promise<void> => {
  try {
    const token = useAuthStore.getState().token;

    await axios.post(
      `${API_URL}/announcements/${id}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (error) {
    console.error('Error marking announcement as read:', error);
    throw error;
  }
};

/**
 * Get unread announcement count
 */
export const getUnreadCount = async (): Promise<UnreadCountData> => {
  try {
    const token = useAuthStore.getState().token;

    const response = await axios.get(`${API_URL}/announcements/unread-count`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.data;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};

// ============================================
// Helper Functions
// ============================================

/**
 * Format date to readable string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format full date with time
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get priority color class
 */
export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'URGENT':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300 dark:border-orange-700';
    case 'NORMAL':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700';
    case 'LOW':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300 dark:border-gray-700';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300 dark:border-gray-700';
  }
};

/**
 * Get priority label
 */
export const getPriorityLabel = (priority: string): string => {
  switch (priority) {
    case 'URGENT':
      return 'Mendesak';
    case 'HIGH':
      return 'Penting';
    case 'NORMAL':
      return 'Normal';
    case 'LOW':
      return 'Rendah';
    default:
      return priority;
  }
};

/**
 * Get priority icon
 */
export const getPriorityIcon = (priority: string): string => {
  switch (priority) {
    case 'URGENT':
      return '🚨';
    case 'HIGH':
      return '⚠️';
    case 'NORMAL':
      return 'ℹ️';
    case 'LOW':
      return '📌';
    default:
      return '📢';
  }
};

/**
 * Get target type label
 */
export const getTargetLabel = (
  targetType: string,
  className?: string | null,
  subjectName?: string | null
): string => {
  switch (targetType) {
    case 'ALL':
      return 'Semua Pengguna';
    case 'CLASS':
      return className ? `Kelas ${className}` : 'Kelas Tertentu';
    case 'SUBJECT':
      return subjectName ? `Mata Pelajaran ${subjectName}` : 'Mata Pelajaran Tertentu';
    default:
      return targetType;
  }
};

/**
 * Get target color class
 */
export const getTargetColor = (targetType: string): string => {
  switch (targetType) {
    case 'ALL':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    case 'CLASS':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'SUBJECT':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
};

/**
 * Get read status badge color
 */
export const getReadStatusColor = (isRead: boolean): string => {
  return isRead
    ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 font-medium';
};

/**
 * Get read status label
 */
export const getReadStatusLabel = (isRead: boolean): string => {
  return isRead ? 'Sudah Dibaca' : 'Belum Dibaca';
};

/**
 * Truncate long text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
