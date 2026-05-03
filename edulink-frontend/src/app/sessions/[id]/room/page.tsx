'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/api';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import SessionChat from '@/components/sessions/SessionChat';

export default function StudyRoomPage() {
  const { id: sessionId } = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [goals, setGoals] = useState<string[]>(['Review concepts', 'Solve problems']);
  const [resources, setResources] = useState<any[]>([]);

  const fetchRoomData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const sessionData = await apiFetch<any>(`/api/sessions/${sessionId}`);
      setSession(sessionData);
      if (sessionData.goals) setGoals(sessionData.goals);
      if (sessionData.resources) setResources(sessionData.resources);
    } catch (error) {
      console.error('Error loading room:', error);
      setToastMessage('Failed to load study room.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGoal = () => {
    const goal = prompt('Enter a new goal:');
    if (goal) setGoals([...goals, goal]);
  };

  const handleAddResource = () => {
    const name = prompt('Resource Name:');
    const url = prompt('Resource URL:');
    if (name && url) setResources([...resources, { name, url }]);
  };

  useEffect(() => {
    fetchRoomData();
  }, [sessionId]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      
      <div className="flex flex-col h-[calc(100vh-120px)] max-w-6xl mx-auto">
        {/* Room Header */}
        <div className="bg-surface border border-border rounded-2xl p-4 mb-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>← Back</Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-primary-dark">{session?.group_name}</h1>
                <Badge variant="blue">Study Room</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Join Code: <code className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded border border-primary/20">{session?.join_code || sessionId?.toString().substring(0, 6).toUpperCase()}</code></p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {session?.participants?.slice(0, 5).map((p: any, i: number) => (
                <Avatar key={i} src={p.profile?.avatar_url} name={p.profile?.full_name} size="sm" className="border-2 border-surface" />
              ))}
            </div>
            <Button variant="secondary" size="sm" onClick={() => {
              const code = session?.join_code || sessionId;
              navigator.clipboard.writeText(code as string);
              setToastMessage('Join code copied!');
            }}>Copy Code</Button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
          {/* Main Stage (Chat) */}
          <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">
            <SessionChat sessionId={session?.id || sessionId as string} currentUser={currentUser} />
            
            {/* Shared Resources */}
            <div className="h-28 bg-surface border border-border rounded-2xl p-4 shadow-sm shrink-0">
              <h3 className="text-xs font-bold text-primary-dark mb-3 uppercase tracking-wider opacity-60">Shared Resources</h3>
              <div className="flex gap-4 overflow-x-auto pb-1">
                {resources.length > 0 ? (
                  resources.map((res: any, i: number) => (
                    <div 
                      key={i} 
                      onClick={() => window.open(res.url.startsWith('http') ? res.url : `https://${res.url}`, '_blank')}
                      className="px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-blue-100 transition-colors shrink-0"
                    >
                      <span className="text-lg">🔗</span>
                      <div>
                        <p className="text-[10px] font-bold text-primary truncate max-w-[100px]">{res.name}</p>
                        <p className="text-[8px] text-gray-500">Resource</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-gray-400 italic flex items-center">No resources shared yet.</p>
                )}
                <button 
                  onClick={handleAddResource}
                  className="px-4 border-2 border-dashed border-gray-100 rounded-xl flex items-center gap-2 text-gray-400 hover:border-primary/40 hover:text-primary transition-all shrink-0"
                >
                  <span className="text-sm">+</span>
                  <span className="text-[10px] font-bold uppercase">Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar (Participants & Stats) */}
          <div className="space-y-4 flex flex-col overflow-hidden">
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex-1 flex flex-col overflow-hidden">
              <h3 className="text-sm font-bold text-primary-dark mb-4">Participants</h3>
              <div className="space-y-3 overflow-y-auto flex-1">
                {session?.participants?.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar src={p.profile?.avatar_url} name={p.profile?.full_name} size="xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{p.profile?.full_name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{p.profile?.branch || 'Student'}</p>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-5 shadow-lg text-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold opacity-90">Session Goals</h3>
                <button 
                  onClick={handleAddGoal}
                  className="text-[10px] bg-white/20 px-2 py-1 rounded-md hover:bg-white/30 transition-colors"
                >
                  + Add
                </button>
              </div>
              <ul className="space-y-2">
                {goals.map((goal, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs opacity-90">
                    <span className="w-1 h-1 bg-white rounded-full"></span> 
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
