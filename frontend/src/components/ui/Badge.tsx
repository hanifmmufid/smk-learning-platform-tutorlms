import React from 'react';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'admin' | 'teacher' | 'student';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'gray',
      size = 'md',
      dot = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = 'inline-flex items-center font-medium rounded-full';

    // Variant styles
    const variantStyles: Record<BadgeVariant, string> = {
      primary: 'bg-primary-100 text-primary-700 border border-primary-200',
      success: 'bg-success-100 text-success-700 border border-success-200',
      warning: 'bg-warning-100 text-warning-700 border border-warning-200',
      danger: 'bg-danger-100 text-danger-700 border border-danger-200',
      info: 'bg-info-100 text-info-700 border border-info-200',
      gray: 'bg-gray-100 text-gray-700 border border-gray-200',
      admin: 'bg-admin-100 text-admin-700 border border-admin-200',
      teacher: 'bg-teacher-100 text-teacher-700 border border-teacher-200',
      student: 'bg-student-100 text-student-700 border border-student-200',
    };

    // Size styles
    const sizeStyles: Record<BadgeSize, string> = {
      sm: 'px-2 py-0.5 text-xs gap-1',
      md: 'px-2.5 py-1 text-sm gap-1.5',
      lg: 'px-3 py-1.5 text-base gap-2',
    };

    // Dot color styles
    const dotColorStyles: Record<BadgeVariant, string> = {
      primary: 'bg-primary-500',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      danger: 'bg-danger-500',
      info: 'bg-info-500',
      gray: 'bg-gray-500',
      admin: 'bg-admin-500',
      teacher: 'bg-teacher-500',
      student: 'bg-student-500',
    };

    // Dot size styles
    const dotSizeStyles: Record<BadgeSize, string> = {
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-2.5 h-2.5',
    };

    // Combined classes
    const badgeClasses = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    return (
      <span ref={ref} className={badgeClasses} {...props}>
        {dot && (
          <span className={`rounded-full ${dotColorStyles[variant]} ${dotSizeStyles[size]}`} />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
