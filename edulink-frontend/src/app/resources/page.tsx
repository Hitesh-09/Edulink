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
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-[#FF553E]/10 border border-[#FF553E]/20 text-[#FF553E] font-semibold text-xs flex items-center gap-1.5">
                <Sparkles size={12} />
                SRM KTR StuDocu Library
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-serif text-white tracking-tight">
              Academic Resource Library
            </h1>
            <p className="text-sm text-stone-400 mt-1.5">
              Access lecture notes, past year questions (PYQs), lab records, and syllabus materials.
            </p>
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="self-start md:self-auto flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#FF553E] hover:bg-[#E04732] text-white font-semibold text-sm shadow-md shadow-[#FF553E]/20 transition-all hover:scale-[1.02]"
          >
            <Plus size={18} />
            <span>Upload Notes / PYQ</span>
          </button>
        </div>

        {/* Search & Main Filter Controls */}
        <div className="bg-[#1C1B1C] border border-stone-800 rounded-3xl p-5 mb-8 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by topic, subject (e.g. Data Structures), or code (21CSC201J)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-800 bg-[#141314] text-white placeholder:text-stone-500 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF553E] focus:border-[#FF553E]"
              />
            </div>

            {/* Department Dropdown */}
            <div className="w-full sm:w-60">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-800 bg-[#141314] text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#FF553E] focus:border-[#FF553E]"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-800 bg-[#141314] text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#FF553E] focus:border-[#FF553E]"
              >
                <option value="popular">Most Upvoted</option>
                <option value="downloads">Most Downloaded</option>
                <option value="recent">Recently Added</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-stone-800/80 pt-3.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  category === cat.id
                    ? 'bg-[#FF553E] text-white shadow-sm shadow-[#FF553E]/20'
                    : 'bg-[#141314] hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Semester Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
            <span className="text-xs font-medium text-stone-400 whitespace-nowrap mr-1">Semester:</span>
            <button
              onClick={() => setSemester('')}
              className={`px-3.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                semester === ''
                  ? 'bg-white text-stone-900 font-semibold'
                  : 'bg-[#141314] border border-stone-800/80 text-stone-400 hover:text-white'
              }`}
            >
              All Semesters
            </button>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
              <button
                key={sem}
                onClick={() => setSemester(sem)}
                className={`px-3.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  semester === sem
                    ? 'bg-[#FF553E] text-white font-semibold shadow-sm'
                    : 'bg-[#141314] border border-stone-800/80 text-stone-400 hover:text-white'
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
              <div key={i} className="bg-[#1C1B1C] border border-stone-800 rounded-2xl p-5 h-56 animate-pulse flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-24 h-5 bg-stone-800 rounded-md" />
                  <div className="w-full h-5 bg-stone-800 rounded-md" />
                  <div className="w-1/2 h-4 bg-stone-800 rounded-md" />
                </div>
                <div className="w-full h-8 bg-stone-800 rounded-md" />
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
          <div className="bg-[#1C1B1C] border border-stone-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 bg-[#FF553E]/10 border border-[#FF553E]/20 text-[#FF553E] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} />
            </div>
            <h3 className="text-lg font-serif font-bold text-white mb-1.5">No Study Materials Found</h3>
            <p className="text-xs text-stone-400 mb-6 leading-relaxed">
              {search || department !== 'All Departments' || semester !== ''
                ? 'Try adjusting your filters or search terms.'
                : 'No documents have been uploaded yet. Be the first to share notes with SRMites!'}
            </p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#FF553E] hover:bg-[#E04732] text-white text-sm font-semibold shadow-md shadow-[#FF553E]/20 transition-all"
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
