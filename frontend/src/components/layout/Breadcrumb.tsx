import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ElementType;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  separator?: React.ReactNode;
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  showHome = true,
  separator,
  className = '',
}) => {
  const defaultSeparator = <ChevronRightIcon className="w-4 h-4 text-gray-400" />;
  const separatorElement = separator || defaultSeparator;

  // Add home item if showHome is true
  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: 'Home', href: '/', icon: HomeIcon }, ...items]
    : items;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center space-x-2 text-sm ${className}`}
    >
      <ol className="flex items-center space-x-2">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const Icon = item.icon;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 flex-shrink-0">{separatorElement}</span>
              )}

              {isLast ? (
                <span className="flex items-center gap-1.5 text-gray-900 font-medium">
                  {Icon && <Icon className="w-4 h-4" />}
                  <span className="truncate max-w-xs">{item.label}</span>
                </span>
              ) : item.href ? (
                <Link
                  to={item.href}
                  className="flex items-center gap-1.5 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span className="truncate max-w-xs">{item.label}</span>
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 text-gray-600">
                  {Icon && <Icon className="w-4 h-4" />}
                  <span className="truncate max-w-xs">{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
