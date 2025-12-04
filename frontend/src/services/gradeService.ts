import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';

// ============================================
// Types & Interfaces
// ============================================

export interface AssignmentGrade {
  id: string;
  title: string;
  score: number | null;
  maxScore: number;
  percentage: number | null;
  submittedAt?: string;
  gradedAt?: string;
  feedback?: string;
}

export interface QuizGrade {
  id: string;
  title: string;
  score: number | null;
  maxScore: number;
  percentage: number | null;
  isPassed?: boolean | null;
  submittedAt?: string;
  timeSpent?: number | null;
}

export interface SubjectGrade {
  subject: {
    id: string;
    name: string;
    teacher: string;
    class: string;
  };
  assignments: {
    count: number;
    average: number | null;
    details: AssignmentGrade[];
  };
  quizzes: {
    count: number;
    average: number | null;
    passed: number;
    details: QuizGrade[];
  };
  overallGrade: number | null;
  letterGrade: string | null;
}

export interface StudentGrades {
  student: {
    id: string;
  };
  subjects: SubjectGrade[];
  statistics: {
    totalSubjects: number;
    overallAverage: number | null;
    letterGrade: string | null;
  };
}

export interface GradebookStudent {
  student: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  assignments: {
    assignmentId: string;
    assignmentTitle: string;
    score: number | null;
    maxScore: number;
    status: string;
    percentage: number | null;
  }[];
  quizzes: {
    quizId: string;
    quizTitle: string;
    score: number | null;
    maxScore: number;
    percentage: number | null;
    status: string;
    isPassed: boolean | null;
  }[];
  averages: {
    assignments: number | null;
    quizzes: number | null;
    overall: number | null;
    letterGrade: string | null;
  };
}

export interface SubjectGradebook {
  subject: {
    id: string;
    name: string;
    class: string;
    teacher: string;
  };
  assignments: {
    id: string;
    title: string;
    maxScore: number;
  }[];
  quizzes: {
    id: string;
    title: string;
    maxScore: number;
    passingScore: number;
  }[];
  students: GradebookStudent[];
}

export interface ProgressTimelineItem {
  type: 'assignment' | 'quiz';
  date: string;
  title: string;
  subject: string;
  subjectId: string;
  score: number;
  maxScore: number;
  percentage: number;
  isPassed?: boolean;
}

export interface StudentProgress {
  timeline: ProgressTimelineItem[];
  statistics: {
    totalAssignments: number;
    totalQuizzes: number;
    assignmentAverage: number | null;
    quizAverage: number | null;
    quizzesPassed: number;
    quizzesFailed: number;
  };
}

// ============================================
// API Functions
// ============================================

/**
 * Get all grades for a student (all subjects)
 * @param studentId - Student ID
 */
export const getStudentGrades = async (studentId: string): Promise<StudentGrades> => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/grades/students/${studentId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data.data;
};

/**
 * Get student progress over time
 * @param studentId - Student ID
 */
export const getStudentProgress = async (studentId: string): Promise<StudentProgress> => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/grades/students/${studentId}/progress`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data.data;
};

/**
 * Get gradebook for a subject (all students)
 * @param subjectId - Subject ID
 */
export const getSubjectGradebook = async (subjectId: string): Promise<SubjectGradebook> => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/grades/subjects/${subjectId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data.data;
};

/**
 * Export gradebook to CSV
 * @param subjectId - Subject ID
 */
export const exportGradebookCSV = async (subjectId: string): Promise<void> => {
  const token = useAuthStore.getState().token;
  const response = await axios.get(`${API_URL}/grades/subjects/${subjectId}/export`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    responseType: 'blob' // Important for file download
  });

  // Create blob link to download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;

  // Get filename from Content-Disposition header or use default
  const contentDisposition = response.headers['content-disposition'];
  let filename = 'gradebook.csv';
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
  }

  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get color class for grade percentage
 */
export const getGradeColor = (percentage: number | null): string => {
  if (percentage === null) return 'text-gray-400';
  if (percentage >= 90) return 'text-success-600';
  if (percentage >= 80) return 'text-primary-600';
  if (percentage >= 70) return 'text-warning-600';
  if (percentage >= 60) return 'text-warning-700';
  return 'text-danger-600';
};

/**
 * Get background color class for grade percentage
 */
export const getGradeBgColor = (percentage: number | null): string => {
  if (percentage === null) return 'bg-gray-100';
  if (percentage >= 90) return 'bg-success-100';
  if (percentage >= 80) return 'bg-primary-100';
  if (percentage >= 70) return 'bg-warning-100';
  if (percentage >= 60) return 'bg-warning-200';
  return 'bg-danger-100';
};

/**
 * Get letter grade badge color
 */
export const getLetterGradeBadgeColor = (letter: string | null): string => {
  if (!letter) return 'bg-gray-100 text-gray-700';
  switch (letter) {
    case 'A':
      return 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400';
    case 'B':
      return 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400';
    case 'C':
      return 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400';
    case 'D':
      return 'bg-warning-200 text-warning-800 dark:bg-warning-900/40 dark:text-warning-300';
    case 'F':
      return 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
};

/**
 * Format percentage with 1 decimal place
 */
export const formatPercentage = (percentage: number | null): string => {
  if (percentage === null) return 'N/A';
  return `${percentage.toFixed(1)}%`;
};

/**
 * Format score as "score/maxScore"
 */
export const formatScore = (score: number | null, maxScore: number): string => {
  if (score === null) return `- / ${maxScore}`;
  return `${score} / ${maxScore}`;
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Get progress bar width percentage
 */
export const getProgressWidth = (score: number | null, maxScore: number): number => {
  if (score === null) return 0;
  return Math.min((score / maxScore) * 100, 100);
};

/**
 * Calculate days since date
 */
export const daysSince = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Group timeline by month
 */
export const groupTimelineByMonth = (timeline: ProgressTimelineItem[]): Record<string, ProgressTimelineItem[]> => {
  return timeline.reduce((groups, item) => {
    const date = new Date(item.date);
    const monthKey = date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });

    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(item);

    return groups;
  }, {} as Record<string, ProgressTimelineItem[]>);
};
