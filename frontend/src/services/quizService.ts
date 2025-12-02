import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';

// Types
export type QuizStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';
export type QuestionType = 'MCQ' | 'ESSAY' | 'TRUE_FALSE';
export type QuizAttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';

export interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean; // Only visible to teachers
}

export interface Question {
  id: string;
  quizId: string;
  type: QuestionType;
  question: string;
  points: number;
  order: number;
  explanation?: string;
  options?: QuizOption[];
  maxWords?: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  subjectId: string;
  teacherId: string;
  timeLimit?: number;
  passingScore: number;
  maxScore: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showResults: boolean;
  status: QuizStatus;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  subject?: {
    id: string;
    name: string;
    class: {
      id: string;
      name: string;
      grade: number;
      academicYear: string;
    };
  };
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
  questions?: Question[];
  totalQuestions?: number;
  totalAttempts?: number;
  calculatedMaxScore?: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  startedAt: string;
  submittedAt?: string;
  score?: number;
  percentage?: number;
  isPassed?: boolean;
  status: QuizAttemptStatus;
  timeSpent?: number;
  quiz?: Quiz;
  student?: {
    id: string;
    name: string;
    email: string;
  };
  answers?: Answer[];
}

export interface Answer {
  id: string;
  attemptId: string;
  questionId: string;
  answer: any; // {selectedOption: string} | {text: string} | {value: boolean}
  isCorrect?: boolean;
  pointsAwarded?: number;
  feedback?: string;
  question?: Question;
}

// Helper function to get auth token
const getAuthConfig = () => {
  const token = useAuthStore.getState().token;
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

/**
 * Quiz Management (Teachers)
 */

// Get all quizzes with optional filters
export const getAllQuizzes = async (filters?: {
  subjectId?: string;
  teacherId?: string;
  status?: QuizStatus;
}): Promise<Quiz[]> => {
  const params = new URLSearchParams();
  if (filters?.subjectId) params.append('subjectId', filters.subjectId);
  if (filters?.teacherId) params.append('teacherId', filters.teacherId);
  if (filters?.status) params.append('status', filters.status);

  const response = await axios.get(
    `${API_URL}/quizzes${params.toString() ? `?${params}` : ''}`,
    getAuthConfig()
  );
  return response.data;
};

// Get quiz by ID
export const getQuizById = async (id: string): Promise<Quiz> => {
  const response = await axios.get(`${API_URL}/quizzes/${id}`, getAuthConfig());
  return response.data;
};

// Create new quiz
export const createQuiz = async (data: {
  title: string;
  description?: string;
  subjectId: string;
  timeLimit?: number;
  passingScore?: number;
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
  showResults?: boolean;
  status?: QuizStatus;
  startDate?: string;
  endDate?: string;
}): Promise<Quiz> => {
  const response = await axios.post(`${API_URL}/quizzes`, data, getAuthConfig());
  return response.data;
};

// Update quiz
export const updateQuiz = async (id: string, data: Partial<Quiz>): Promise<Quiz> => {
  const response = await axios.put(`${API_URL}/quizzes/${id}`, data, getAuthConfig());
  return response.data;
};

// Delete quiz
export const deleteQuiz = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/quizzes/${id}`, getAuthConfig());
};

/**
 * Question Management (Teachers)
 */

// Add question to quiz
export const addQuestion = async (
  quizId: string,
  data: {
    type: QuestionType;
    question: string;
    points: number;
    order: number;
    explanation?: string;
    options?: QuizOption[];
    maxWords?: number;
  }
): Promise<Question> => {
  const response = await axios.post(
    `${API_URL}/quizzes/${quizId}/questions`,
    data,
    getAuthConfig()
  );
  return response.data;
};

// Update question
export const updateQuestion = async (id: string, data: Partial<Question>): Promise<Question> => {
  const response = await axios.put(`${API_URL}/quizzes/questions/${id}`, data, getAuthConfig());
  return response.data;
};

// Delete question
export const deleteQuestion = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/quizzes/questions/${id}`, getAuthConfig());
};

/**
 * Quiz Attempts (Students)
 */

// Get my quiz attempts
export const getMyAttempts = async (subjectId?: string): Promise<QuizAttempt[]> => {
  const params = subjectId ? `?subjectId=${subjectId}` : '';
  const response = await axios.get(`${API_URL}/attempts/my-attempts${params}`, getAuthConfig());
  return response.data;
};

// Start quiz attempt
export const startQuizAttempt = async (quizId: string): Promise<{
  attempt: QuizAttempt;
  quiz: Quiz;
}> => {
  const response = await axios.post(
    `${API_URL}/attempts/quizzes/${quizId}/start`,
    {},
    getAuthConfig()
  );
  return response.data;
};

// Submit quiz attempt
export const submitQuizAttempt = async (
  attemptId: string,
  data: {
    answers: Array<{
      questionId: string;
      answer: any;
    }>;
    timeSpent?: number;
  }
): Promise<QuizAttempt> => {
  const response = await axios.post(
    `${API_URL}/attempts/${attemptId}/submit`,
    data,
    getAuthConfig()
  );
  return response.data;
};

// Get attempt results
export const getAttemptResults = async (attemptId: string): Promise<QuizAttempt> => {
  const response = await axios.get(`${API_URL}/attempts/${attemptId}/results`, getAuthConfig());
  return response.data;
};

// Get all attempts for a quiz (Teachers)
export const getQuizAttempts = async (quizId: string): Promise<QuizAttempt[]> => {
  const response = await axios.get(
    `${API_URL}/attempts/quizzes/${quizId}/attempts`,
    getAuthConfig()
  );
  return response.data;
};

// Grade essay answer (Teachers)
export const gradeEssayAnswer = async (
  answerId: string,
  data: {
    pointsAwarded: number;
    feedback?: string;
  }
): Promise<Answer> => {
  const response = await axios.put(
    `${API_URL}/attempts/answers/${answerId}/grade`,
    data,
    getAuthConfig()
  );
  return response.data;
};

/**
 * Helper functions
 */

// Format time limit (minutes to readable string)
export const formatTimeLimit = (minutes?: number): string => {
  if (!minutes) return 'Tidak Terbatas';
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} jam ${mins} menit` : `${hours} jam`;
};

// Check if quiz is available
export const isQuizAvailable = (quiz: Quiz): boolean => {
  if (quiz.status !== 'PUBLISHED') return false;
  const now = new Date();
  if (quiz.startDate && now < new Date(quiz.startDate)) return false;
  if (quiz.endDate && now > new Date(quiz.endDate)) return false;
  return true;
};

// Get quiz status badge color
export const getQuizStatusColor = (status: QuizStatus): string => {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800';
    case 'PUBLISHED':
      return 'bg-green-100 text-green-800';
    case 'CLOSED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Get quiz status label
export const getQuizStatusLabel = (status: QuizStatus): string => {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'PUBLISHED':
      return 'Published';
    case 'CLOSED':
      return 'Closed';
    default:
      return status;
  }
};

// Get attempt status color
export const getAttemptStatusColor = (status: QuizAttemptStatus): string => {
  switch (status) {
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800';
    case 'SUBMITTED':
      return 'bg-yellow-100 text-yellow-800';
    case 'GRADED':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Get attempt status label
export const getAttemptStatusLabel = (status: QuizAttemptStatus): string => {
  switch (status) {
    case 'IN_PROGRESS':
      return 'Sedang Dikerjakan';
    case 'SUBMITTED':
      return 'Sudah Submit';
    case 'GRADED':
      return 'Sudah Dinilai';
    default:
      return status;
  }
};

// Format quiz percentage
export const formatPercentage = (percentage?: number): string => {
  if (percentage === undefined || percentage === null) return '-';
  return `${percentage.toFixed(1)}%`;
};

// Check if passed
export const checkPassed = (percentage?: number, passingScore?: number): boolean => {
  if (percentage === undefined || percentage === null || passingScore === undefined) return false;
  return percentage >= passingScore;
};

// Calculate time remaining (for timer)
export const calculateTimeRemaining = (
  startedAt: string,
  timeLimit?: number
): { remaining: number; isExpired: boolean } => {
  if (!timeLimit) return { remaining: 0, isExpired: false };

  const now = Date.now();
  const started = new Date(startedAt).getTime();
  const elapsed = Math.floor((now - started) / 1000); // seconds
  const limit = timeLimit * 60; // convert to seconds
  const remaining = Math.max(0, limit - elapsed);

  return {
    remaining,
    isExpired: remaining === 0,
  };
};

// Format time remaining for display (MM:SS)
export const formatTimeRemaining = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
