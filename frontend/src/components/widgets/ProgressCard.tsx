import React from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export interface ProgressCardProps {
  title: string;
  description?: string;
  completed: number;
  total: number;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'info';
  showPercentage?: boolean;
  className?: string;
}

const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  description,
  completed,
  total,
  icon,
  color = 'primary',
  showPercentage = true,
  className = '',
}) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const colorClasses = {
    primary: {
      bg: 'bg-primary-50',
      text: 'text-primary-700',
      progressBg: 'bg-primary-100',
      progressFill: 'bg-primary-500',
      iconBg: 'bg-primary-100',
      iconText: 'text-primary-600',
    },
    success: {
      bg: 'bg-success-50',
      text: 'text-success-700',
      progressBg: 'bg-success-100',
      progressFill: 'bg-success-500',
      iconBg: 'bg-success-100',
      iconText: 'text-success-600',
    },
    warning: {
      bg: 'bg-warning-50',
      text: 'text-warning-700',
      progressBg: 'bg-warning-100',
      progressFill: 'bg-warning-500',
      iconBg: 'bg-warning-100',
      iconText: 'text-warning-600',
    },
    info: {
      bg: 'bg-info-50',
      text: 'text-info-700',
      progressBg: 'bg-info-100',
      progressFill: 'bg-info-500',
      iconBg: 'bg-info-100',
      iconText: 'text-info-600',
    },
  };

  const colors = colorClasses[color];
  const defaultIcon = completed === total ? (
    <CheckCircleIcon className="w-6 h-6" />
  ) : (
    <ClockIcon className="w-6 h-6" />
  );

  return (
    <Card className={`${colors.bg} border-none ${className}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className={`text-lg ${colors.text}`}>{title}</CardTitle>
            {description && (
              <p className={`text-sm mt-1 ${colors.text} opacity-80`}>{description}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colors.iconBg}`}>
            <div className={colors.iconText}>{icon || defaultIcon}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Progress bar */}
        <div className="space-y-2">
          <div className={`w-full h-3 rounded-full overflow-hidden ${colors.progressBg}`}>
            <div
              className={`h-full ${colors.progressFill} transition-all duration-500 ease-out`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <span className={`font-medium ${colors.text}`}>
              {completed} dari {total} selesai
            </span>
            {showPercentage && (
              <span className={`font-bold text-lg ${colors.text}`}>{percentage}%</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressCard;
