import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = 'text',
      width,
      height,
      animation = 'wave',
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = 'bg-gray-200';

    // Variant styles
    const variantStyles: Record<NonNullable<SkeletonProps['variant']>, string> = {
      text: 'rounded h-4',
      circular: 'rounded-full',
      rectangular: 'rounded-none',
      rounded: 'rounded-lg',
    };

    // Animation styles
    const animationStyles: Record<NonNullable<SkeletonProps['animation']>, string> = {
      pulse: 'animate-pulse',
      wave: 'animate-skeleton bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
      none: '',
    };

    // Combine styles
    const skeletonClasses = `${baseStyles} ${variantStyles[variant]} ${animationStyles[animation]} ${className}`;

    // Custom styles
    const customStyle: React.CSSProperties = {
      width: width || (variant === 'text' ? '100%' : undefined),
      height: height || (variant === 'circular' ? width : undefined),
      ...style,
    };

    return (
      <div
        ref={ref}
        className={skeletonClasses}
        style={customStyle}
        aria-live="polite"
        aria-busy="true"
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Skeleton Card component (commonly used pattern)
export interface SkeletonCardProps {
  showImage?: boolean;
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ showImage = true, lines = 3 }) => {
  return (
    <div className="bg-white rounded-xl shadow-elevated p-6 space-y-4">
      {showImage && <Skeleton variant="rectangular" height={200} className="w-full" />}
      <div className="space-y-3">
        <Skeleton variant="text" width="60%" height={20} />
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            variant="text"
            width={index === lines - 1 ? '80%' : '100%'}
            height={16}
          />
        ))}
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="text" width={120} height={16} />
      </div>
    </div>
  );
};

SkeletonCard.displayName = 'SkeletonCard';

// Skeleton List component
export interface SkeletonListProps {
  items?: number;
  showAvatar?: boolean;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ items = 5, showAvatar = true }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm">
          {showAvatar && <Skeleton variant="circular" width={40} height={40} />}
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" height={16} />
            <Skeleton variant="text" width="70%" height={14} />
          </div>
        </div>
      ))}
    </div>
  );
};

SkeletonList.displayName = 'SkeletonList';

// Skeleton Table component
export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="bg-white rounded-lg shadow-elevated overflow-hidden">
      {/* Header */}
      <div className="grid gap-4 p-4 border-b border-gray-200" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} variant="text" height={20} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-4 p-4 border-b border-gray-100"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" height={16} />
          ))}
        </div>
      ))}
    </div>
  );
};

SkeletonTable.displayName = 'SkeletonTable';

export default Skeleton;
