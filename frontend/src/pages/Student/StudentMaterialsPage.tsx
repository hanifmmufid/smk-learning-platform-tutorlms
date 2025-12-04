import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import {
  getAllMaterials,
  getDownloadUrl,
} from '../../services/materialService';
import type { MaterialType } from '../../services/materialService';
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
import { DocumentIcon } from '@heroicons/react/24/outline';

export default function StudentMaterialsPageRedesign() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const [materials, setMaterials] = useState<MaterialType[]>([]);
  const [subjects, setSubjects] = useState<SubjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter & View state
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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

      // Load all subjects
      const subjectsData = await getAllSubjects();
      setSubjects(subjectsData);

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
      setMaterials(materialsData);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat materi');
    }
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

  // Filter materials by search query
  const filteredMaterials = materials.filter((material) =>
    material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.subject?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Prepare subject filter options
  const subjectOptions = subjects.map(subject => ({
    value: subject.id,
    label: subject.name,
  }));

  const navItems = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Materi', href: '/student/materials', icon: BookOpenIcon },
    { name: 'Tugas', href: '/student/assignments', icon: DocumentTextIcon },
    { name: 'Quiz', href: '/student/quizzes', icon: AcademicCapIcon },
    { name: 'Nilai', href: '/student/grades', icon: ChartBarIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        user={{
          name: user?.name || 'Student',
          role: 'STUDENT',
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
            name: user?.name || 'Student',
            role: 'STUDENT',
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Materi Pembelajaran
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Akses semua materi dari mata pelajaran yang kamu ikuti
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700 text-danger-800 dark:text-danger-300 px-4 py-3 rounded-lg">
              {error}
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
              title={searchQuery || selectedSubject ? 'Tidak ada materi yang sesuai' : 'Belum ada materi tersedia'}
              description={
                searchQuery || selectedSubject
                  ? 'Coba ubah filter atau kata kunci pencarian Anda'
                  : 'Materi pembelajaran akan muncul di sini ketika guru mengunggah materi baru'
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
                  : undefined
              }
            />
          ) : (
            <>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {filteredMaterials.map((material) => (
                  <MaterialCard
                    key={material.id}
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
    </div>
  );
}
