import React from 'react';
import Button from './Button';
import {
  InboxIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'compact';
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className = '',
}) => {
  const defaultIcon = <InboxIcon className="w-16 h-16 text-gray-300" />;

  if (variant === 'compact') {
    return (
      <div className={`text-center py-6 ${className}`}>
        <div className="mx-auto mb-3">{icon || defaultIcon}</div>
        <h3 className="text-sm font-medium text-gray-700 mb-1">{title}</h3>
        {description && <p className="text-xs text-gray-500">{description}</p>}
        {action && (
          <Button
            variant="ghost"
            size="sm"
            onClick={action.onClick}
            className="mt-3"
          >
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`text-center py-12 px-6 ${className}`}>
      <div className="mx-auto mb-4">{icon || defaultIcon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} size="md">
          {action.label}
        </Button>
      )}
    </div>
  );
};

// Export commonly used icons for empty states
export {
  InboxIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
};

export default EmptyState;
