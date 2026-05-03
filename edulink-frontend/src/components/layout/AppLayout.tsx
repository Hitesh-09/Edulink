import { Sidebar } from './Sidebar';
import { MobileTabBar } from './MobileTabBar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-60 pb-16 md:pb-0">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
