import React from 'react';
import { Sidebar } from './Sidebar';
import { MobileTabBar } from './MobileTabBar';
import { ThemeToggle } from '../ui/ThemeToggle';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[#141314] text-[#F3F2F0]">
      <Sidebar />
      
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#1C1B1C] border-b border-stone-800 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-tr from-[#FF553E] to-[#FFA07A] rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">E</div>
          <span className="font-bold text-white text-base tracking-tight">EduLink</span>
          <span className="text-[10px] font-semibold text-[#FF553E] bg-[#FF553E]/10 px-2 py-0.5 rounded-full border border-[#FF553E]/20">SRM KTR</span>
        </div>
      </header>

      <div className="md:ml-60 pb-16 md:pb-0">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
