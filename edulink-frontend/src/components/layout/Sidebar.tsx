'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  LayoutDashboard, 
  Search, 
  Users, 
  MessageSquare, 
  Calendar, 
  User,
  LogOut
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
    { name: 'Discover', href: '/discover', icon: Search },
    { name: 'Connections', href: '/connections', icon: Users },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Sessions', href: '/sessions', icon: Calendar },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 fixed left-0 top-0 bottom-0 bg-surface border-r border-border py-6 px-4">
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">E</div>
        <span className="text-xl font-bold text-primary-dark">Edulink</span>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const isActive = pathname?.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-text-muted hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-text-main'
              }`}
            >
              <Icon size={18} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-border mt-auto space-y-4">
        <Link href="/profile" className="flex items-center gap-3 px-2 group">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500 font-bold group-hover:scale-105 transition-transform">
            U
          </div>
          <div>
            <p className="text-sm font-medium text-text-main">My Account</p>
            <p className="text-xs text-text-muted">View Profile</p>
          </div>
        </Link>
        
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-border">
          <span className="text-xs font-medium text-text-muted">Appearance</span>
          <ThemeToggle />
        </div>

        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
