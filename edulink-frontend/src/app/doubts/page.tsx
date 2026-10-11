'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  HelpCircle, 
  CheckCircle2, 
  MessageSquare,
  Sparkles,
  Users
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DoubtCard } from '@/components/doubts/DoubtCard';
import { AskDoubtModal } from '@/components/doubts/AskDoubtModal';
import { DoubtItem, getDoubts } from '@/lib/api';

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

export default function DoubtsPage() {
  const [doubts, setDoubts] = useState<DoubtItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAskOpen, setIsAskOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All Departments');
  const [semester, setSemester] = useState<number | ''>('');
  const [status, setStatus] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'unanswered'>('recent');

  const fetchDoubtsList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDoubts({
        search: search.trim() || undefined,
        department: department !== 'All Departments' ? department : undefined,
        semester: semester !== '' ? Number(semester) : undefined,
        status: status !== 'all' ? status : undefined,
        sortBy,
      });
      setDoubts(data.doubts || []);
    } catch (err) {
      console.error('Failed to load doubts:', err);
    } finally {
      setLoading(false);
    }
  }, [search, department, semester, status, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDoubtsList();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchDoubtsList]);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center gap-1">
                <Sparkles size={12} />
                SRM Peer Discussion Forum
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-main tracking-tight">
              Subject Doubts & Questions
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Ask doubts, get verified answers from SRM peers, and help classmates master subjects.
            </p>
          </div>

          <button
            onClick={() => setIsAskOpen(true)}
            className="self-start md:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm shadow-md shadow-primary/20 transition-all hover:scale-[1.02]"
          >
            <Plus size={18} />
            <span>Ask a Doubt</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-surface border border-border rounded-2xl p-4 md:p-5 mb-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search doubts by topic, keyword, or subject..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Department Dropdown */}
            <div className="w-full sm:w-56">
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
                <option value="recent">Newest Doubts</option>
                <option value="popular">Most Upvoted</option>
                <option value="unanswered">Unanswered</option>
              </select>
            </div>
          </div>

          {/* Status Tabs & Semester Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  status === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-text-muted hover:text-text-main'
                }`}
              >
                All Questions
              </button>
              <button
                onClick={() => setStatus('unresolved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  status === 'unresolved'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-text-muted hover:text-text-main'
                }`}
              >
                Needs Answer
              </button>
              <button
                onClick={() => setStatus('resolved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  status === 'resolved'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-text-muted hover:text-text-main'
                }`}
              >
                Resolved
              </button>
            </div>

            {/* Semester pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSemester('')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  semester === ''
                    ? 'bg-text-main text-surface font-semibold'
                    : 'bg-gray-50 dark:bg-gray-800 text-text-muted'
                }`}
              >
                All Sem
              </button>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => (
                <button
                  key={s}
                  onClick={() => setSemester(s)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    semester === s
                      ? 'bg-text-main text-surface font-semibold'
                      : 'bg-gray-50 dark:bg-gray-800 text-text-muted'
                  }`}
                >
                  Sem {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Doubts List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl p-5 h-36 animate-pulse space-y-3">
                <div className="w-1/3 h-4 bg-gray-200 dark:bg-gray-800 rounded-md" />
                <div className="w-3/4 h-5 bg-gray-200 dark:bg-gray-800 rounded-md" />
                <div className="w-1/2 h-3 bg-gray-200 dark:bg-gray-800 rounded-md" />
              </div>
            ))}
          </div>
        ) : doubts.length > 0 ? (
          <div className="space-y-4">
            {doubts.map((doubt) => (
              <DoubtCard
                key={doubt.id}
                doubt={doubt}
                onUpvoteChange={(id, count, hasUpvoted) => {
                  setDoubts((prev) =>
                    prev.map((d) => (d.id === id ? { ...d, upvotes_count: count, has_upvoted: hasUpvoted } : d))
                  );
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-2xl p-12 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <HelpCircle size={28} />
            </div>
            <h3 className="text-lg font-bold text-text-main mb-1">No Doubts Found</h3>
            <p className="text-xs text-text-muted mb-6">
              {search || department !== 'All Departments' || semester !== ''
                ? 'Try clearing some filters to see more queries.'
                : 'Have a query from your lectures or lab? Be the first to ask!'}
            </p>
            <button
              onClick={() => setIsAskOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-all"
            >
              <Plus size={16} />
              <span>Ask a Doubt</span>
            </button>
          </div>
        )}

        {/* Ask Doubt Modal */}
        <AskDoubtModal
          isOpen={isAskOpen}
          onClose={() => setIsAskOpen(false)}
          onSuccess={fetchDoubtsList}
          defaultDepartment={department !== 'All Departments' ? department : undefined}
          defaultSemester={semester !== '' ? Number(semester) : undefined}
        />
      </div>
    </AppLayout>
  );
}
