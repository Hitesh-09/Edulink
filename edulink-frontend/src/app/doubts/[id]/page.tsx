'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  ArrowLeft, 
  ThumbsUp, 
  CheckCircle2, 
  HelpCircle, 
  Send, 
  Check, 
  Loader2, 
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  DoubtItem, 
  DoubtAnswerItem, 
  getDoubtById, 
  postDoubtAnswer, 
  upvoteDoubt, 
  upvoteAnswer, 
  acceptAnswer 
} from '@/lib/api';

export default function DoubtDetailPage() {
  const params = useParams();
  const router = useRouter();
  const doubtId = params.id as string;
  const supabase = createClientComponentClient();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [doubt, setDoubt] = useState<DoubtItem | null>(null);
  const [answers, setAnswers] = useState<DoubtAnswerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Answer State
  const [newAnswer, setNewAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, [supabase]);

  const loadDoubtData = async () => {
    if (!doubtId) return;
    try {
      const data = await getDoubtById(doubtId);
      setDoubt(data.doubt);
      setAnswers(data.answers || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoubtData();
  }, [doubtId]);

  const handleUpvoteDoubt = async () => {
    if (!doubt) return;
    const prevUpvoted = doubt.has_upvoted;
    const prevCount = doubt.upvotes_count;

    setDoubt({
      ...doubt,
      has_upvoted: !prevUpvoted,
      upvotes_count: prevUpvoted ? Math.max(0, prevCount - 1) : prevCount + 1,
    });

    try {
      const res = await upvoteDoubt(doubt.id);
      setDoubt((d) => d ? { ...d, has_upvoted: res.has_upvoted, upvotes_count: res.upvotes_count } : null);
    } catch {
      setDoubt((d) => d ? { ...d, has_upvoted: prevUpvoted, upvotes_count: prevCount } : null);
    }
  };

  const handleUpvoteAnswer = async (answerId: string) => {
    const target = answers.find((a) => a.id === answerId);
    if (!target) return;

    const prevUpvoted = target.has_upvoted;
    const prevCount = target.upvotes_count;

    setAnswers((list) =>
      list.map((a) =>
        a.id === answerId
          ? {
              ...a,
              has_upvoted: !prevUpvoted,
              upvotes_count: prevUpvoted ? Math.max(0, prevCount - 1) : prevCount + 1,
            }
          : a
      )
    );

    try {
      const res = await upvoteAnswer(answerId);
      setAnswers((list) =>
        list.map((a) =>
          a.id === answerId ? { ...a, has_upvoted: res.has_upvoted, upvotes_count: res.upvotes_count } : a
        )
      );
    } catch {
      setAnswers((list) =>
        list.map((a) =>
          a.id === answerId ? { ...a, has_upvoted: prevUpvoted, upvotes_count: prevCount } : a
        )
      );
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      await acceptAnswer(answerId);
      setAnswers((list) =>
        list.map((a) => ({
          ...a,
          is_accepted: a.id === answerId,
        }))
      );
      setDoubt((d) => d ? { ...d, is_resolved: true } : null);
    } catch (err: any) {
      alert(err.message || 'Failed to accept answer');
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;

    setSubmitting(true);
    setAnswerError(null);

    try {
      const created = await postDoubtAnswer(doubtId, newAnswer.trim());
      setAnswers((list) => [...list, created]);
      setNewAnswer('');
      setDoubt((d) => d ? { ...d, answers_count: (d.answers_count || 0) + 1 } : null);
    } catch (err: any) {
      setAnswerError(err.message || 'Failed to post answer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto py-8">
          <div className="h-64 bg-[#1C1B1C] border border-stone-800 rounded-2xl animate-pulse" />
        </div>
      </AppLayout>
    );
  }

  if (error || !doubt) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto py-12 text-center bg-[#1C1B1C] border border-stone-800 rounded-2xl p-8">
          <p className="text-red-400 mb-4">{error || 'Doubt not found'}</p>
          <button
            onClick={() => router.push('/doubts')}
            className="px-4 py-2 bg-[#FF553E] hover:bg-[#E04732] text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Back to Doubts Feed
          </button>
        </div>
      </AppLayout>
    );
  }

  const isDoubtAuthor = currentUserId === doubt.author_id;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-16">
        {/* Back navigation */}
        <button
          onClick={() => router.push('/doubts')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-[#FF553E] mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to All Doubts</span>
        </button>

        {/* Question Container */}
        <div className="bg-[#1C1B1C] border border-stone-800 rounded-2xl p-6 md:p-8 shadow-xl shadow-black/20 mb-8">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-[#FF553E]/10 text-[#FF553E] border border-[#FF553E]/20">
                {doubt.subject_name}
              </span>
              {doubt.department && (
                <span className="text-xs text-stone-400 bg-stone-900 border border-stone-800 px-2.5 py-1 rounded-md">
                  {doubt.department}
                </span>
              )}
              {doubt.semester && (
                <span className="text-xs text-stone-400 bg-stone-900 border border-stone-800 px-2.5 py-1 rounded-md">
                  Sem {doubt.semester}
                </span>
              )}
            </div>

            {doubt.is_resolved ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800/60">
                <CheckCircle2 size={14} />
                Resolved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/40 text-amber-400 border border-amber-800/60">
                <HelpCircle size={14} />
                Open Doubt
              </span>
            )}
          </div>

          <h1 className="text-xl md:text-2xl font-serif font-bold text-stone-100 mb-4 leading-snug">
            {doubt.title}
          </h1>

          <div className="text-sm text-stone-300 whitespace-pre-wrap leading-relaxed mb-6 font-normal">
            {doubt.content}
          </div>

          {/* Tags */}
          {doubt.tags && doubt.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {doubt.tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-xs text-stone-400 bg-stone-900 border border-stone-800 px-2.5 py-1 rounded-lg font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Question Footer */}
          <div className="pt-4 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400 flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FF553E]/15 text-[#FF553E] border border-[#FF553E]/30 flex items-center justify-center font-bold text-xs">
                {doubt.author?.full_name ? doubt.author.full_name[0].toUpperCase() : 'S'}
              </div>
              <div>
                <p className="font-semibold text-stone-200">{doubt.author?.full_name || 'SRM Student'}</p>
                <p className="text-[11px] text-stone-500">
                  {doubt.author?.branch || 'SRMIST'} • {new Date(doubt.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <button
              onClick={handleUpvoteDoubt}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                doubt.has_upvoted
                  ? 'bg-[#FF553E] text-white shadow-lg shadow-[#FF553E]/20'
                  : 'bg-stone-900 border border-stone-800 text-stone-300 hover:text-stone-100 hover:bg-stone-800'
              }`}
            >
              <ThumbsUp size={14} fill={doubt.has_upvoted ? 'currentColor' : 'none'} />
              <span>Upvote ({doubt.upvotes_count || 0})</span>
            </button>
          </div>
        </div>

        {/* Answers List Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-xl font-serif font-bold text-stone-100">
              {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
            </h2>
          </div>

          {answers.length > 0 ? (
            <div className="space-y-4">
              {answers.map((answer) => (
                <div
                  key={answer.id}
                  className={`bg-[#1C1B1C] border rounded-2xl p-6 transition-all shadow-lg shadow-black/20 ${
                    answer.is_accepted
                      ? 'border-emerald-500/50 shadow-emerald-950/20 ring-1 ring-emerald-500/20'
                      : 'border-stone-800'
                  }`}
                >
                  {/* Accepted Banner */}
                  {answer.is_accepted && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-3 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl w-fit">
                      <CheckCircle2 size={16} />
                      <span>Verified Best Solution</span>
                    </div>
                  )}

                  <div className="text-sm text-stone-300 whitespace-pre-wrap leading-relaxed mb-4">
                    {answer.content}
                  </div>

                  <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#FF553E]/15 text-[#FF553E] border border-[#FF553E]/30 flex items-center justify-center font-bold text-[10px]">
                        {answer.author?.full_name ? answer.author.full_name[0].toUpperCase() : 'S'}
                      </div>
                      <span className="font-semibold text-stone-300">{answer.author?.full_name || 'SRM Student'}</span>
                      <span className="text-[11px] text-stone-500">({answer.author?.branch || 'SRM'})</span>
                      <span>•</span>
                      <span className="text-[11px] text-stone-500">{new Date(answer.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDoubtAuthor && !answer.is_accepted && (
                        <button
                          onClick={() => handleAcceptAnswer(answer.id)}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg text-emerald-400 hover:bg-emerald-950/40 font-semibold border border-emerald-800/60 transition-colors"
                        >
                          <Check size={14} />
                          <span>Accept Solution</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleUpvoteAnswer(answer.id)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-colors ${
                          answer.has_upvoted
                            ? 'bg-[#FF553E]/15 text-[#FF553E] border border-[#FF553E]/30 font-semibold'
                            : 'hover:bg-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        <ThumbsUp size={13} fill={answer.has_upvoted ? 'currentColor' : 'none'} />
                        <span>{answer.upvotes_count || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#1C1B1C] border border-stone-800 rounded-2xl p-8 text-center text-stone-400 text-sm">
              No answers yet. Share your knowledge and help your SRM classmate!
            </div>
          )}
        </div>

        {/* Post Answer Section */}
        <div className="bg-[#1C1B1C] border border-stone-800 rounded-2xl p-6 shadow-xl shadow-black/20">
          <h3 className="font-serif font-bold text-lg text-stone-100 mb-1">Your Answer</h3>
          <p className="text-xs text-stone-400 mb-4">
            Provide a clear explanation, formulas, or code to answer this query.
          </p>

          {answerError && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-center gap-2 text-xs text-red-400">
              <AlertCircle size={15} />
              <span>{answerError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitAnswer} className="space-y-4">
            <textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Write your detailed solution here..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-stone-800 bg-[#141314] text-stone-100 placeholder:text-stone-600 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF553E] focus:border-[#FF553E] leading-relaxed"
              required
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !newAnswer.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF553E] hover:bg-[#E04732] text-white text-sm font-semibold shadow-lg shadow-[#FF553E]/20 transition-all disabled:opacity-50"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                <Send size={15} />
                <span>{submitting ? 'Submitting...' : 'Post Answer'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
