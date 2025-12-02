import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  getAllMaterials,
  uploadMaterial,
  createLinkMaterial,
  updateMaterial,
  deleteMaterial,
  formatFileSize,
  getMaterialIcon,
  getDownloadUrl,
} from '../../services/materialService';
import type {
  MaterialType,
  UploadMaterialRequest,
  CreateLinkMaterialRequest,
} from '../../services/materialService';
import { getAllSubjects } from '../../services/subjectService';
import type { SubjectType } from '../../services/subjectService';

export default function TeacherMaterialsPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [materials, setMaterials] = useState<MaterialType[]>([]);
  const [subjects, setSubjects] = useState<SubjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter state
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  // Form state
  const [showFileForm, setShowFileForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialType | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    url: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Load materials when subject filter changes
  useEffect(() => {
    loadMaterials();
  }, [selectedSubject]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load teacher's subjects
      const subjectsData = await getAllSubjects();
      // Filter only subjects where user is the teacher
      const mySubjects = subjectsData.filter(
        (subject) => subject.teacherId === user?.id
      );
      setSubjects(mySubjects);

      // Load materials
      await loadMaterials();

      setError('');
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async () => {
    try {
      const materialsData = await getAllMaterials(selectedSubject || undefined);
      // Filter only materials uploaded by current user
      const myMaterials = materialsData.filter(
        (material) => material.uploadedBy === user?.id
      );
      setMaterials(myMaterials);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat materi');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Pilih file terlebih dahulu');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const uploadData: UploadMaterialRequest = {
        title: formData.title,
        description: formData.description || undefined,
        subjectId: formData.subjectId,
        file: selectedFile,
      };

      await uploadMaterial(uploadData);
      setSuccess('Materi berhasil diupload');
      setShowFileForm(false);
      resetForm();
      loadMaterials();
    } catch (err: any) {
      setError(err.message || 'Gagal upload materi');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const linkData: CreateLinkMaterialRequest = {
        title: formData.title,
        description: formData.description || undefined,
        type: 'LINK',
        url: formData.url,
        subjectId: formData.subjectId,
      };

      await createLinkMaterial(linkData);
      setSuccess('Link materi berhasil ditambahkan');
      setShowLinkForm(false);
      resetForm();
      loadMaterials();
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan link');
    }
  };

  const handleEdit = (material: MaterialType) => {
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      description: material.description || '',
      subjectId: material.subjectId,
      url: material.url || '',
    });
    if (material.type === 'LINK') {
      setShowLinkForm(true);
    }
  };

  const handleUpdateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;

    setError('');
    setSuccess('');

    try {
      await updateMaterial(editingMaterial.id, {
        title: formData.title,
        description: formData.description || undefined,
        url: formData.url || undefined,
      });
      setSuccess('Materi berhasil diupdate');
      setEditingMaterial(null);
      setShowLinkForm(false);
      resetForm();
      loadMaterials();
    } catch (err: any) {
      setError(err.message || 'Gagal update materi');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus materi "${title}"?`)) {
      return;
    }

    try {
      await deleteMaterial(id);
      setSuccess('Materi berhasil dihapus');
      loadMaterials();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus materi');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subjectId: '',
      url: '',
    });
    setSelectedFile(null);
    setEditingMaterial(null);
  };

  const handleCancel = () => {
    setShowFileForm(false);
    setShowLinkForm(false);
    resetForm();
    setError('');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDownload = (id: string, fileName: string) => {
    const token = localStorage.getItem('token');
    const url = getDownloadUrl(id);

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = `${url}?token=${token}`;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Materi Pembelajaran</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Filter & Actions */}
        {!showFileForm && !showLinkForm && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-2">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Mata Pelajaran</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} - {subject.class?.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFileForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                📁 Upload File
              </button>
              <button
                onClick={() => setShowLinkForm(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
              >
                🔗 Tambah Link
              </button>
            </div>
          </div>
        )}

        {/* Upload File Form */}
        {showFileForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upload File Materi</h2>
            <form onSubmit={handleUploadFile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} - {subject.class?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Judul Materi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Modul Pemrograman Web Bab 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi singkat tentang materi ini..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.mp4,.avi,.mov,.zip,.rar,.jpg,.jpeg,.png"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format yang didukung: PDF, DOC, PPT, XLS, MP4, ZIP, JPG, PNG (Max 100MB)
                </p>
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    File terpilih: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:bg-gray-400"
                >
                  {uploading ? 'Mengupload...' : 'Upload Materi'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={uploading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add/Edit Link Form */}
        {showLinkForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingMaterial ? 'Edit Link Materi' : 'Tambah Link Materi'}
            </h2>
            <form onSubmit={editingMaterial ? handleUpdateMaterial : handleCreateLink} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  disabled={!!editingMaterial}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} - {subject.class?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Judul Materi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Video Tutorial HTML & CSS"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://youtube.com/... atau https://drive.google.com/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi singkat tentang link ini..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
                >
                  {editingMaterial ? 'Update Link' : 'Tambah Link'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Materials List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Daftar Materi</h2>
          </div>

          {loading ? (
            <div className="px-6 py-8 text-center text-gray-500">Memuat data...</div>
          ) : materials.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              Belum ada materi. Klik tombol "Upload File" atau "Tambah Link" untuk menambah materi.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {materials.map((material) => (
                <div key={material.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getMaterialIcon(material)}</span>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{material.title}</h3>
                          <p className="text-sm text-gray-600">
                            {material.subject?.name} - {material.subject?.class?.name}
                          </p>
                        </div>
                      </div>
                      {material.description && (
                        <p className="text-sm text-gray-600 mt-2">{material.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>
                          {material.type === 'FILE' && material.fileName}
                          {material.type === 'VIDEO' && 'Video'}
                          {material.type === 'LINK' && 'Link Eksternal'}
                        </span>
                        {material.fileSize && <span>{formatFileSize(material.fileSize)}</span>}
                        <span>{new Date(material.createdAt).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {material.type === 'LINK' ? (
                        <>
                          <a
                            href={material.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-900 border border-blue-600 rounded-md hover:bg-blue-50"
                          >
                            Buka Link
                          </a>
                          <button
                            onClick={() => handleEdit(material)}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            Edit
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDownload(material.id, material.fileName || 'file')}
                          className="px-3 py-1 text-sm text-green-600 hover:text-green-900 border border-green-600 rounded-md hover:bg-green-50"
                        >
                          Download
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(material.id, material.title)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-900 border border-red-600 rounded-md hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
