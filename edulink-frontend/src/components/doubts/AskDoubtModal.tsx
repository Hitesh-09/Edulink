'use client';

import { useState } from 'react';
import { X, HelpCircle, Loader2, AlertCircle } from 'lucide-react';
import { createDoubt } from '@/lib/api';

interface AskDoubtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDepartment?: string;
  defaultSemester?: number;
}

const DEPARTMENTS = [
  'CSE Core',
  'CSE (AI & Machine Learning)',
  'CSE (Data Science)',
  'CSE (Cyber Security)',
  'CSE (Cloud Computing)',
  'Information Technology (IT)',
  'Electronics & Communication (ECE)',
  'Electrical & Electronics (EEE)',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biotechnology',
  'Other',
];

export function AskDoubtModal({
  isOpen,
  onClose,
  onSuccess,
  defaultDepartment,
  defaultSemester,
}: AskDoubtModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [department, setDepartment] = useState(defaultDepartment || 'CSE Core');
  const [semester, setSemester] = useState(String(defaultSemester || '3'));
  const [tagsInput, setTagsInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !subjectName.trim()) {
      setError('Title, Subject, and detailed description are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      await createDoubt({
        title: title.trim(),
        content: content.trim(),
        subject_name: subjectName.trim(),
        department,
        semester: Number(semester),
        tags: tags.length > 0 ? tags : undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to post doubt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#1C1B1C] border border-stone-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF553E] bg-[#FF553E]/10 px-2 py-0.5 rounded-full border border-[#FF553E]/20">
                SRM KTR Doubt Forum
              </span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-100">Ask a Subject Doubt</h2>
            <p className="text-xs text-stone-400">Post your question to SRM peers and seniors</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-center gap-2 text-xs text-red-400">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Question Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Question Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Why does Dijkstra's algorithm fail on graphs with negative cycles?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-800 bg-[#141314] text-stone-100 placeholder:text-stone-600 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF553E] focus:border-[#FF553E] font-medium"
              required
            />
          </div>

          {/* Subject & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Subject Name *
              </label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g. Design & Analysis of Algorithms"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-800 bg-[#141314] text-stone-100 placeholder:text-stone-600 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF553E] focus:border-[#FF553E]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Department *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-800 bg-[#141314] text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF553E] focus:border-[#FF553E]"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept} className="bg-[#1C1B1C] text-stone-200">
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Semester & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Semester *
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-800 bg-[#141314] text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF553E] focus:border-[#FF553E]"
              >
                {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={String(s)} className="bg-[#1C1B1C] text-stone-200">
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. Graphs, Greedy, CAT-1"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-800 bg-[#141314] text-stone-100 placeholder:text-stone-600 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF553E] focus:border-[#FF553E]"
              />
            </div>
          </div>

          {/* Detailed Question Body */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Describe your doubt in detail *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Explain what concept you find confusing, what you've tried, or paste code snippets..."
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-800 bg-[#141314] text-stone-100 placeholder:text-stone-600 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF553E] focus:border-[#FF553E] leading-relaxed"
              required
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-stone-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-stone-800 text-stone-300 text-sm font-medium hover:bg-stone-800 hover:text-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#FF553E] hover:bg-[#E04732] text-white text-sm font-semibold shadow-lg shadow-[#FF553E]/20 transition-all disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{loading ? 'Posting...' : 'Ask Community'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
