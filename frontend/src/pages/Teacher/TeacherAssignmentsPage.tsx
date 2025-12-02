import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  Assignment,
  CreateAssignmentData,
} from '../../services/assignmentService';
import {
  getAllAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  formatDueDate,
  isOverdue,
  getStatusColor,
  getStatusLabel,
} from '../../services/assignmentService';
import { getAllSubjects, type SubjectType } from '../../services/subjectService';

export default function TeacherAssignmentsPage() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<SubjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState<CreateAssignmentData>({
    title: '',
    description: '',
    instructions: '',
    subjectId: '',
    dueDate: '',
    maxScore: 100,
    allowLateSubmission: false,
    status: 'DRAFT',
  });

  useEffect(() => {
    loadData();
  }, [filterSubject]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, subjectsData] = await Promise.all([
        getAllAssignments(filterSubject ? { subjectId: filterSubject } : {}),
        getAllSubjects(),
      ]);

      if (assignmentsRes.success) {
        setAssignments(assignmentsRes.data);
      }

      setSubjects(subjectsData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      alert(error.response?.data?.error || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createAssignment(formData);
      if (res.success) {
        alert('Tugas berhasil dibuat!');
        setShowCreateModal(false);
        resetForm();
        loadData();
      }
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      alert(error.response?.data?.error || 'Gagal membuat tugas');
    }
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;

    try {
      const res = await updateAssignment(editingAssignment.id, formData);
      if (res.success) {
        alert('Tugas berhasil diperbarui!');
        setEditingAssignment(null);
        resetForm();
        loadData();
      }
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      alert(error.response?.data?.error || 'Gagal memperbarui tugas');
    }
  };

  const handleDeleteAssignment = async (id: string, title: string) => {
    if (!confirm(`Yakin ingin menghapus tugas "${title}"?`)) return;

    try {
      const res = await deleteAssignment(id);
      if (res.success) {
        alert('Tugas berhasil dihapus!');
        loadData();
      }
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      alert(error.response?.data?.error || 'Gagal menghapus tugas');
    }
  };

  const openEditModal = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description || '',
      instructions: assignment.instructions,
      subjectId: assignment.subjectId,
      dueDate: new Date(assignment.dueDate).toISOString().slice(0, 16),
      maxScore: assignment.maxScore,
      allowLateSubmission: assignment.allowLateSubmission,
      status: assignment.status,
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      instructions: '',
      subjectId: '',
      dueDate: '',
      maxScore: 100,
      allowLateSubmission: false,
      status: 'DRAFT',
    });
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingAssignment(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kelola Tugas</h1>
          <p className="text-gray-600 mt-1">Buat dan kelola tugas untuk siswa</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Buat Tugas Baru
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium text-gray-700">Filter Mata Pelajaran:</label>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Semua Mata Pelajaran</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name} - {subject.class?.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Belum ada tugas. Buat tugas pertama Anda!</p>
          </div>
        ) : (
          assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition p-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {assignment.title}
                    </h3>
                    <span
                      className={`${getStatusColor(
                        assignment.status
                      )} text-white text-xs px-3 py-1 rounded-full`}
                    >
                      {getStatusLabel(assignment.status)}
                    </span>
                    {isOverdue(assignment.dueDate) && assignment.status === 'PUBLISHED' && (
                      <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full">
                        Overdue
                      </span>
                    )}
                  </div>

                  {assignment.description && (
                    <p className="text-gray-600 mb-3">{assignment.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Mata Pelajaran:</span>
                      <p className="font-medium text-gray-900">
                        {assignment.subject?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {assignment.subject?.class.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Deadline:</span>
                      <p className="font-medium text-gray-900">
                        {formatDueDate(assignment.dueDate)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Nilai Maksimal:</span>
                      <p className="font-medium text-gray-900">{assignment.maxScore}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Submissions:</span>
                      <p className="font-medium text-gray-900">
                        {assignment._count?.submissions || 0} siswa
                      </p>
                    </div>
                  </div>

                  {assignment.allowLateSubmission && (
                    <p className="text-xs text-orange-600 mt-2">
                      ⚠️ Pengumpulan terlambat diperbolehkan
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() =>
                      navigate(`/teacher/assignments/${assignment.id}/grading`)
                    }
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                  >
                    Lihat Submissions
                  </button>
                  <button
                    onClick={() => openEditModal(assignment)}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAssignment(assignment.id, assignment.title)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingAssignment) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingAssignment ? 'Edit Tugas' : 'Buat Tugas Baru'}
              </h2>

              <form onSubmit={editingAssignment ? handleUpdateAssignment : handleCreateAssignment}>
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Judul Tugas *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Contoh: Tugas HTML & CSS Dasar"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mata Pelajaran *
                    </label>
                    <select
                      required
                      value={formData.subjectId}
                      onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Pilih Mata Pelajaran</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} - {subject.class?.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deskripsi Singkat
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Contoh: Membuat halaman web sederhana"
                    />
                  </div>

                  {/* Instructions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instruksi Lengkap *
                    </label>
                    <textarea
                      required
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      rows={6}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tulis instruksi lengkap untuk siswa..."
                    />
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Max Score */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nilai Maksimal *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="1000"
                        value={formData.maxScore}
                        onChange={(e) =>
                          setFormData({ ...formData, maxScore: parseInt(e.target.value) })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status *
                      </label>
                      <select
                        required
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.value as 'DRAFT' | 'PUBLISHED' | 'CLOSED',
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Dipublikasikan</option>
                        <option value="CLOSED">Ditutup</option>
                      </select>
                    </div>
                  </div>

                  {/* Allow Late Submission */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allowLate"
                      checked={formData.allowLateSubmission}
                      onChange={(e) =>
                        setFormData({ ...formData, allowLateSubmission: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="allowLate" className="ml-2 text-sm text-gray-700">
                      Izinkan pengumpulan terlambat
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    {editingAssignment ? 'Perbarui Tugas' : 'Buat Tugas'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-medium"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
