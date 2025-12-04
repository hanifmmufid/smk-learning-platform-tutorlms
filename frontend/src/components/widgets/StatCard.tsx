import React from 'react';
import Card from '../ui/Card';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down';
  };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
  onClick?: () => void;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  color = 'primary',
  onClick,
  className = '',
}) => {
  const colorClasses = {
    primary: {
      bg: 'bg-gradient-to-br from-primary-500 to-primary-600',
      iconBg: 'bg-primary-600 bg-opacity-20',
      text: 'text-white',
      trendUp: 'text-green-300',
      trendDown: 'text-red-300',
    },
    success: {
      bg: 'bg-gradient-to-br from-success-500 to-success-600',
      iconBg: 'bg-success-600 bg-opacity-20',
      text: 'text-white',
      trendUp: 'text-green-200',
      trendDown: 'text-red-300',
    },
    warning: {
      bg: 'bg-gradient-to-br from-warning-500 to-warning-600',
      iconBg: 'bg-warning-600 bg-opacity-20',
      text: 'text-white',
      trendUp: 'text-green-300',
      trendDown: 'text-red-300',
    },
    danger: {
      bg: 'bg-gradient-to-br from-danger-500 to-danger-600',
      iconBg: 'bg-danger-600 bg-opacity-20',
      text: 'text-white',
      trendUp: 'text-green-300',
      trendDown: 'text-red-300',
    },
    info: {
      bg: 'bg-gradient-to-br from-info-500 to-info-600',
      iconBg: 'bg-info-600 bg-opacity-20',
      text: 'text-white',
      trendUp: 'text-green-300',
      trendDown: 'text-red-300',
    },
    gray: {
      bg: 'bg-gradient-to-br from-gray-600 to-gray-700',
      iconBg: 'bg-gray-700 bg-opacity-20',
      text: 'text-white',
      trendUp: 'text-green-300',
      trendDown: 'text-red-300',
    },
  };

  const colors = colorClasses[color];

  return (
    <Card
      onClick={onClick}
      hoverable={!!onClick}
      className={`${colors.bg} ${colors.text} border-none overflow-hidden relative ${className}`}
      padding="md"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <div className="absolute top-0 right-0 w-full h-full bg-white rounded-full transform translate-x-12 -translate-y-12" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm opacity-90 mb-1">{title}</p>
            <h3 className="text-3xl font-bold">{value}</h3>
          </div>
          {icon && (
            <div className={`p-3 rounded-lg ${colors.iconBg}`}>
              <div className="w-6 h-6">{icon}</div>
            </div>
          )}
        </div>

        {/* Trend or description */}
        {trend && (
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                trend.direction === 'up' ? colors.trendUp : colors.trendDown
              }`}
            >
              {trend.direction === 'up' ? (
                <ArrowUpIcon className="w-4 h-4" />
              ) : (
                <ArrowDownIcon className="w-4 h-4" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
            <span className="text-sm opacity-80">{trend.label}</span>
          </div>
        )}

        {description && !trend && (
          <p className="text-sm opacity-80">{description}</p>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
