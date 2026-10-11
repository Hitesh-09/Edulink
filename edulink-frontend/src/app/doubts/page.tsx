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
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-[#FF553E]/10 border border-[#FF553E]/20 text-[#FF553E] font-semibold text-xs flex items-center gap-1.5">
                <Sparkles size={12} />
                SRM Peer Doubts Forum
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-serif text-white tracking-tight">
              Subject Doubts & Questions
            </h1>
            <p className="text-sm text-stone-400 mt-1.5">
              Ask doubts, get verified answers from SRM peers, and help classmates master subjects.
            </p>
          </div>

          <button
            onClick={() => setIsAskOpen(true)}
            className="self-start md:self-auto flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#FF553E] hover:bg-[#E04732] text-white font-semibold text-sm shadow-md shadow-[#FF553E]/20 transition-all hover:scale-[1.02]"
          >
            <Plus size={18} />
            <span>Ask a Doubt</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-[#1C1B1C] border border-stone-800 rounded-3xl p-5 mb-8 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search doubts by topic, keyword, or subject..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-800 bg-[#141314] text-white placeholder:text-stone-500 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF553E] focus:border-[#FF553E]"
              />
            </div>

            {/* Department Dropdown */}
            <div className="w-full sm:w-56">
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
                <option value="recent">Newest Doubts</option>
                <option value="popular">Most Upvoted</option>
                <option value="unanswered">Unanswered</option>
              </select>
            </div>
          </div>

          {/* Status Tabs & Semester Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-800/80 pt-3.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatus('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  status === 'all'
                    ? 'bg-[#FF553E] text-white shadow-sm shadow-[#FF553E]/20'
                    : 'bg-[#141314] border border-stone-800 text-stone-400 hover:text-white'
                }`}
              >
                All Questions
              </button>
              <button
                onClick={() => setStatus('unresolved')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  status === 'unresolved'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-[#141314] border border-stone-800 text-stone-400 hover:text-white'
                }`}
              >
                Needs Answer
              </button>
              <button
                onClick={() => setStatus('resolved')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  status === 'resolved'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-[#141314] border border-stone-800 text-stone-400 hover:text-white'
                }`}
              >
                Resolved
              </button>
            </div>

            {/* Semester pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSemester('')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  semester === ''
                    ? 'bg-white text-stone-900 font-semibold'
                    : 'bg-[#141314] border border-stone-800/80 text-stone-400 hover:text-white'
                }`}
              >
                All Sem
              </button>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => (
                <button
                  key={s}
                  onClick={() => setSemester(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    semester === s
                      ? 'bg-[#FF553E] text-white font-semibold'
                      : 'bg-[#141314] border border-stone-800/80 text-stone-400 hover:text-white'
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
              <div key={i} className="bg-[#1C1B1C] border border-stone-800 rounded-2xl p-5 h-36 animate-pulse space-y-3">
                <div className="w-1/3 h-4 bg-stone-800 rounded-md" />
                <div className="w-3/4 h-5 bg-stone-800 rounded-md" />
                <div className="w-1/2 h-3 bg-stone-800 rounded-md" />
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
          <div className="bg-[#1C1B1C] border border-stone-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 bg-[#FF553E]/10 border border-[#FF553E]/20 text-[#FF553E] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <HelpCircle size={28} />
            </div>
            <h3 className="text-lg font-serif font-bold text-white mb-1.5">No Doubts Found</h3>
            <p className="text-xs text-stone-400 mb-6 leading-relaxed">
              {search || department !== 'All Departments' || semester !== ''
                ? 'Try clearing some filters to see more queries.'
                : 'Have a query from your lectures or lab? Be the first to ask!'}
            </p>
            <button
              onClick={() => setIsAskOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#FF553E] hover:bg-[#E04732] text-white text-sm font-semibold shadow-md shadow-[#FF553E]/20 transition-all"
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
