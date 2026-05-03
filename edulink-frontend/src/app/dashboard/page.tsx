'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/insights/StatCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { apiFetch } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name);
        } else {
          setUserName('Student');
        }

        // Wrap in try-catch blocks to fallback to placeholder data if the backend isn't fully ready
        try {
          const fetchedInsights = await apiFetch<any>('/api/insights');
          setInsights(fetchedInsights);
        } catch (e) {
          setInsights({
            totalTime: '24h',
            streak: '3 Days',
            sessionsAttended: 8,
            activeConnections: 5
          });
        }

        try {
          const fetchedSessions = await apiFetch<any[]>('/api/sessions');
          setSessions(fetchedSessions || []);
        } catch (e) {
          setSessions([]); // Fallback to empty to trigger the EmptyState UI
        }

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  return (
    <AppLayout>
      <PageHeader 
        title={`Good morning, ${userName} 👋`} 
        subtitle={currentDate}
        action={
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button variant="secondary" onClick={() => router.push('/discover')}>
              Discover Students
            </Button>
            <Button onClick={() => router.push('/sessions')}>
              Schedule Session
            </Button>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard label="Total Study Time" value={insights?.totalTime || '0h'} trend="up" icon="⏳" />
            <StatCard label="Daily Streak" value={insights?.streak || '0 Days'} trend="up" icon="🔥" />
            <StatCard label="Sessions Attended" value={insights?.sessionsAttended || 0} trend="neutral" icon="📚" />
            <StatCard label="Active Connections" value={insights?.activeConnections || 0} trend="up" icon="🤝" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 h-full">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>
            
            {isLoading ? (
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Dummy activity feed items for layout display purposes */}
                <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-accent text-lg">👋</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Connected with Alex Rivera</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-primary text-lg">📅</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Joined "Data Structures 101" session</p>
                    <p className="text-xs text-gray-500">Yesterday at 4:00 PM</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="space-y-6">
          <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 h-full">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Upcoming Sessions</h2>
            
            {isLoading ? (
              <div className="space-y-4">
                <SkeletonCard />
              </div>
            ) : sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((session, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border bg-gray-50 transition-colors hover:bg-gray-100 cursor-pointer">
                    <h3 className="font-medium text-primary-dark">{session.title || 'Untitled Session'}</h3>
                    <p className="text-sm text-gray-500 mt-1">{session.date ? new Date(session.date).toLocaleString() : 'Date TBD'}</p>
                    <div className="mt-3">
                      <span className="text-xs font-medium bg-blue-100 text-primary px-2.5 py-1 rounded-full">
                        {session.participants?.length || 0} participants
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon="📅" 
                heading="No Upcoming Sessions" 
                subtext="You don't have any study sessions scheduled yet."
              />
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
