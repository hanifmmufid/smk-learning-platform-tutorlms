import { useState, useEffect } from 'react';
import type { Assignment } from '../../services/assignmentService';
import {
  getAllAssignments,
  formatDueDate,
  isOverdue,
} from '../../services/assignmentService';
import type { Submission } from '../../services/submissionService';
import {
  getAllSubmissions,
  submitAssignment,
  getStatusColor as getSubmissionStatusColor,
  getStatusLabel as getSubmissionStatusLabel,
  formatSubmissionDate,
  getDownloadUrl,
} from '../../services/submissionService';
import { useAuthStore } from '../../stores/authStore';

interface AssignmentWithSubmission extends Assignment {
  mySubmission?: Submission;
}

export default function StudentAssignmentsPage() {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Submit form state
  const [submitContent, setSubmitContent] = useState('');
  const [submitFile, setSubmitFile] = useState<File | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      
      // Get all published assignments from enrolled subjects
      const assignmentsRes = await getAllAssignments({ status: 'PUBLISHED' });
      
      // Get my submissions
      const submissionsRes = await getAllSubmissions({ studentId: user?.id });
      
      if (assignmentsRes.success && submissionsRes.success) {
        const assignmentsData: Assignment[] = assignmentsRes.data;
        const submissionsData: Submission[] = submissionsRes.data;
        
        // Merge assignments with submissions
        const merged: AssignmentWithSubmission[] = assignmentsData.map((assignment) => {
          const mySubmission = submissionsData.find(
            (sub) => sub.assignmentId === assignment.id
          );
          return { ...assignment, mySubmission };
        });
        
        setAssignments(merged);
      }
    } catch (error: any) {
      console.error('Error loading assignments:', error);
      alert(error.response?.data?.error || 'Gagal memuat tugas');
    } finally {
      setLoading(false);
    }
  };

  const openSubmitModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmitModal(true);
    setSubmitContent('');
    setSubmitFile(null);
  };

  const closeSubmitModal = () => {
    setShowSubmitModal(false);
    setSelectedAssignment(null);
    setSubmitContent('');
    setSubmitFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    try {
      setSubmitting(true);
      
      const res = await submitAssignment(selectedAssignment.id, {
        content: submitContent,
        file: submitFile || undefined,
      });
      
      if (res.success) {
        alert(res.message || 'Tugas berhasil dikumpulkan!');
        closeSubmitModal();
        loadAssignments(); // Reload to update submission status
      }
    } catch (error: any) {
      console.error('Error submitting assignment:', error);
      alert(error.response?.data?.error || 'Gagal mengumpulkan tugas');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSubmitFile(e.target.files[0]);
    }
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tugas Saya</h1>
        <p className="text-gray-600 mt-1">
          Lihat dan kerjakan tugas dari guru
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Total Tugas</p>
          <p className="text-2xl font-bold text-blue-900">{assignments.length}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <p className="text-sm text-yellow-600 font-medium">Belum Dikerjakan</p>
          <p className="text-2xl font-bold text-yellow-900">
            {assignments.filter((a) => !a.mySubmission).length}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-600 font-medium">Sudah Dinilai</p>
          <p className="text-2xl font-bold text-green-900">
            {assignments.filter((a) => a.mySubmission?.status === 'GRADED').length}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-sm text-red-600 font-medium">Terlambat</p>
          <p className="text-2xl font-bold text-red-900">
            {
              assignments.filter(
                (a) => !a.mySubmission && isOverdue(a.dueDate)
              ).length
            }
          </p>
        </div>
      </div>
      {/* Assignments List */}
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Belum ada tugas yang tersedia</p>
          </div>
        ) : (
          assignments.map((assignment) => {
            const overdue = isOverdue(assignment.dueDate);
            const hasSubmission = !!assignment.mySubmission;
            const isGraded = assignment.mySubmission?.status === 'GRADED';
            
            return (
              <div
                key={assignment.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition p-6"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {assignment.title}
                      </h3>
                      {hasSubmission && (
                        <span
                          className={'text-white text-xs px-3 py-1 rounded-full ' + getSubmissionStatusColor(assignment.mySubmission!.status)}
                        >
                          {getSubmissionStatusLabel(assignment.mySubmission!.status)}
                        </span>
                      )}
                      {overdue && !hasSubmission && (
                        <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full">
                          Overdue
                        </span>
                      )}
                    </div>

                    {assignment.description && (
                      <p className="text-gray-600 mb-3">{assignment.description}</p>
                    )}

                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Instruksi:</p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {assignment.instructions}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Mata Pelajaran:</span>
                        <p className="font-medium text-gray-900">
                          {assignment.subject?.name}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Deadline:</span>
                        <p className={'font-medium ' + (overdue ? 'text-red-600' : 'text-gray-900')}>
                          {formatDueDate(assignment.dueDate)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Nilai Maksimal:</span>
                        <p className="font-medium text-gray-900">{assignment.maxScore}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Guru:</span>
                        <p className="font-medium text-gray-900">
                          {assignment.teacher?.name}
                        </p>
                      </div>
                    </div>

                    {/* Submission Info */}
                    {hasSubmission && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-900 mb-2">
                          Status Pengumpulan:
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-blue-600">Dikumpulkan:</span>
                            <p className="font-medium text-blue-900">
                              {formatSubmissionDate(assignment.mySubmission?.submittedAt)}
                            </p>
                          </div>
                          {isGraded && (
                            <>
                              <div>
                                <span className="text-blue-600">Nilai:</span>
                                <p className="font-bold text-green-600 text-lg">
                                  {assignment.mySubmission?.score} / {assignment.maxScore}
                                </p>
                              </div>
                              {assignment.mySubmission?.feedback && (
                                <div className="col-span-2">
                                  <span className="text-blue-600">Feedback:</span>
                                  <p className="font-medium text-blue-900 mt-1">
                                    {assignment.mySubmission.feedback}
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        {assignment.mySubmission?.attachmentUrl && (
                          <a
                            href={getDownloadUrl(assignment.mySubmission.attachmentUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            Lihat File Submission
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div>
                    {!hasSubmission && (
                      <button
                        onClick={() => openSubmitModal(assignment)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium whitespace-nowrap"
                      >
                        Kumpulkan Tugas
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Submit Modal */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Kumpulkan Tugas
              </h2>
              <p className="text-gray-600 mb-6">{selectedAssignment.title}</p>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Instructions Reminder */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Instruksi Tugas:
                    </p>
                    <p className="text-sm text-blue-700 whitespace-pre-wrap">
                      {selectedAssignment.instructions}
                    </p>
                  </div>

                  {/* Deadline Warning */}
                  <div
                    className={
                      'rounded-lg p-3 border ' +
                      (isOverdue(selectedAssignment.dueDate)
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200')
                    }
                  >
                    <p className="text-sm font-medium">
                      <span
                        className={
                          isOverdue(selectedAssignment.dueDate)
                            ? 'text-red-900'
                            : 'text-yellow-900'
                        }
                      >
                        Deadline:{' '}
                      </span>
                      <span
                        className={
                          isOverdue(selectedAssignment.dueDate)
                            ? 'text-red-700'
                            : 'text-yellow-700'
                        }
                      >
                        {formatDueDate(selectedAssignment.dueDate)}
                      </span>
                    </p>
                    {isOverdue(selectedAssignment.dueDate) && (
                      <p className="text-xs text-red-600 mt-1">
                        {selectedAssignment.allowLateSubmission
                          ? 'Tugas sudah melewati deadline (pengumpulan terlambat diperbolehkan)'
                          : 'Tugas sudah melewati deadline!'}
                      </p>
                    )}
                  </div>

                  {/* Text Answer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jawaban (Opsional)
                    </label>
                    <textarea
                      value={submitContent}
                      onChange={(e) => setSubmitContent(e.target.value)}
                      rows={6}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tulis jawaban atau catatan di sini..."
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload File (Opsional)
                    </label>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.zip,.rar"
                    />
                    {submitFile && (
                      <p className="text-sm text-gray-600 mt-2">
                        File dipilih: {submitFile.name} (
                        {(submitFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Format yang didukung: PDF, DOC, PPT, XLS, TXT, Gambar, ZIP (Max 100MB)
                    </p>
                  </div>

                  {/* Note */}
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Catatan:</span> Anda bisa mengisi
                      jawaban teks, upload file, atau keduanya. Minimal salah satu harus
                      diisi.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={submitting || (!submitContent && !submitFile)}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Mengumpulkan...' : 'Kumpulkan Tugas'}
                  </button>
                  <button
                    type="button"
                    onClick={closeSubmitModal}
                    disabled={submitting}
                    className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-medium disabled:bg-gray-200"
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
