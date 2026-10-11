'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  BookOpen, 
  FileText, 
  SlidersHorizontal,
  GraduationCap,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ResourceCard } from '@/components/resources/ResourceCard';
import { UploadResourceModal } from '@/components/resources/UploadResourceModal';
import { ResourceItem, getResources } from '@/lib/api';

const DEPARTMENTS = [
  'All Departments',
  'CSE Core',
  'CSE (AI & Machine Learning)',
  'CSE (Data Science)',
  'CSE (Cyber Security)',
  'Information Technology (IT)',
  'Electronics & Communication (ECE)',
  'Electrical & Electronics (EEE)',
  'Mechanical Engineering',
  'Biotechnology',
];

const CATEGORIES = [
  { id: 'all', label: 'All Resources' },
  { id: 'notes', label: 'Lecture Notes' },
  { id: 'pyq', label: 'PYQs (Exams)' },
  { id: 'lab_manual', label: 'Lab Manuals' },
  { id: 'book', label: 'Books' },
  { id: 'assignment', label: 'Assignments' },
];

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All Departments');
  const [semester, setSemester] = useState<number | ''>('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'downloads'>('popular');

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getResources({
        search: search.trim() || undefined,
        department: department !== 'All Departments' ? department : undefined,
        semester: semester !== '' ? Number(semester) : undefined,
        resource_type: category !== 'all' ? (category as any) : undefined,
        sortBy,
      });
      setResources(data.resources || []);
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  }, [search, department, semester, category, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMaterials();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchMaterials]);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center gap-1">
                <Sparkles size={12} />
                SRM KTR StuDocu Hub
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-main tracking-tight">
              Academic Resource Library
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Access lecture notes, past year questions (PYQs), lab records, and syllabus materials.
            </p>
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="self-start md:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm shadow-md shadow-primary/20 transition-all hover:scale-[1.02]"
          >
            <Plus size={18} />
            <span>Upload Notes / PYQ</span>
          </button>
        </div>

        {/* Search & Main Filter Controls */}
        <div className="bg-surface border border-border rounded-2xl p-4 md:p-5 mb-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by topic, subject (e.g. Data Structures), or code (21CSC201J)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Department Dropdown */}
            <div className="w-full sm:w-60">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="w-full sm:w-44">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="popular">Most Upvoted</option>
                <option value="downloads">Most Downloaded</option>
                <option value="recent">Recently Added</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-border pt-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  category === cat.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-text-muted hover:text-text-main'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Semester Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
            <span className="text-xs font-medium text-text-muted whitespace-nowrap mr-1">Semester:</span>
            <button
              onClick={() => setSemester('')}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                semester === ''
                  ? 'bg-text-main text-surface font-semibold'
                  : 'bg-gray-50 dark:bg-gray-800/60 text-text-muted hover:text-text-main'
              }`}
            >
              All Semesters
            </button>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
              <button
                key={sem}
                onClick={() => setSemester(sem)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  semester === sem
                    ? 'bg-text-main text-surface font-semibold'
                    : 'bg-gray-50 dark:bg-gray-800/60 text-text-muted hover:text-text-main'
                }`}
              >
                Sem {sem}
              </button>
            ))}
          </div>
        </div>

        {/* Resources Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl p-5 h-56 animate-pulse flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-24 h-5 bg-gray-200 dark:bg-gray-800 rounded-md" />
                  <div className="w-full h-5 bg-gray-200 dark:bg-gray-800 rounded-md" />
                  <div className="w-1/2 h-4 bg-gray-200 dark:bg-gray-800 rounded-md" />
                </div>
                <div className="w-full h-8 bg-gray-200 dark:bg-gray-800 rounded-md" />
              </div>
            ))}
          </div>
        ) : resources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {resources.map((res) => (
              <ResourceCard
                key={res.id}
                resource={res}
                onUpvoteChange={(id, count, hasUpvoted) => {
                  setResources((prev) =>
                    prev.map((r) => (r.id === id ? { ...r, upvotes_count: count, has_upvoted: hasUpvoted } : r))
                  );
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-2xl p-12 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} />
            </div>
            <h3 className="text-lg font-bold text-text-main mb-1">No Study Materials Found</h3>
            <p className="text-xs text-text-muted mb-6">
              {search || department !== 'All Departments' || semester !== ''
                ? 'Try adjusting your filters or search terms.'
                : 'No documents have been uploaded yet. Be the first to share notes with SRMites!'}
            </p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-all"
            >
              <Plus size={16} />
              <span>Upload Notes for this Subject</span>
            </button>
          </div>
        )}

        {/* Upload Modal */}
        <UploadResourceModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={fetchMaterials}
          defaultDepartment={department !== 'All Departments' ? department : undefined}
          defaultSemester={semester !== '' ? Number(semester) : undefined}
        />
      </div>
    </AppLayout>
  );
}
