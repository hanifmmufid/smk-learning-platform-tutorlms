import React, { useState, useEffect } from 'react';
import {
  getAllAnnouncements,
  markAsRead,
  getUnreadCount,
  getPriorityColor,
  getPriorityLabel,
  getPriorityIcon,
  getTargetLabel,
  getTargetColor,
  getReadStatusColor,
  getReadStatusLabel,
  formatDate,
  formatDateTime,
} from '../../services/announcementService';
import type { Announcement, UnreadCountData } from '../../services/announcementService';

const StudentAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadCount, setUnreadCount] = useState<UnreadCountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    loadData();
  }, [showUnreadOnly]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [announcementsData, unreadCountData] = await Promise.all([
        getAllAnnouncements({ unreadOnly: showUnreadOnly }),
        getUnreadCount(),
      ]);

      setAnnouncements(announcementsData);
      setUnreadCount(unreadCountData);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      setError(null);
      await markAsRead(id);

      // Update local state
      setAnnouncements((prev) =>
        prev.map((ann) =>
          ann.id === id ? { ...ann, isRead: true, readAt: new Date().toISOString() } : ann
        )
      );

      // Update unread count
      if (unreadCount) {
        setUnreadCount({
          ...unreadCount,
          read: unreadCount.read + 1,
          unread: Math.max(0, unreadCount.unread - 1),
        });
      }
    } catch (err: any) {
      console.error('Error marking as read:', err);
      setError(err.response?.data?.message || 'Failed to mark as read');
    }
  };

  const handleViewAnnouncement = async (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);

    // Mark as read if not already read
    if (!announcement.isRead) {
      await handleMarkAsRead(announcement.id);
    }
  };

  // Filter announcements
  const filteredAnnouncements = announcements.filter((announcement) => {
    if (filterPriority && announcement.priority !== filterPriority) return false;
    return true;
  });

  // Separate pinned and unpinned
  const pinnedAnnouncements = filteredAnnouncements.filter((a) => a.isPinned);
  const unpinnedAnnouncements = filteredAnnouncements.filter((a) => !a.isPinned);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📢 Pengumuman
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Lihat pengumuman dari guru dan sekolah
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Statistics Cards */}
        {unreadCount && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Pengumuman</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{unreadCount.total}</p>
                </div>
                <div className="text-4xl">📬</div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sudah Dibaca</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{unreadCount.read}</p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Belum Dibaca</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{unreadCount.unread}</p>
                </div>
                <div className="text-4xl">📭</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter Prioritas
              </label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Semua Prioritas</option>
                <option value="URGENT">Mendesak</option>
                <option value="HIGH">Penting</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Rendah</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUnreadOnly}
                  onChange={(e) => setShowUnreadOnly(e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Tampilkan hanya yang belum dibaca
                </span>
              </label>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterPriority('');
                  setShowUnreadOnly(false);
                }}
                className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>

        {/* Pinned Announcements */}
        {pinnedAnnouncements.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">📌</span>
              Pengumuman Penting
            </h2>
            <div className="space-y-3">
              {pinnedAnnouncements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onView={handleViewAnnouncement}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Announcements */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Semua Pengumuman ({unpinnedAnnouncements.length})
            </h2>
          </div>

          {unpinnedAnnouncements.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 dark:text-gray-400">
                {showUnreadOnly ? 'Tidak ada pengumuman yang belum dibaca' : 'Belum ada pengumuman'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {unpinnedAnnouncements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onView={handleViewAnnouncement}
                  showBorder={false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedAnnouncement && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 flex-1">
                    {selectedAnnouncement.isPinned && <span className="text-2xl">📌</span>}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedAnnouncement.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-4"
                  >
                    ✕
                  </button>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(
                      selectedAnnouncement.priority
                    )}`}
                  >
                    {getPriorityIcon(selectedAnnouncement.priority)} {getPriorityLabel(selectedAnnouncement.priority)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTargetColor(selectedAnnouncement.targetType)}`}>
                    {getTargetLabel(
                      selectedAnnouncement.targetType,
                      selectedAnnouncement.class?.name,
                      selectedAnnouncement.subject?.name
                    )}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getReadStatusColor(selectedAnnouncement.isRead || false)}`}>
                    {getReadStatusLabel(selectedAnnouncement.isRead || false)}
                  </span>
                </div>

                {/* Content */}
                <div className="prose dark:prose-invert max-w-none mb-6">
                  <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {selectedAnnouncement.content}
                  </p>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Dari: {selectedAnnouncement.creator.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Dibuat: {formatDateTime(selectedAnnouncement.createdAt)}
                  </p>
                  {selectedAnnouncement.readAt && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✅ Anda sudah membaca pengumuman ini pada {formatDateTime(selectedAnnouncement.readAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// Announcement Card Component
// ============================================

interface AnnouncementCardProps {
  announcement: Announcement;
  onView: (announcement: Announcement) => void;
  showBorder?: boolean;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  onView,
  showBorder = true,
}) => {
  return (
    <div
      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
        showBorder ? 'border border-gray-200 dark:border-gray-700 rounded-lg' : ''
      } ${!announcement.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
      onClick={() => onView(announcement)}
    >
      <div className="flex items-start gap-4">
        {/* Unread Indicator */}
        {!announcement.isRead && (
          <div className="mt-1">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2 mb-2">
            {announcement.isPinned && <span className="text-lg">📌</span>}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {announcement.title}
            </h3>
          </div>

          {/* Content Preview */}
          <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {announcement.content}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                announcement.priority
              )}`}
            >
              {getPriorityIcon(announcement.priority)} {getPriorityLabel(announcement.priority)}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTargetColor(announcement.targetType)}`}>
              {getTargetLabel(
                announcement.targetType,
                announcement.class?.name,
                announcement.subject?.name
              )}
            </span>
            {announcement.isRead && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                ✅ Sudah dibaca
              </span>
            )}
          </div>

          {/* Meta */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {announcement.creator.name} • {formatDate(announcement.createdAt)}
          </p>
        </div>

        {/* Arrow */}
        <div className="mt-2">
          <span className="text-gray-400">→</span>
        </div>
      </div>
    </div>
  );
};

export default StudentAnnouncementsPage;
