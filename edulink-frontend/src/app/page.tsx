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
  Play,
  Mail,
  Phone,
  ExternalLink
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

      {/* Let's Work Together Section */}
      <section className="w-full py-24 sm:py-32 px-6 bg-[#141314]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl sm:text-7xl md:text-8xl font-light tracking-tight text-white leading-[1.1] mb-2">
            Let&apos;s work
          </h2>
          <h2 className="text-5xl sm:text-7xl md:text-8xl font-light tracking-tight text-stone-500 leading-[1.1] mb-10">
            together
          </h2>

          {/* Arrow Circle Button */}
          <a
            href="mailto:hiteishshimpi@gmail.com"
            className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-stone-700 hover:border-white text-stone-400 hover:text-white transition-all mb-16"
          >
            <ExternalLink size={22} />
          </a>

          {/* Description */}
          <p className="text-lg sm:text-xl text-stone-400 max-w-xl mx-auto leading-relaxed mb-8">
            Have a project in mind? I&apos;d love to hear about it. Let&apos;s create something exceptional together.
          </p>

          {/* Email */}
          <a
            href="mailto:hiteishshimpi@gmail.com"
            className="flex items-center justify-center gap-2.5 text-lg sm:text-xl text-stone-300 hover:text-white transition-colors mb-3"
          >
            <Mail size={20} className="text-[#FF553E]" />
            hiteishshimpi@gmail.com
          </a>

          {/* Phone */}
          <a
            href="tel:+919876543210"
            className="flex items-center justify-center gap-2.5 text-lg sm:text-xl text-stone-300 hover:text-white transition-colors"
          >
            <Phone size={20} className="text-[#FF553E]" />
            +91 98765 43210
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-stone-800/80 py-10 px-6 bg-[#141314]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Copyright */}
          <p className="text-sm text-stone-500">
            © {new Date().getFullYear()} EduLink — SRMIST KTR Academic Community Platform.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-5">
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-white transition-colors" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-white transition-colors" aria-label="LinkedIn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-white transition-colors" aria-label="Twitter / X">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-white transition-colors" aria-label="GitHub">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
