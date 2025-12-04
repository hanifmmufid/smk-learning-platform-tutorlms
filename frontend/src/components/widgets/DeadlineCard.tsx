import React from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import {
  ClockIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

export interface DeadlineItem {
  id: string;
  title: string;
  type: 'assignment' | 'quiz' | 'material';
  subject: string;
  dueDate: string;
  daysLeft: number;
  status?: 'upcoming' | 'soon' | 'overdue';
  href?: string;
}

export interface DeadlineCardProps {
  deadlines: DeadlineItem[];
  title?: string;
  maxItems?: number;
  className?: string;
  onViewAll?: () => void;
}

const DeadlineCard: React.FC<DeadlineCardProps> = ({
  deadlines,
  title = 'Deadline Mendatang',
  maxItems = 5,
  className = '',
  onViewAll,
}) => {
  const displayedDeadlines = deadlines.slice(0, maxItems);

  const getStatusBadge = (daysLeft: number, status?: DeadlineItem['status']) => {
    if (status === 'overdue' || daysLeft < 0) {
      return <Badge variant="danger" size="sm" dot>Terlambat</Badge>;
    }
    if (status === 'soon' || daysLeft <= 2) {
      return <Badge variant="warning" size="sm" dot>Segera</Badge>;
    }
    return <Badge variant="info" size="sm" dot>{daysLeft} hari lagi</Badge>;
  };

  const getTypeIcon = (type: DeadlineItem['type']) => {
    const iconClass = 'w-5 h-5';
    switch (type) {
      case 'assignment':
        return <span className="text-xl">📝</span>;
      case 'quiz':
        return <span className="text-xl">🎯</span>;
      case 'material':
        return <span className="text-xl">📚</span>;
      default:
        return <ClockIcon className={iconClass} />;
    }
  };

  const getTypeLabel = (type: DeadlineItem['type']) => {
    const labels = {
      assignment: 'Tugas',
      quiz: 'Quiz',
      material: 'Materi',
    };
    return labels[type];
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-500" />
            {title}
          </CardTitle>
          {deadlines.length > maxItems && onViewAll && (
            <button
              onClick={onViewAll}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Lihat Semua
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {displayedDeadlines.length > 0 ? (
          <div className="space-y-3">
            {displayedDeadlines.map((deadline) => {
              const content = (
                <>
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getTypeIcon(deadline.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {deadline.title}
                      </h4>
                      {getStatusBadge(deadline.daysLeft, deadline.status)}
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      {getTypeLabel(deadline.type)} • {deadline.subject}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <ClockIcon className="w-3 h-3" />
                      <span>{deadline.dueDate}</span>
                    </div>
                  </div>
                </>
              );

              const className = `flex items-start gap-3 p-3 rounded-lg border border-gray-200 ${
                deadline.href ? 'hover:bg-gray-50 hover:border-primary-300 transition-colors cursor-pointer' : ''
              }`;

              return deadline.href ? (
                <Link
                  key={deadline.id}
                  to={deadline.href}
                  className={className}
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={deadline.id}
                  className={className}
                >
                  {content}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">Tidak ada deadline mendatang</p>
            <p className="text-xs text-gray-400 mt-1">Semua tugas sudah selesai!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeadlineCard;
