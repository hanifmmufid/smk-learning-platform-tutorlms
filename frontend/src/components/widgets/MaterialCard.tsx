import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import {
  DocumentTextIcon,
  LinkIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  UserIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';

export interface MaterialCardProps {
  id: string;
  title: string;
  description?: string | null;
  type: 'FILE' | 'LINK' | 'VIDEO';
  fileName?: string | null;
  fileSize?: number | null;
  url?: string | null;
  subjectName: string;
  uploaderName: string;
  createdAt: string;
  onDownload?: (id: string, fileName: string) => void;
  onOpenLink?: (url: string) => void;
  viewMode?: 'grid' | 'list';
  className?: string;
}

const MaterialCard: React.FC<MaterialCardProps> = ({
  id,
  title,
  description,
  type,
  fileName,
  fileSize,
  url,
  subjectName,
  uploaderName,
  createdAt,
  onDownload,
  onOpenLink,
  viewMode = 'grid',
  className = '',
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = () => {
    if (type === 'LINK') {
      return <LinkIcon className="w-12 h-12 text-primary-500" />;
    }

    if (type === 'VIDEO') {
      return <span className="text-5xl">🎥</span>;
    }

    // File type based on extension
    const ext = fileName?.split('.').pop()?.toLowerCase();
    const iconClass = 'w-12 h-12';

    switch (ext) {
      case 'pdf':
        return <span className="text-5xl">📄</span>;
      case 'doc':
      case 'docx':
        return <span className="text-5xl">📝</span>;
      case 'ppt':
      case 'pptx':
        return <span className="text-5xl">📊</span>;
      case 'xls':
      case 'xlsx':
        return <span className="text-5xl">📈</span>;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <span className="text-5xl">🖼️</span>;
      case 'zip':
      case 'rar':
        return <span className="text-5xl">📦</span>;
      default:
        return <DocumentIcon className={iconClass + ' text-gray-400'} />;
    }
  };

  const handleAction = () => {
    if ((type === 'LINK' || type === 'VIDEO') && url) {
      if (onOpenLink) {
        onOpenLink(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } else if (type === 'FILE' && onDownload) {
      onDownload(id, fileName || 'file');
    }
  };

  // Grid view (card style)
  if (viewMode === 'grid') {
    return (
      <Card hoverable className={`h-full ${className}`}>
        {/* Icon Header */}
        <div className="flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 rounded-t-xl h-32">
          {getFileIcon()}
        </div>

        <div className="p-5 space-y-3">
          {/* Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm">
              {subjectName}
            </Badge>
            <Badge variant={type === 'LINK' ? 'info' : 'success'} size="sm">
              {type === 'LINK' ? 'Link' : 'File'}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 min-h-[3.5rem]">
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
              {description}
            </p>
          )}

          {/* Metadata */}
          <div className="space-y-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              <span className="truncate">{uploaderName}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span>{new Date(createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}</span>
            </div>
            {type === 'FILE' && fileSize && (
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-4 h-4" />
                <span>{formatFileSize(fileSize)}</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button
            variant={type === 'FILE' ? 'success' : 'primary'}
            fullWidth
            onClick={handleAction}
            leftIcon={type === 'FILE' ? <ArrowDownTrayIcon className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
          >
            {type === 'FILE' ? 'Download' : type === 'VIDEO' ? 'Tonton Video' : 'Buka Link'}
          </Button>
        </div>
      </Card>
    );
  }

  // List view (row style)
  return (
    <Card className={`p-4 ${className}`} hoverable>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg flex items-center justify-center">
          {getFileIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {title}
              </h3>
              {description && (
                <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                  {description}
                </p>
              )}
            </div>

            {/* Action Button */}
            <Button
              variant={type === 'FILE' ? 'success' : 'primary'}
              size="sm"
              onClick={handleAction}
              leftIcon={type === 'FILE' ? <ArrowDownTrayIcon className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
            >
              {type === 'FILE' ? 'Download' : type === 'VIDEO' ? 'Tonton' : 'Buka'}
            </Button>
          </div>

          {/* Badges & Metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <Badge variant="primary" size="sm">
              {subjectName}
            </Badge>
            <Badge variant={type === 'FILE' ? 'success' : 'info'} size="sm">
              {type === 'FILE' ? 'File' : type === 'VIDEO' ? 'Video' : 'Link'}
            </Badge>
            <span className="flex items-center gap-1">
              <UserIcon className="w-3 h-3" />
              {uploaderName}
            </span>
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              {new Date(createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            </span>
            {type === 'FILE' && fileSize && (
              <span className="flex items-center gap-1">
                <DocumentTextIcon className="w-3 h-3" />
                {formatFileSize(fileSize)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MaterialCard;
