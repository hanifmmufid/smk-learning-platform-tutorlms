import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import {
  getAllMaterials,
  uploadMaterial,
  createLinkMaterial,
  updateMaterial,
  deleteMaterial,
  getDownloadUrl,
} from '../../services/materialService';
import type {
  MaterialType,
  UploadMaterialRequest,
  CreateLinkMaterialRequest,
} from '../../services/materialService';
import { getAllSubjects } from '../../services/subjectService';
import type { SubjectType } from '../../services/subjectService';
import Sidebar, {
  HomeIcon,
  BookOpenIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ChartBarIcon,
} from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import Breadcrumb from '../../components/layout/Breadcrumb';
import MaterialCard from '../../components/widgets/MaterialCard';
import FilterBar from '../../components/ui/FilterBar';
import ViewToggle from '../../components/ui/ViewToggle';
import type { ViewMode } from '../../components/ui/ViewToggle';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import {
  DocumentIcon,
  LinkIcon as LinkIconOutline,
  CloudArrowUpIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export default function TeacherMaterialsPage() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const [materials, setMaterials] = useState<MaterialType[]>([]);
  const [subjects, setSubjects] = useState<SubjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter & View state
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Form state
  const [showFileModal, setShowFileModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
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
    if (!loading) {
      loadMaterials();
    }
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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
      setShowFileModal(false);
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
      setShowLinkModal(false);
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
    if (material.type === 'LINK' || material.type === 'VIDEO') {
      setShowLinkModal(true);
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
      setShowLinkModal(false);
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
    setShowFileModal(false);
    setShowLinkModal(false);
    resetForm();
    setError('');
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

  // Filter materials by search query
  const filteredMaterials = materials.filter((material) =>
    material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.subject?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Prepare subject filter options
  const subjectOptions = subjects.map(subject => ({
    value: subject.id,
    label: `${subject.name} - ${subject.class?.name}`,
  }));

  const navItems = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Materi', href: '/teacher/materials', icon: BookOpenIcon },
    { name: 'Tugas', href: '/teacher/assignments', icon: DocumentTextIcon },
    { name: 'Quiz', href: '/teacher/quizzes', icon: AcademicCapIcon },
    { name: 'Nilai', href: '/teacher/grades', icon: ChartBarIcon },
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        user={{
          name: user?.name || 'Teacher',
          role: 'TEACHER',
          email: user?.email,
        }}
        navItems={navItems}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
        darkMode={theme === 'dark'}
        onToggleDarkMode={toggleTheme}
      />

      {/* Main Content */}
      <div className="lg:pl-80">
        {/* Header */}
        <Header
          user={{
            name: user?.name || 'Teacher',
            role: 'TEACHER',
          }}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Page Content */}
        <main className="p-6 lg:p-8">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: 'Materi Pembelajaran', icon: BookOpenIcon },
            ]}
            className="mb-6"
          />

          {/* Page Header */}
          <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Materi Pembelajaran
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Kelola semua materi pembelajaran untuk mata pelajaran Anda
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={() => setShowFileModal(true)}
                leftIcon={<CloudArrowUpIcon className="w-5 h-5" />}
              >
                Upload File
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowLinkModal(true)}
                leftIcon={<LinkIconOutline className="w-5 h-5" />}
              >
                Tambah Link
              </Button>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-700 text-success-800 dark:text-success-300 px-4 py-3 rounded-lg flex items-center justify-between">
              <span>{success}</span>
              <button
                onClick={() => setSuccess('')}
                className="text-success-600 dark:text-success-400 hover:text-success-800 dark:hover:text-success-200"
              >
                ✕
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700 text-danger-800 dark:text-danger-300 px-4 py-3 rounded-lg flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError('')}
                className="text-danger-600 dark:text-danger-400 hover:text-danger-800 dark:hover:text-danger-200"
              >
                ✕
              </button>
            </div>
          )}

          {/* Filter Bar & View Toggle */}
          <div className="mb-6 flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterValue={selectedSubject}
                onFilterChange={setSelectedSubject}
                filterOptions={subjectOptions}
                filterLabel="Semua Mata Pelajaran"
                placeholder="Cari materi..."
              />
            </div>
            <ViewToggle
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>

          {/* Materials Grid/List */}
          {loading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} showImage={viewMode === 'grid'} lines={3} />
              ))}
            </div>
          ) : filteredMaterials.length === 0 ? (
            <EmptyState
              icon={<DocumentIcon className="w-16 h-16 text-gray-300" />}
              title={searchQuery || selectedSubject ? 'Tidak ada materi yang sesuai' : 'Belum ada materi'}
              description={
                searchQuery || selectedSubject
                  ? 'Coba ubah filter atau kata kunci pencarian Anda'
                  : 'Klik tombol "Upload File" atau "Tambah Link" untuk menambah materi pembelajaran'
              }
              action={
                searchQuery || selectedSubject
                  ? {
                      label: 'Hapus Filter',
                      onClick: () => {
                        setSearchQuery('');
                        setSelectedSubject('');
                      },
                    }
                  : {
                      label: 'Upload Materi',
                      onClick: () => setShowFileModal(true),
                    }
              }
            />
          ) : (
            <>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {filteredMaterials.map((material) => (
                  <div key={material.id} className="relative group">
                    <MaterialCard
                      id={material.id}
                      title={material.title}
                      description={material.description}
                      type={material.type}
                      fileName={material.fileName}
                      fileSize={material.fileSize}
                      url={material.url}
                      subjectName={material.subject?.name || 'Lainnya'}
                      uploaderName={material.uploader?.name || 'Unknown'}
                      createdAt={material.createdAt}
                      onDownload={handleDownload}
                      viewMode={viewMode}
                    />
                    {/* Action Buttons Overlay */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      {(material.type === 'LINK' || material.type === 'VIDEO') && (
                        <button
                          onClick={() => handleEdit(material)}
                          className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 border border-gray-200 dark:border-gray-700"
                          title="Edit"
                        >
                          <PencilSquareIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(material.id, material.title)}
                        className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 border border-gray-200 dark:border-gray-700"
                        title="Hapus"
                      >
                        <TrashIcon className="w-4 h-4 text-danger-600 dark:text-danger-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>
                    Menampilkan <strong>{filteredMaterials.length}</strong> materi
                    {selectedSubject && ' untuk mata pelajaran ini'}
                  </span>
                  {searchQuery && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Hasil pencarian: "{searchQuery}"
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Upload File Modal */}
      <Modal
        isOpen={showFileModal}
        onClose={handleCancel}
        title="Upload File Materi"
        size="lg"
      >
        <form onSubmit={handleUploadFile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mata Pelajaran <span className="text-danger-500 dark:text-danger-400">**</span>
            </label>
            <select
              required
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Judul Materi <span className="text-danger-500 dark:text-danger-400">**</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Modul Pemrograman Web Bab 1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi singkat tentang materi ini..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              File <span className="text-danger-500 dark:text-danger-400">**</span>
            </label>
            <input
              type="file"
              required
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.mp4,.avi,.mov,.zip,.rar,.jpg,.jpeg,.png"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Format yang didukung: PDF, DOC, PPT, XLS, MP4, ZIP, JPG, PNG (Max 100MB)
            </p>
            {selectedFile && (
              <div className="mt-2 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-sm text-primary-900 font-medium">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-primary-600 mt-1">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={uploading}
              fullWidth
              leftIcon={<CloudArrowUpIcon className="w-5 h-5" />}
            >
              {uploading ? 'Mengupload...' : 'Upload Materi'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={uploading}
            >
              Batal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Link Modal */}
      <Modal
        isOpen={showLinkModal}
        onClose={handleCancel}
        title={editingMaterial ? 'Edit Link Materi' : 'Tambah Link Materi'}
        size="lg"
      >
        <form onSubmit={editingMaterial ? handleUpdateMaterial : handleCreateLink} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mata Pelajaran <span className="text-danger-500 dark:text-danger-400">**</span>
            </label>
            <select
              required
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              disabled={!!editingMaterial}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Judul Materi <span className="text-danger-500 dark:text-danger-400">**</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Video Tutorial HTML & CSS"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL <span className="text-danger-500 dark:text-danger-400">**</span>
            </label>
            <input
              type="url"
              required
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://youtube.com/... atau https://drive.google.com/..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi singkat tentang link ini..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              leftIcon={<LinkIconOutline className="w-5 h-5" />}
            >
              {editingMaterial ? 'Update Link' : 'Tambah Link'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
            >
              Batal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
