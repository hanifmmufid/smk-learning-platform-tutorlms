import React, { useState, useEffect } from 'react';
import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getPriorityColor,
  getPriorityLabel,
  getPriorityIcon,
  getTargetLabel,
  getTargetColor,
  formatDateTime,
  truncateText,
} from '../../services/announcementService';
import type { Announcement, CreateAnnouncementData, UpdateAnnouncementData } from '../../services/announcementService';
import { getAllSubjects } from '../../services/subjectService';
import type { SubjectType } from '../../services/subjectService';
import { getAllClasses } from '../../services/classService';
import type { ClassType } from '../../services/classService';
import { useAuthStore } from '../../stores/authStore';

const TeacherAnnouncementsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [subjects, setSubjects] = useState<SubjectType[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateAnnouncementData>({
    title: '',
    content: '',
    priority: 'NORMAL',
    targetType: 'ALL',
    isPinned: false,
  });

  // Filter state
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterTarget, setFilterTarget] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [announcementsData, subjectsData, classesData] = await Promise.all([
        getAllAnnouncements(),
        getAllSubjects(),
        getAllClasses(),
      ]);

      setAnnouncements(announcementsData);
      setSubjects(subjectsData);
      setClasses(classesData);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError(null);

      if (editingId) {
        // Update existing announcement
        const updateData: UpdateAnnouncementData = {
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
          targetType: formData.targetType,
          classId: formData.classId || null,
          subjectId: formData.subjectId || null,
          isPinned: formData.isPinned,
        };

        await updateAnnouncement(editingId, updateData);
      } else {
        // Create new announcement
        await createAnnouncement(formData);
      }

      // Reset form and reload
      resetForm();
      loadData();
    } catch (err: any) {
      console.error('Error saving announcement:', err);
      setError(err.response?.data?.message || 'Failed to save announcement');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      targetType: announcement.targetType,
      classId: announcement.classId || undefined,
      subjectId: announcement.subjectId || undefined,
      isPinned: announcement.isPinned,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      await deleteAnnouncement(id);
      setDeleteConfirm(null);
      loadData();
    } catch (err: any) {
      console.error('Error deleting announcement:', err);
      setError(err.response?.data?.message || 'Failed to delete announcement');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'NORMAL',
      targetType: 'ALL',
      isPinned: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Filter announcements
  const filteredAnnouncements = announcements.filter((announcement) => {
    if (filterPriority && announcement.priority !== filterPriority) return false;
    if (filterTarget && announcement.targetType !== filterTarget) return false;
    return true;
  });

  // Get my subjects (for validation)
  const mySubjects = subjects.filter((subject) => subject.teacher?.id === user?.id);

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
            📢 Kelola Pengumuman
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Buat dan kelola pengumuman untuk siswa
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Create/Edit Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              ➕ Buat Pengumuman Baru
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingId ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
                </h2>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Judul Pengumuman *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Masukkan judul pengumuman"
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Isi Pengumuman *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Tulis isi pengumuman..."
                  required
                />
              </div>

              {/* Priority and Target Type Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prioritas
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="LOW">Rendah</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">Penting</option>
                    <option value="URGENT">Mendesak</option>
                  </select>
                </div>

                {/* Target Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target
                  </label>
                  <select
                    value={formData.targetType}
                    onChange={(e) => {
                      const targetType = e.target.value as 'ALL' | 'CLASS' | 'SUBJECT';
                      setFormData({
                        ...formData,
                        targetType,
                        classId: targetType === 'CLASS' ? formData.classId : undefined,
                        subjectId: targetType === 'SUBJECT' ? formData.subjectId : undefined,
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="ALL">Semua Pengguna</option>
                    <option value="CLASS">Kelas Tertentu</option>
                    <option value="SUBJECT">Mata Pelajaran Tertentu</option>
                  </select>
                </div>
              </div>

              {/* Class Selector (conditional) */}
              {formData.targetType === 'CLASS' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pilih Kelas *
                  </label>
                  <select
                    value={formData.classId || ''}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} (Kelas {cls.grade})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Subject Selector (conditional) */}
              {formData.targetType === 'SUBJECT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pilih Mata Pelajaran *
                  </label>
                  <select
                    value={formData.subjectId || ''}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {mySubjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} ({subject.class?.name})
                      </option>
                    ))}
                  </select>
                  {mySubjects.length === 0 && (
                    <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                      Anda belum memiliki mata pelajaran yang diajar
                    </p>
                  )}
                </div>
              )}

              {/* Pin Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="isPinned" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  📌 Pin pengumuman ini (tampilkan di atas)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  {editingId ? 'Update Pengumuman' : 'Buat Pengumuman'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          )}
        </div>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter Target
              </label>
              <select
                value={filterTarget}
                onChange={(e) => setFilterTarget(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Semua Target</option>
                <option value="ALL">Semua Pengguna</option>
                <option value="CLASS">Kelas Tertentu</option>
                <option value="SUBJECT">Mata Pelajaran</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterPriority('');
                  setFilterTarget('');
                }}
                className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>

        {/* Announcements List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Daftar Pengumuman ({filteredAnnouncements.length})
            </h2>
          </div>

          {filteredAnnouncements.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 dark:text-gray-400">Belum ada pengumuman</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title with Pin */}
                      <div className="flex items-center gap-2 mb-2">
                        {announcement.isPinned && <span className="text-xl">📌</span>}
                        <h3
                          className="text-lg font-semibold text-gray-900 dark:text-white truncate cursor-pointer hover:text-primary"
                          onClick={() => setSelectedAnnouncement(announcement)}
                        >
                          {announcement.title}
                        </h3>
                      </div>

                      {/* Content Preview */}
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {truncateText(announcement.content, 150)}
                      </p>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                            announcement.priority
                          )}`}
                        >
                          {getPriorityIcon(announcement.priority)} {getPriorityLabel(announcement.priority)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTargetColor(announcement.targetType)}`}>
                          {getTargetLabel(
                            announcement.targetType,
                            announcement.class?.name,
                            announcement.subject?.name
                          )}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          👁️ {announcement.totalReads || 0} dibaca
                        </span>
                      </div>

                      {/* Meta */}
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Dibuat: {formatDateTime(announcement.createdAt)} • Oleh: {announcement.creator.name}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedAnnouncement(announcement)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Lihat Detail"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(announcement.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
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
                  <div className="flex items-center gap-2">
                    {selectedAnnouncement.isPinned && <span className="text-2xl">📌</span>}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedAnnouncement.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    👁️ {selectedAnnouncement.totalReads || 0} orang sudah membaca
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
                    Dibuat oleh: {selectedAnnouncement.creator.name} ({selectedAnnouncement.creator.email})
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Dibuat: {formatDateTime(selectedAnnouncement.createdAt)}
                  </p>
                  {selectedAnnouncement.updatedAt !== selectedAnnouncement.createdAt && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Terakhir diupdate: {formatDateTime(selectedAnnouncement.updatedAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Konfirmasi Hapus
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Apakah Anda yakin ingin menghapus pengumuman ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Hapus
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAnnouncementsPage;
