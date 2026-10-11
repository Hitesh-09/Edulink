'use client';

import { useState } from 'react';
import { 
  FileText, 
  Download, 
  ThumbsUp, 
  Bookmark, 
  ExternalLink,
  GraduationCap,
  Calendar,
  Eye
} from 'lucide-react';
import { ResourceItem, downloadResource, upvoteResource, bookmarkResource } from '@/lib/api';

interface ResourceCardProps {
  resource: ResourceItem;
  onUpvoteChange?: (id: string, count: number, hasUpvoted: boolean) => void;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  notes: { label: 'Lecture Notes', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
  pyq: { label: 'PYQ (Exam)', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' },
  lab_manual: { label: 'Lab Manual', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
  book: { label: 'Reference Book', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  assignment: { label: 'Assignment', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' },
  syllabus: { label: 'Syllabus', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' },
};

export function ResourceCard({ resource, onUpvoteChange }: ResourceCardProps) {
  const [upvotes, setUpvotes] = useState(resource.upvotes_count || 0);
  const [hasUpvoted, setHasUpvoted] = useState(resource.has_upvoted || false);
  const [hasBookmarked, setHasBookmarked] = useState(resource.has_bookmarked || false);
  const [downloads, setDownloads] = useState(resource.downloads_count || 0);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  const typeConfig = TYPE_CONFIG[resource.resource_type] || TYPE_CONFIG.notes;

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpvoting) return;
    setIsUpvoting(true);

    const prevUpvoted = hasUpvoted;
    const prevCount = upvotes;

    // Optimistic UI
    setHasUpvoted(!prevUpvoted);
    setUpvotes(prevUpvoted ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await upvoteResource(resource.id);
      setUpvotes(res.upvotes_count);
      setHasUpvoted(res.has_upvoted);
      onUpvoteChange?.(resource.id, res.upvotes_count, res.has_upvoted);
    } catch (err) {
      // Revert on error
      setHasUpvoted(prevUpvoted);
      setUpvotes(prevCount);
    } finally {
      setIsUpvoting(false);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBookmarking) return;
    setIsBookmarking(true);
    const prev = hasBookmarked;
    setHasBookmarked(!prev);

    try {
      const res = await bookmarkResource(resource.id);
      setHasBookmarked(res.has_bookmarked);
    } catch {
      setHasBookmarked(prev);
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloads((d) => d + 1);
    try {
      await downloadResource(resource.id);
    } catch {
      // silent
    }
    // Open file in new tab or download
    window.open(resource.file_url, '_blank', 'noopener,noreferrer');
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'PDF';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="group relative bg-[#1C1B1C] border border-stone-800 hover:border-stone-700 rounded-3xl p-5 shadow-lg transition-all flex flex-col justify-between">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${typeConfig.bg} ${typeConfig.color}`}>
            {typeConfig.label}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            <span className="px-2.5 py-0.5 rounded-full bg-[#141314] border border-stone-800 font-medium text-stone-300">
              Sem {resource.semester}
            </span>
            <button
              onClick={handleBookmark}
              aria-label="Bookmark resource"
              className={`p-1.5 rounded-full transition-colors ${
                hasBookmarked 
                  ? 'text-[#FF553E] bg-[#FF553E]/10' 
                  : 'text-stone-500 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Bookmark size={15} fill={hasBookmarked ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Title & Subject */}
        <h3 className="font-bold text-base text-white line-clamp-2 group-hover:text-[#FF553E] transition-colors mb-1">
          {resource.title}
        </h3>

        <div className="flex items-center gap-1.5 text-xs font-medium text-[#FF553E] mb-2">
          <span>{resource.subject_name}</span>
          {resource.subject_code && (
            <span className="text-stone-500 font-normal">({resource.subject_code})</span>
          )}
        </div>

        {resource.description && (
          <p className="text-xs text-stone-400 line-clamp-2 mb-3 leading-relaxed">
            {resource.description}
          </p>
        )}

        {/* Department tag */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1 text-[11px] text-stone-400 bg-[#141314] border border-stone-800/80 px-3 py-0.5 rounded-full">
            <GraduationCap size={12} className="text-[#FF553E]" />
            {resource.department}
          </span>
          <span className="text-[11px] text-stone-500">
            {formatFileSize(resource.file_size)}
          </span>
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-3.5 border-t border-stone-800/80 mt-auto flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-stone-400">
          <div className="w-6 h-6 rounded-full bg-[#FF553E]/10 border border-[#FF553E]/20 text-[#FF553E] flex items-center justify-center font-bold text-[10px]">
            {resource.uploader?.full_name ? resource.uploader.full_name[0].toUpperCase() : 'S'}
          </div>
          <span className="truncate max-w-[100px] font-medium text-stone-300">
            {resource.uploader?.full_name || 'SRM Student'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUpvote}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors ${
              hasUpvoted
                ? 'bg-[#FF553E]/10 border border-[#FF553E]/20 text-[#FF553E]'
                : 'text-stone-400 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <ThumbsUp size={13} fill={hasUpvoted ? 'currentColor' : 'none'} />
            <span>{upvotes}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FF553E] hover:bg-[#E04732] text-white font-semibold transition-all shadow-md shadow-[#FF553E]/20"
          >
            <Download size={13} />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}
