import React from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  filterLabel?: string;
  placeholder?: string;
  showClearButton?: boolean;
  onClear?: () => void;
  className?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  filterValue,
  onFilterChange,
  filterOptions = [],
  filterLabel = 'Filter',
  placeholder = 'Cari...',
  showClearButton = true,
  onClear,
  className = '',
}) => {
  const hasActiveFilter = searchQuery || filterValue;

  const handleClear = () => {
    onSearchChange('');
    if (onFilterChange) {
      onFilterChange('');
    }
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Filter Dropdown */}
        {filterOptions.length > 0 && onFilterChange && (
          <div className="relative sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={filterValue || ''}
              onChange={(e) => onFilterChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer transition-all"
            >
              <option value="">{filterLabel}</option>
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Clear Button */}
        {showClearButton && hasActiveFilter && (
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Hapus Filter</span>
          </button>
        )}
      </div>

      {/* Active Filter Indicators */}
      {hasActiveFilter && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-600">Filter aktif:</span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
              <MagnifyingGlassIcon className="w-3 h-3" />
              "{searchQuery}"
            </span>
          )}
          {filterValue && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
              <FunnelIcon className="w-3 h-3" />
              {filterOptions.find(opt => opt.value === filterValue)?.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
