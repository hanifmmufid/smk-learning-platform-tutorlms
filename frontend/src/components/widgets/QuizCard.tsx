import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import {
  ClockIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline';

export interface QuizCardProps {
  id: string;
  title: string;
  description?: string | null;
  subject: {
    name: string;
    class?: {
      name: string;
    };
  };
  totalQuestions?: number;
  timeLimit?: number | null; // in minutes
  passingScore: number;
  totalAttempts?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED';

  // Student-specific props
  myAttempt?: {
    id: string;
    status: 'IN_PROGRESS' | 'GRADED' | 'SUBMITTED';
    score?: number | null;
    percentage?: number | null;
    isPassed?: boolean | null;
    submittedAt?: string;
  } | null;

  // Actions
  onStart?: () => void;
  onViewResults?: () => void;
  onManageQuestions?: () => void;
  onPublish?: () => void;
  onViewAttempts?: () => void;
  onDelete?: () => void;

  // View mode
  viewMode?: 'student' | 'teacher';
  className?: string;
}

const QuizCard: React.FC<QuizCardProps> = ({
  title,
  description,
  subject,
  totalQuestions,
  timeLimit,
  passingScore,
  totalAttempts,
  status,
  myAttempt,
  onStart,
  onViewResults,
  onManageQuestions,
  onPublish,
  onViewAttempts,
  onDelete,
  viewMode = 'student',
  className = '',
}) => {
  // Format time limit
  const formatTimeLimit = (minutes?: number | null): string => {
    if (!minutes) return 'Tidak dibatasi';
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} jam ${mins} menit` : `${hours} jam`;
  };

  // Get status badge variant
  const getStatusVariant = (): 'primary' | 'success' | 'warning' | 'danger' => {
    if (status === 'DRAFT') return 'warning';
    if (status === 'PUBLISHED') return 'success';
    if (status === 'CLOSED') return 'danger';
    return 'primary';
  };

  // Get status label
  const getStatusLabel = (): string => {
    if (status === 'DRAFT') return 'Draft';
    if (status === 'PUBLISHED') return 'Dipublikasikan';
    if (status === 'CLOSED') return 'Ditutup';
    return 'Unknown';
  };

  // Check if completed
  const isCompleted = myAttempt && myAttempt.status === 'GRADED';
  const isPassed = myAttempt?.isPassed === true;

  return (
    <Card hoverable className={`h-full ${className}`}>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="primary" size="sm">
                  {subject.name}
                </Badge>
                {viewMode === 'teacher' && status && (
                  <Badge variant={getStatusVariant()} size="sm">
                    {getStatusLabel()}
                  </Badge>
                )}
                {viewMode === 'student' && isCompleted && (
                  <Badge variant={isPassed ? 'success' : 'danger'} size="sm">
                    {isPassed ? (
                      <>
                        <CheckCircleIcon className="w-3 h-3 inline mr-1" />
                        Lulus
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="w-3 h-3 inline mr-1" />
                        Tidak Lulus
                      </>
                    )}
                  </Badge>
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                {title}
              </h3>
            </div>
          </div>

          {description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <DocumentCheckIcon className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Pertanyaan</p>
              <p className="font-bold text-primary-600">{totalQuestions || 0}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <ClockIcon className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Waktu</p>
              <p className="font-medium text-gray-900 text-xs">
                {formatTimeLimit(timeLimit)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <AcademicCapIcon className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Passing Score</p>
              <p className="font-bold text-success-600">{passingScore}%</p>
            </div>
          </div>

          {viewMode === 'teacher' && (
            <div className="flex items-start gap-2">
              <CheckCircleIcon className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Attempts</p>
                <p className="font-bold text-info-600">{totalAttempts || 0}</p>
              </div>
            </div>
          )}

          {viewMode === 'student' && subject.class && (
            <div className="flex items-start gap-2 col-span-2">
              <AcademicCapIcon className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Kelas</p>
                <p className="font-medium text-gray-900">{subject.class.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Score Info for Students */}
        {viewMode === 'student' && isCompleted && myAttempt && (
          <div className={`p-3 rounded-lg border ${
            isPassed
              ? 'bg-success-50 border-success-200'
              : 'bg-danger-50 border-danger-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">Nilai Anda:</span>
              <span className={`text-2xl font-bold ${
                isPassed ? 'text-success-600' : 'text-danger-600'
              }`}>
                {myAttempt.percentage !== null && myAttempt.percentage !== undefined
                  ? `${Math.round(myAttempt.percentage)}%`
                  : myAttempt.score !== null && myAttempt.score !== undefined
                  ? myAttempt.score
                  : '-'
                }
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 border-t border-gray-100">
          {viewMode === 'student' ? (
            <div className="flex gap-2">
              {!isCompleted && onStart && (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={onStart}
                  leftIcon={<PlayIcon className="w-5 h-5" />}
                >
                  {myAttempt?.status === 'IN_PROGRESS' ? 'Lanjutkan' : 'Mulai Quiz'}
                </Button>
              )}
              {isCompleted && onViewResults && (
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={onViewResults}
                  leftIcon={<EyeIcon className="w-5 h-5" />}
                >
                  Lihat Hasil
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {onManageQuestions && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onManageQuestions}
                  leftIcon={<PencilSquareIcon className="w-4 h-4" />}
                  fullWidth
                >
                  Kelola Pertanyaan
                </Button>
              )}
              {status === 'DRAFT' && onPublish && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={onPublish}
                  leftIcon={<CheckCircleIcon className="w-4 h-4" />}
                  fullWidth
                >
                  Publish Quiz
                </Button>
              )}
              {onViewAttempts && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onViewAttempts}
                  leftIcon={<EyeIcon className="w-4 h-4" />}
                  fullWidth
                >
                  Lihat Attempts ({totalAttempts || 0})
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={onDelete}
                  leftIcon={<TrashIcon className="w-4 h-4" />}
                  fullWidth
                >
                  Hapus
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default QuizCard;
