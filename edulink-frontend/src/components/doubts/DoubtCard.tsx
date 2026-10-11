'use client';

import Link from 'next/link';
import { useState } from 'react';
import { 
  MessageSquare, 
  ThumbsUp, 
  CheckCircle2, 
  HelpCircle, 
  GraduationCap, 
  Clock 
} from 'lucide-react';
import { DoubtItem, upvoteDoubt } from '@/lib/api';

interface DoubtCardProps {
  doubt: DoubtItem;
  onUpvoteChange?: (id: string, count: number, hasUpvoted: boolean) => void;
}

export function DoubtCard({ doubt, onUpvoteChange }: DoubtCardProps) {
  const [upvotes, setUpvotes] = useState(doubt.upvotes_count || 0);
  const [hasUpvoted, setHasUpvoted] = useState(doubt.has_upvoted || false);
  const [isUpvoting, setIsUpvoting] = useState(false);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUpvoting) return;
    setIsUpvoting(true);

    const prevUpvoted = hasUpvoted;
    const prevCount = upvotes;

    setHasUpvoted(!prevUpvoted);
    setUpvotes(prevUpvoted ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await upvoteDoubt(doubt.id);
      setUpvotes(res.upvotes_count);
      setHasUpvoted(res.has_upvoted);
      onUpvoteChange?.(doubt.id, res.upvotes_count, res.has_upvoted);
    } catch {
      setHasUpvoted(prevUpvoted);
      setUpvotes(prevCount);
    } finally {
      setIsUpvoting(false);
    }
  };

  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <Link
      href={`/doubts/${doubt.id}`}
      className="block group bg-surface border border-border hover:border-primary/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary">
            {doubt.subject_name}
          </span>
          {doubt.department && (
            <span className="text-[11px] text-text-muted bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
              {doubt.department}
            </span>
          )}
          {doubt.semester && (
            <span className="text-[11px] text-text-muted bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
              Sem {doubt.semester}
            </span>
          )}
        </div>

        {doubt.is_resolved ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={13} />
            Resolved
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <HelpCircle size={13} />
            Open
          </span>
        )}
      </div>

      <h3 className="text-base font-bold text-text-main group-hover:text-primary transition-colors line-clamp-2 mb-2">
        {doubt.title}
      </h3>

      <p className="text-xs text-text-muted line-clamp-2 mb-4 leading-relaxed">
        {doubt.content}
      </p>

      {/* Tags */}
      {doubt.tags && doubt.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {doubt.tags.slice(0, 4).map((tag, i) => (
            <span
              key={i}
              className="text-[10px] text-text-muted bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer Info & Stats */}
      <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
            {doubt.author?.full_name ? doubt.author.full_name[0].toUpperCase() : 'S'}
          </div>
          <span className="font-medium text-text-main">{doubt.author?.full_name || 'SRM Student'}</span>
          <span>•</span>
          <span className="text-[11px]">{timeAgo(doubt.created_at)}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleUpvote}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium transition-colors ${
              hasUpvoted
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-text-main'
            }`}
          >
            <ThumbsUp size={13} fill={hasUpvoted ? 'currentColor' : 'none'} />
            <span>{upvotes}</span>
          </button>

          <div className="flex items-center gap-1 font-medium">
            <MessageSquare size={13} />
            <span>{doubt.answers_count || 0} answers</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
