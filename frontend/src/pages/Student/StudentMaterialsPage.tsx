import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  getAllMaterials,
  formatFileSize,
  getMaterialIcon,
  getDownloadUrl,
} from '../../services/materialService';
import type { MaterialType } from '../../services/materialService';
import { getAllSubjects } from '../../services/subjectService';
import type { SubjectType } from '../../services/subjectService';

export default function StudentMaterialsPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [materials, setMaterials] = useState<MaterialType[]>([]);
  const [subjects, setSubjects] = useState<SubjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

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

      // Load all subjects to get enrolled subjects
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

  // Group materials by subject
  const groupedMaterials = filteredMaterials.reduce((acc, material) => {
    const subjectName = material.subject?.name || 'Lainnya';
    if (!acc[subjectName]) {
      acc[subjectName] = [];
    }
    acc[subjectName].push(material);
    return acc;
  }, {} as Record<string, MaterialType[]>);

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
        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari materi..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Mata Pelajaran</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Materials List */}
        {loading ? (
          <div className="bg-white shadow rounded-lg px-6 py-8 text-center text-gray-500">
            Memuat data...
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="bg-white shadow rounded-lg px-6 py-8 text-center text-gray-500">
            {searchQuery || selectedSubject
              ? 'Tidak ada materi yang sesuai dengan pencarian.'
              : 'Belum ada materi tersedia.'}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMaterials).map(([subjectName, subjectMaterials]) => (
              <div key={subjectName} className="bg-white shadow rounded-lg overflow-hidden">
                {/* Subject Header */}
                <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
                  <h2 className="text-lg font-semibold text-blue-900">{subjectName}</h2>
                  <p className="text-sm text-blue-700">
                    {subjectMaterials[0].subject?.class?.name || ''}
                  </p>
                </div>

                {/* Materials */}
                <div className="divide-y divide-gray-200">
                  {subjectMaterials.map((material) => (
                    <div key={material.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{getMaterialIcon(material)}</span>
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900">
                                {material.title}
                              </h3>
                              {material.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {material.description}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  👤 {material.uploader?.name}
                                </span>
                                {material.fileName && (
                                  <span className="flex items-center gap-1">
                                    📎 {material.fileName}
                                  </span>
                                )}
                                {material.fileSize && (
                                  <span className="flex items-center gap-1">
                                    💾 {formatFileSize(material.fileSize)}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  📅 {new Date(material.createdAt).toLocaleDateString('id-ID')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex-shrink-0">
                          {material.type === 'LINK' ? (
                            <a
                              href={material.url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                            >
                              🔗 Buka Link
                            </a>
                          ) : (
                            <button
                              onClick={() =>
                                handleDownload(material.id, material.fileName || 'file')
                              }
                              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                            >
                              ⬇️ Download
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {!loading && filteredMaterials.length > 0 && (
          <div className="mt-6 bg-white shadow rounded-lg px-6 py-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Total: <strong>{filteredMaterials.length}</strong> materi
                {selectedSubject && ' untuk mata pelajaran ini'}
              </span>
              <span>
                {Object.keys(groupedMaterials).length} mata pelajaran
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
