'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  BookOpen, 
  HelpCircle, 
  UploadCloud, 
  GraduationCap, 
  ArrowRight, 
  Sparkles,
  CheckCircle,
  FileText,
  Play
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_complete')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!profile || profile.is_complete !== true) {
          router.push('/profile-setup');
        } else {
          router.push('/dashboard');
        }
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_complete')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!profile || profile.is_complete !== true) {
          router.push('/profile-setup');
        } else {
          router.push('/dashboard');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-[#141314] text-[#F3F2F0] selection:bg-[#FF553E] selection:text-white flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#FF553E] to-[#FFA07A] flex items-center justify-center text-white shadow-sm">
              <GraduationCap size={16} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">EduLink</span>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-semibold text-[#FF553E] bg-[#FF553E]/10 px-2.5 py-0.5 rounded-full border border-[#FF553E]/20">
            SRMIST KTR
          </span>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-400">
          <Link href="#features" className="hover:text-white transition-colors">
            About EduLink
          </Link>
          <Link href="/resources" className="hover:text-white transition-colors">
            Academic Resources
          </Link>
          <Link href="/doubts" className="hover:text-white transition-colors">
            Doubts Forum
          </Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">
            How It Works
          </Link>
        </nav>

        {/* Right Auth Buttons */}
        <div className="flex items-center gap-4">
          <Link
            href="/auth?tab=login"
            className="text-sm font-semibold text-stone-300 hover:text-white transition-colors px-3 py-2"
          >
            Log In
          </Link>
          <Link
            href="/auth?tab=signup"
            className="px-5 py-2.5 rounded-full bg-[#FF553E] hover:bg-[#E04732] text-white text-sm font-semibold transition-all shadow-md shadow-[#FF553E]/20 hover:scale-[1.03]"
          >
            Start Free
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-20 flex flex-col items-center text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-xs text-stone-400 mb-8 animate-fade-in">
          <Sparkles size={13} className="text-[#FF553E]" />
          <span>The StuDocu + Peer Forum built exclusively for SRM KTR</span>
        </div>

        {/* Bold Editorial Serif Headline */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif font-normal tracking-tight text-white max-w-4xl leading-[1.08] mb-8">
          Notes & doubts, <br className="hidden sm:inline" />
          <span className="italic font-serif text-[#FF553E]">united at last</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-stone-400 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
          Go from hectic exam preparation to top grades. Access semester lecture notes, previous year question papers (PYQs), and resolve complex subject doubts with your SRM classmates.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
          <Link
            href="/auth?tab=signup"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#FF553E] hover:bg-[#E04732] text-white text-base font-semibold shadow-lg shadow-[#FF553E]/25 transition-all hover:scale-[1.02]"
          >
            Start free
          </Link>
          <Link
            href="/resources"
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white text-base font-semibold transition-all"
          >
            <Play size={16} className="text-[#FF553E] fill-current" />
            <span>Explore Materials</span>
          </Link>
        </div>

        {/* Features Preview Cards */}
        <div id="features" className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-12 border-t border-stone-800/80">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-[#1C1B1C] border border-stone-800 hover:border-stone-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
              <BookOpen size={20} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">StuDocu-Style Library</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Find unit-wise notes, previous year exam papers (PYQs), and lab manuals organized cleanly by SRM Department, Year, and Semester.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-[#1C1B1C] border border-stone-800 hover:border-stone-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#FF553E]/10 text-[#FF553E] flex items-center justify-center mb-4">
              <HelpCircle size={20} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Community Doubts Forum</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Stuck on a tricky concept or lab assignment? Ask your query, get solutions from top peers, and accept verified answers.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-[#1C1B1C] border border-stone-800 hover:border-stone-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <UploadCloud size={20} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Share & Get Recognized</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Upload your own notes and solutions in seconds. Earn peer upvotes, build your campus academic reputation, and help fellow SRMites.
            </p>
          </div>
        </div>

        {/* SRM Campus Trust Section */}
        <div id="how-it-works" className="w-full mt-20 p-8 rounded-3xl bg-gradient-to-b from-[#1C1B1C] to-[#161516] border border-stone-800 text-center">
          <span className="text-xs font-semibold text-[#FF553E] uppercase tracking-wider">
            Exclusively For SRMIST Kattankulathur
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-white mt-2 mb-4">
            Curated around SRM Branches & Course Codes
          </h2>
          <p className="text-sm text-stone-400 max-w-xl mx-auto mb-6">
            CSE Core, AIML, Data Science, Cybersecurity, IT, ECE, EEE, Mechanical, and Biotechnology — all aligned from Semester 1 through Semester 8.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-stone-400 font-medium">
            <span className="flex items-center gap-1.5"><CheckCircle size={15} className="text-emerald-400" /> Free Student Access</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={15} className="text-emerald-400" /> Google Auth or Personal Email</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={15} className="text-emerald-400" /> Verified Register Numbers</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-stone-800/80 py-8 px-6 text-center text-xs text-stone-500">
        <p>© {new Date().getFullYear()} EduLink — SRMIST KTR Academic Community Platform.</p>
      </footer>
    </div>
  );
}
