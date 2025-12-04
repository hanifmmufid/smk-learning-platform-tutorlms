import React from 'react';
import { UserCircleIcon } from '@heroicons/react/24/solid';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type AvatarRole = 'default' | 'admin' | 'teacher' | 'student';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  role?: AvatarRole;
  status?: 'online' | 'offline' | 'busy' | 'away';
  showStatus?: boolean;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = 'Avatar',
      name,
      size = 'md',
      role = 'default',
      status,
      showStatus = false,
      className = '',
      ...props
    },
    ref
  ) => {
    // Size styles
    const sizeStyles: Record<AvatarSize, { container: string; text: string; icon: string; status: string }> = {
      xs: { container: 'w-6 h-6', text: 'text-xs', icon: 'w-6 h-6', status: 'w-1.5 h-1.5' },
      sm: { container: 'w-8 h-8', text: 'text-sm', icon: 'w-8 h-8', status: 'w-2 h-2' },
      md: { container: 'w-10 h-10', text: 'text-base', icon: 'w-10 h-10', status: 'w-2.5 h-2.5' },
      lg: { container: 'w-12 h-12', text: 'text-lg', icon: 'w-12 h-12', status: 'w-3 h-3' },
      xl: { container: 'w-16 h-16', text: 'text-xl', icon: 'w-16 h-16', status: 'w-3.5 h-3.5' },
      '2xl': { container: 'w-24 h-24', text: 'text-3xl', icon: 'w-24 h-24', status: 'w-4 h-4' },
    };

    // Role color styles (for initials background)
    const roleColorStyles: Record<AvatarRole, string> = {
      default: 'bg-gray-300 text-gray-700',
      admin: 'bg-gradient-to-br from-admin-gradient-from to-admin-gradient-to text-white',
      teacher: 'bg-gradient-to-br from-teacher-gradient-from to-teacher-gradient-to text-white',
      student: 'bg-gradient-to-br from-student-gradient-from to-student-gradient-to text-white',
    };

    // Status color styles
    const statusColorStyles: Record<NonNullable<AvatarProps['status']>, string> = {
      online: 'bg-success-500',
      offline: 'bg-gray-400',
      busy: 'bg-danger-500',
      away: 'bg-warning-500',
    };

    // Get initials from name
    const getInitials = (name: string): string => {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    };

    const containerClasses = `relative inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 ${sizeStyles[size].container} ${className}`;

    return (
      <div ref={ref} className={containerClasses} {...props}>
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : name ? (
          <div className={`w-full h-full flex items-center justify-center font-semibold ${roleColorStyles[role]} ${sizeStyles[size].text}`}>
            {getInitials(name)}
          </div>
        ) : (
          <UserCircleIcon className={`text-gray-400 ${sizeStyles[size].icon}`} />
        )}

        {/* Status indicator */}
        {showStatus && status && (
          <span
            className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white ${statusColorStyles[status]} ${sizeStyles[size].status}`}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// Avatar Group component
export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  max?: number;
  size?: AvatarSize;
}

export const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ children, max = 5, size = 'md', className = '', ...props }, ref) => {
    const childrenArray = React.Children.toArray(children);
    const displayedChildren = max ? childrenArray.slice(0, max) : childrenArray;
    const remainingCount = childrenArray.length - displayedChildren.length;

    // Size styles for overlap
    const overlapStyles: Record<AvatarSize, string> = {
      xs: '-space-x-1',
      sm: '-space-x-1.5',
      md: '-space-x-2',
      lg: '-space-x-2.5',
      xl: '-space-x-3',
      '2xl': '-space-x-4',
    };

    return (
      <div ref={ref} className={`flex items-center ${overlapStyles[size]} ${className}`} {...props}>
        {displayedChildren.map((child, index) => (
          <div key={index} className="ring-2 ring-white rounded-full">
            {child}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className={`flex items-center justify-center bg-gray-200 text-gray-600 font-semibold rounded-full ring-2 ring-white ${sizeStyles[size].container} ${sizeStyles[size].text}`}>
            +{remainingCount}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

const sizeStyles: Record<AvatarSize, { container: string; text: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-xs' },
  sm: { container: 'w-8 h-8', text: 'text-sm' },
  md: { container: 'w-10 h-10', text: 'text-base' },
  lg: { container: 'w-12 h-12', text: 'text-lg' },
  xl: { container: 'w-16 h-16', text: 'text-xl' },
  '2xl': { container: 'w-24 h-24', text: 'text-3xl' },
};

export default Avatar;
