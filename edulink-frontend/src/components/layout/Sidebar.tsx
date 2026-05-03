'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Discover', href: '/discover', icon: '🔍' },
    { name: 'Connections', href: '/connections', icon: '👥' },
    { name: 'Messages', href: '/messages', icon: '💬' },
    { name: 'Sessions', href: '/sessions', icon: '📅' },
    { name: 'Profile', href: '/profile', icon: '👤' },
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
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-primary' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span>{link.icon}</span>
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-border mt-auto space-y-4">
        <Link href="/profile" className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
            U
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">My Account</p>
            <p className="text-xs text-gray-500">View Profile</p>
          </div>
        </Link>
        
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
