import React from 'react';
import { Sidebar } from './Sidebar';
import { MobileTabBar } from './MobileTabBar';
import { ThemeToggle } from '../ui/ThemeToggle';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-border sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center text-white font-bold text-sm">E</div>
          <span className="font-bold text-primary-dark">Edulink</span>
        </div>
        <ThemeToggle />
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
