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
    <aside className="hidden md:flex flex-col w-60 fixed left-0 top-0 bottom-0 bg-[#1C1B1C] border-r border-stone-800 py-6 px-4 z-40">
      <Link href="/dashboard" className="flex items-center gap-3 mb-8 px-2 group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF553E] to-[#FFA07A] flex items-center justify-center text-white shadow-md shadow-[#FF553E]/20 transition-transform group-hover:scale-105">
          <GraduationCap size={20} />
        </div>
        <div>
          <span className="text-lg font-bold text-white tracking-tight">EduLink</span>
          <span className="block text-[10px] font-semibold text-[#FF553E] uppercase tracking-wider">SRM KTR Campus</span>
        </div>
      </Link>

      <nav className="flex-1 space-y-1.5">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(link.href));
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-[#FF553E] text-white shadow-md shadow-[#FF553E]/25 font-semibold' 
                  : 'text-stone-400 hover:bg-stone-800/60 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-stone-800 mt-auto space-y-2.5">
        <div className="px-3 py-2 rounded-xl bg-[#141314] border border-stone-800/80 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium text-stone-400">SRM KTR Hub Live</span>
        </div>

        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-stone-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
