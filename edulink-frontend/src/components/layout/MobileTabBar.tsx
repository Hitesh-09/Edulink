'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Search, 
  Users, 
  Calendar, 
  User 
} from 'lucide-react';

export function MobileTabBar() {
  const pathname = usePathname();

  const links = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Discover', href: '/discover', icon: Search },
    { name: 'Network', href: '/connections', icon: Users },
    { name: 'Sessions', href: '/sessions', icon: Calendar },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border pb-safe flex justify-around px-2 py-2 z-50">
      {links.map((link) => {
        const isActive = pathname?.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={`flex flex-col items-center justify-center w-16 p-1 gap-1 rounded-lg transition-colors ${
              isActive ? 'text-primary' : 'text-text-muted hover:text-text-main'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{link.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
