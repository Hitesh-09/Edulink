'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  LayoutDashboard, 
  BookOpen, 
  HelpCircle, 
  MessageSquare, 
  User,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  };

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Resources', href: '/resources', icon: BookOpen },
    { name: 'Doubts Forum', href: '/doubts', icon: HelpCircle },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'My Profile', href: '/profile', icon: User },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 fixed left-0 top-0 bottom-0 bg-surface border-r border-border py-6 px-4 z-40">
      <div className="flex items-center gap-2.5 mb-8 px-2">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-sm shadow-primary/30">
          <GraduationCap size={20} />
        </div>
        <div>
          <span className="text-lg font-bold text-text-main tracking-tight">EduLink</span>
          <span className="block text-[10px] font-semibold text-primary uppercase tracking-wider">SRM KTR</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5">
        {links.map((link) => {
          const isActive = pathname?.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-primary text-white shadow-sm shadow-primary/25 font-semibold' 
                  : 'text-text-muted hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:text-text-main'
              }`}
            >
              <Icon size={18} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="pt-5 border-t border-border mt-auto space-y-3">
        <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-border">
          <span className="text-xs font-medium text-text-muted">Appearance</span>
          <ThemeToggle />
        </div>

        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
