import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import {
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export interface AssignmentCardProps {
  id: string;
  title: string;
  description?: string | null;
  instructions: string;
  subject: {
    name: string;
    class?: {
      name: string;
    };
  };
  teacher?: {
    name: string;
  };
  dueDate: string;
  maxScore: number;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  allowLateSubmission: boolean;
  submissionCount?: number;

  // Student-specific props
  mySubmission?: {
    id: string;
    status: 'SUBMITTED' | 'GRADED' | 'PENDING' | 'LATE';
    score?: number | null;
    feedback?: string | null;
    submittedAt?: string;
  } | null;

  // Actions
  onSubmit?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewSubmissions?: () => void;

  // View mode
  viewMode?: 'student' | 'teacher';
  className?: string;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  title,
  description,
  subject,
  teacher,
  dueDate,
  maxScore,
  status,
  allowLateSubmission,
  submissionCount,
  mySubmission,
  onSubmit,
  onEdit,
  onDelete,
  onViewSubmissions,
  viewMode = 'student',
  className = '',
}) => {
  // Calculate deadline status
  const now = new Date();
  const deadline = new Date(dueDate);
  const isOverdue = now > deadline;
  const timeUntilDue = deadline.getTime() - now.getTime();
  const daysUntilDue = Math.floor(timeUntilDue / (1000 * 60 * 60 * 24));
  const hoursUntilDue = Math.floor((timeUntilDue % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  // Format deadline
  const formatDeadline = () => {
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return deadline.toLocaleDateString('id-ID', options);
  };

  // Get status badge variant
  const getStatusVariant = (): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
    if (status === 'DRAFT') return 'warning';
    if (status === 'PUBLISHED') return 'success';
    if (status === 'CLOSED') return 'danger';
    return 'info';
  };

  // Get submission status
  const getSubmissionStatus = () => {
    if (!mySubmission) {
      if (isOverdue) {
        return { label: 'Terlambat', variant: 'danger' as const, icon: XCircleIcon };
      }
      return { label: 'Belum Dikerjakan', variant: 'warning' as const, icon: ExclamationCircleIcon };
    }

    if (mySubmission.status === 'GRADED') {
      return { label: 'Sudah Dinilai', variant: 'success' as const, icon: CheckCircleIcon };
    }

    return { label: 'Menunggu Penilaian', variant: 'info' as const, icon: ClockIcon };
  };

  const submissionStatus = getSubmissionStatus();
  const StatusIcon = submissionStatus.icon;

  // Countdown display
  const getCountdown = () => {
    if (isOverdue) {
      return <span className="text-danger-600 font-semibold">Terlambat</span>;
    }

    if (daysUntilDue > 7) {
      return <span className="text-gray-600">{daysUntilDue} hari lagi</span>;
    }

    if (daysUntilDue > 0) {
      return <span className="text-warning-600 font-semibold">{daysUntilDue} hari {hoursUntilDue} jam lagi</span>;
    }

    if (hoursUntilDue > 0) {
      return <span className="text-danger-600 font-semibold">{hoursUntilDue} jam lagi</span>;
    }

    return <span className="text-danger-600 font-semibold">Kurang dari 1 jam!</span>;
  };

  return (
    <Card hoverable className={`h-full ${className}`}>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="primary" size="sm">
                  {subject.name}
                </Badge>
                {viewMode === 'teacher' && (
                  <Badge variant={getStatusVariant()} size="sm">
                    {status === 'DRAFT' ? 'Draft' : status === 'PUBLISHED' ? 'Dipublikasikan' : 'Ditutup'}
                  </Badge>
                )}
                {viewMode === 'student' && mySubmission && (
                  <Badge variant={submissionStatus.variant} size="sm">
                    <StatusIcon className="w-3 h-3 inline mr-1" />
                    {submissionStatus.label}
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
            <CalendarIcon className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Deadline</p>
              <p className={`font-medium ${isOverdue ? 'text-danger-600' : 'text-gray-900'}`}>
                {formatDeadline()}
              </p>
              <p className="text-xs mt-0.5">{getCountdown()}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <AcademicCapIcon className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Nilai Maksimal</p>
              <p className="font-bold text-primary-600 text-lg">{maxScore}</p>
            </div>
          </div>

          {viewMode === 'student' && teacher && (
            <div className="flex items-start gap-2 col-span-2">
              <UserIcon className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Guru</p>
                <p className="font-medium text-gray-900">{teacher.name}</p>
              </div>
            </div>
          )}

          {viewMode === 'teacher' && (
            <>
              <div className="flex items-start gap-2">
                <UserIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Kelas</p>
                  <p className="font-medium text-gray-900">{subject.class?.name || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Submissions</p>
                  <p className="font-bold text-success-600">{submissionCount || 0} siswa</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Submission Info for Students */}
        {viewMode === 'student' && mySubmission && (
          <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-primary-900">Status Pengumpulan</span>
              <Badge variant={submissionStatus.variant} size="sm">
                {submissionStatus.label}
              </Badge>
            </div>

            {mySubmission.status === 'GRADED' && mySubmission.score !== null && (
              <div className="flex items-center justify-between pt-2 border-t border-primary-200">
                <span className="text-sm text-primary-700">Nilai Anda:</span>
                <span className="text-2xl font-bold text-success-600">
                  {mySubmission.score}/{maxScore}
                </span>
              </div>
            )}

            {mySubmission.feedback && (
              <div className="pt-2 border-t border-primary-200">
                <p className="text-xs text-primary-700 mb-1">Feedback Guru:</p>
                <p className="text-sm text-primary-900 italic">"{mySubmission.feedback}"</p>
              </div>
            )}
          </div>
        )}

        {/* Additional Info */}
        {allowLateSubmission && viewMode === 'student' && !mySubmission && (
          <div className="flex items-center gap-2 text-xs text-warning-700 bg-warning-50 px-3 py-2 rounded-lg">
            <ExclamationCircleIcon className="w-4 h-4" />
            <span>Pengumpulan terlambat diperbolehkan</span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 border-t border-gray-100">
          {viewMode === 'student' ? (
            <div className="flex gap-2">
              {!mySubmission && onSubmit && (
                <Button
                  variant={isOverdue ? 'warning' : 'primary'}
                  fullWidth
                  onClick={onSubmit}
                  leftIcon={<PencilSquareIcon className="w-5 h-5" />}
                >
                  {isOverdue ? 'Kumpulkan (Terlambat)' : 'Kumpulkan Tugas'}
                </Button>
              )}
              {mySubmission && (
                <Button
                  variant="ghost"
                  fullWidth
                  disabled
                  leftIcon={<CheckCircleIcon className="w-5 h-5" />}
                >
                  Sudah Dikumpulkan
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              {onViewSubmissions && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={onViewSubmissions}
                  leftIcon={<EyeIcon className="w-4 h-4" />}
                >
                  Lihat
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onEdit}
                  leftIcon={<PencilSquareIcon className="w-4 h-4" />}
                >
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={onDelete}
                  leftIcon={<TrashIcon className="w-4 h-4" />}
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

export default AssignmentCard;
