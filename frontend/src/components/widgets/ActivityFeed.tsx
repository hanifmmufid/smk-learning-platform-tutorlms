import React from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import {
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

export interface Activity {
  id: string;
  type: 'material' | 'assignment' | 'quiz' | 'grade' | 'announcement';
  title: string;
  description?: string;
  time: string;
  status?: 'success' | 'warning' | 'danger' | 'info';
  icon?: React.ReactNode;
}

export interface ActivityFeedProps {
  activities: Activity[];
  title?: string;
  maxItems?: number;
  className?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  title = 'Aktivitas Terbaru',
  maxItems = 10,
  className = '',
  showViewAll = true,
  onViewAll,
}) => {
  const displayedActivities = activities.slice(0, maxItems);

  const getDefaultIcon = (type: Activity['type']) => {
    const iconClass = 'w-5 h-5';
    switch (type) {
      case 'material':
        return <DocumentTextIcon className={iconClass} />;
      case 'assignment':
        return <DocumentTextIcon className={iconClass} />;
      case 'quiz':
        return <AcademicCapIcon className={iconClass} />;
      case 'grade':
        return <CheckCircleIcon className={iconClass} />;
      case 'announcement':
        return <BellIcon className={iconClass} />;
      default:
        return <ClockIcon className={iconClass} />;
    }
  };

  const getStatusColor = (status?: Activity['status']) => {
    switch (status) {
      case 'success':
        return 'bg-success-100 text-success-700 border-success-200';
      case 'warning':
        return 'bg-warning-100 text-warning-700 border-warning-200';
      case 'danger':
        return 'bg-danger-100 text-danger-700 border-danger-200';
      case 'info':
        return 'bg-info-100 text-info-700 border-info-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status?: Activity['status']) => {
    const iconClass = 'w-4 h-4';
    switch (status) {
      case 'success':
        return <CheckCircleIcon className={iconClass} />;
      case 'danger':
        return <XCircleIcon className={iconClass} />;
      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-gray-500" />
            {title}
          </CardTitle>
          {showViewAll && activities.length > maxItems && onViewAll && (
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
        {displayedActivities.length > 0 ? (
          <div className="space-y-0">
            {displayedActivities.map((activity, index) => (
              <div
                key={activity.id}
                className={`flex gap-3 py-3 ${
                  index !== displayedActivities.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${getStatusColor(
                    activity.status
                  )}`}
                >
                  {activity.icon || getDefaultIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {activity.title}
                    </h4>
                    {activity.status && getStatusIcon(activity.status)}
                  </div>
                  {activity.description && (
                    <p className="text-sm text-gray-600 mb-1 line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ClockIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">Belum ada aktivitas</p>
            <p className="text-xs text-gray-400 mt-1">
              Aktivitas terbaru akan muncul di sini
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
