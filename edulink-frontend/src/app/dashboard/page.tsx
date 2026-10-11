'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  BookOpen, 
  HelpCircle, 
  UploadCloud, 
  ArrowRight, 
  GraduationCap, 
  Sparkles,
  FileText,
  ThumbsUp,
  Download,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { getResources, getDoubts, ResourceItem, DoubtItem } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentResources, setRecentResources] = useState<ResourceItem[]>([]);
  const [recentDoubts, setRecentDoubts] = useState<DoubtItem[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth');
          return;
        }

        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (userProfile && userProfile.is_complete === false) {
          router.push('/profile-setup');
          return;
        }

        setProfile(userProfile || { full_name: 'Student', campus: 'KTR' });

        // Load recommended resources & doubts
        try {
          const [resData, doubtData] = await Promise.all([
            getResources({
              semester: userProfile?.semester || undefined,
              limit: 4,
              sortBy: 'popular',
            }),
            getDoubts({
              limit: 4,
              sortBy: 'recent',
            }),
          ]);
          setRecentResources(resData.resources || []);
          setRecentDoubts(doubtData.doubts || []);
        } catch (fetchErr) {
          console.error('Failed to load feed:', fetchErr);
        }
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router, supabase]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto pb-12 space-y-8">
        {/* Welcome SRM Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1C1B1C] via-[#201F20] to-[#161516] text-white p-6 md:p-8 border border-stone-800 shadow-xl shadow-black/40">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FF553E]/10 text-[#FF553E] border border-[#FF553E]/20">
                  <GraduationCap size={14} />
                  SRMIST Kattankulathur (KTR)
                </span>
                {profile?.register_no && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#141314] border border-stone-800 text-stone-300">
                    {profile.register_no}
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-4xl font-serif font-normal tracking-tight text-white">
                Welcome back, {profile?.full_name || 'Student'}!
              </h1>
              <p className="text-sm text-stone-400 mt-2 max-w-xl font-normal leading-relaxed">
                {profile?.branch ? `${profile.branch} • Semester ${profile.semester || 1}` : currentDate}
                {' — '} Access curated lecture notes, PYQs, and solve doubts with your peers.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/resources"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF553E] hover:bg-[#E04732] text-white font-semibold text-xs transition-all shadow-md shadow-[#FF553E]/20 hover:scale-[1.02]"
              >
                <BookOpen size={15} />
                <span>Browse Notes</span>
              </Link>
              <Link
                href="/doubts"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#141314] hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white font-semibold text-xs transition-all"
              >
                <HelpCircle size={15} className="text-[#FF553E]" />
                <span>Ask a Doubt</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Link
            href="/resources?sortBy=popular"
            className="group bg-[#1C1B1C] border border-stone-800 hover:border-stone-700 rounded-2xl p-5 shadow-sm transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <BookOpen size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-stone-400">Academic Library</p>
              <h3 className="text-sm font-bold text-white group-hover:text-[#FF553E] transition-colors">
                Notes & Exam Papers
              </h3>
            </div>
          </Link>

          <Link
            href="/doubts?status=unresolved"
            className="group bg-[#1C1B1C] border border-stone-800 hover:border-stone-700 rounded-2xl p-5 shadow-sm transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[#FF553E]/10 text-[#FF553E] flex items-center justify-center font-bold">
              <HelpCircle size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-stone-400">Community Doubts</p>
              <h3 className="text-sm font-bold text-white group-hover:text-[#FF553E] transition-colors">
                Unresolved Questions
              </h3>
            </div>
          </Link>

          <Link
            href="/resources"
            className="group bg-[#1C1B1C] border border-stone-800 hover:border-stone-700 rounded-2xl p-5 shadow-sm transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <UploadCloud size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-stone-400">Share Materials</p>
              <h3 className="text-sm font-bold text-white group-hover:text-[#FF553E] transition-colors">
                Upload for SRMites
              </h3>
            </div>
          </Link>
        </div>

        {/* 2-Column Content Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Popular Notes for Current Semester */}
          <div className="bg-[#1C1B1C] border border-stone-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-stone-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-serif text-white">Popular Study Materials</h2>
                    <p className="text-xs text-stone-400">Top notes & PYQs for Semester {profile?.semester || 1}</p>
                  </div>
                </div>
                <Link
                  href="/resources"
                  className="text-xs font-semibold text-[#FF553E] hover:underline flex items-center gap-1"
                >
                  View All <ArrowRight size={13} />
                </Link>
              </div>

              {recentResources.length > 0 ? (
                <div className="space-y-3">
                  {recentResources.map((res) => (
                    <div
                      key={res.id}
                      onClick={() => window.open(res.file_url, '_blank')}
                      className="p-3.5 rounded-xl border border-stone-800/80 hover:border-stone-700 bg-[#141314] transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FF553E]/10 text-[#FF553E] uppercase border border-[#FF553E]/20">
                            {res.resource_type}
                          </span>
                          <span className="text-xs text-stone-400 truncate">{res.subject_name}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-[#FF553E] transition-colors">
                          {res.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-stone-400 shrink-0">
                        <span className="flex items-center gap-1">
                          <ThumbsUp size={12} className="text-stone-500" />
                          {res.upvotes_count || 0}
                        </span>
                        <span className="flex items-center gap-1 text-[#FF553E] font-medium">
                          <Download size={12} />
                          {res.downloads_count || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-stone-500">
                  No materials uploaded for this semester yet.{' '}
                  <Link href="/resources" className="text-[#FF553E] font-semibold hover:underline">
                    Be the first!
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-stone-800">
              <Link
                href="/resources"
                className="w-full py-2.5 rounded-xl bg-[#141314] hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Browse All SRM Notes & PYQs</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Active Community Doubts */}
          <div className="bg-[#1C1B1C] border border-stone-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-stone-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FF553E]/10 text-[#FF553E] flex items-center justify-center">
                    <HelpCircle size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-serif text-white">Recent Subject Doubts</h2>
                    <p className="text-xs text-stone-400">Questions asked by SRM students</p>
                  </div>
                </div>
                <Link
                  href="/doubts"
                  className="text-xs font-semibold text-[#FF553E] hover:underline flex items-center gap-1"
                >
                  View All <ArrowRight size={13} />
                </Link>
              </div>

              {recentDoubts.length > 0 ? (
                <div className="space-y-3">
                  {recentDoubts.map((doubt) => (
                    <Link
                      key={doubt.id}
                      href={`/doubts/${doubt.id}`}
                      className="p-3.5 rounded-xl border border-stone-800/80 hover:border-stone-700 bg-[#141314] transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold text-stone-400 bg-stone-800 px-2 py-0.5 rounded-md border border-stone-700/60">
                            {doubt.subject_name}
                          </span>
                          {doubt.is_resolved ? (
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                              <CheckCircle2 size={11} /> Resolved
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#FF553E]">Open</span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-[#FF553E] transition-colors">
                          {doubt.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-stone-400 shrink-0">
                        <span className="flex items-center gap-1 font-medium text-stone-300">
                          <MessageSquare size={12} />
                          {doubt.answers_count || 0}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-stone-500">
                  No active doubts right now.{' '}
                  <Link href="/doubts" className="text-[#FF553E] font-semibold hover:underline">
                    Got a question? Ask here!
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-stone-800">
              <Link
                href="/doubts"
                className="w-full py-2.5 rounded-xl bg-[#141314] hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Go to Doubts & Discussion Forum</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
